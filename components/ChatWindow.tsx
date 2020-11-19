import React from 'react';
import {Box, Button, Flex, Heading, Text, Link} from 'theme-ui';
import {Socket, Presence} from 'phoenix';
import {motion} from 'framer-motion';
import ChatMessage, {PopupChatMessage} from './ChatMessage';
import ChatFooter from './ChatFooter';
import AgentAvailability from './AgentAvailability';
import PapercupsBranding from './PapercupsBranding';
import CloseIcon from './CloseIcon';
import * as API from '../helpers/api';
import {
  Message,
  shorten,
  shouldActivateGameMode,
  setupPostMessageHandlers,
} from '../helpers/utils';
import {isDev, getWebsocketUrl} from '../helpers/config';
import Logger from '../helpers/logger';
import {
  isWindowHidden,
  addVisibilityEventListener,
} from '../helpers/visibility';

type Props = {
  accountId: string;
  customerId?: string;
  title?: string;
  subtitle?: string;
  baseUrl?: string;
  greeting?: string;
  newMessagePlaceholder?: string;
  shouldRequireEmail?: boolean;
  isMobile?: boolean;
  customer?: API.CustomerMetadata;
  companyName?: string;
  agentAvailableText?: string;
  agentUnavailableText?: string;
  showAgentAvailability?: boolean;
  isCloseable?: boolean;
  version?: string;
};

type State = {
  messages: Array<Message>;
  customerId: string;
  conversationId: string | null;
  availableAgents: Array<any>;
  isSending: boolean;
  isOpen: boolean;
  isTransitioning: boolean;
  isGameMode?: boolean;
  shouldDisplayNotifications: boolean;
  shouldDisplayBranding: boolean;
};

class ChatWindow extends React.Component<Props, State> {
  scrollToEl: any = null;

  subscriptions: Array<() => void> = [];
  socket: any;
  channel: any;
  logger: Logger;

  constructor(props: Props) {
    super(props);

    this.state = {
      messages: [],
      // TODO: figure out how to determine these, either by IP or localStorage
      // (eventually we will probably use cookies for this)
      // TODO: remove this from state if possible, just use props instead?
      customerId: null,
      availableAgents: [],
      conversationId: null,
      isSending: false,
      isOpen: false,
      isTransitioning: false,
      isGameMode: false,
      shouldDisplayNotifications: false,
      shouldDisplayBranding: false,
    };
  }

  async componentDidMount() {
    const {
      baseUrl,
      customerId: cachedCustomerId,
      customer: metadata,
    } = this.props;
    const win = window as any;
    const doc = (document || win.document) as any;
    // TODO: make it possible to opt into debug mode
    const debugModeEnabled = isDev(win);

    this.logger = new Logger(debugModeEnabled);

    const isValidCustomer = await this.isValidCustomer(cachedCustomerId);
    const customerId = isValidCustomer ? cachedCustomerId : null;

    this.setState({customerId});
    this.subscriptions = [
      setupPostMessageHandlers(win, this.postMessageHandlers),
      addVisibilityEventListener(doc, this.handleVisibilityChange),
    ];

    const websocketUrl = getWebsocketUrl(baseUrl);

    this.socket = new Socket(websocketUrl);
    this.socket.connect();
    this.listenForAgentAvailability();

    await this.fetchLatestConversation(customerId, metadata);

    this.emit('chat:loaded');

    if (this.isOnDeprecatedVersion()) {
      console.warn('You are currently on a deprecated version of Papercups.');
      console.warn('Please upgrade to version 1.1.2 or above.');
    }
  }

  componentWillUnmount() {
    this.channel && this.channel.leave();
    this.subscriptions.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
  }

  emit = (event: string, payload?: any) => {
    this.logger.debug('Sending event from iframe:', {event, payload});

    parent.postMessage({event, payload}, '*'); // TODO: remove?
  };

  postMessageHandlers = (msg: any) => {
    const {event, payload = {}} = msg.data;
    this.logger.debug('Handling in iframe:', msg.data);

    switch (event) {
      case 'customer:update':
        const {customerId, metadata} = payload;

        return this.updateExistingCustomer(customerId, metadata);
      case 'notifications:display':
        return this.setState({
          shouldDisplayNotifications: !!payload.shouldDisplayNotifications,
        });
      case 'papercups:toggle':
        return this.handleToggleDisplay(payload);
      case 'papercups:plan':
        return this.handlePapercupsPlan(payload);
      case 'papercups:ping':
        return this.logger.debug('Pong!');
      default:
        return null;
    }
  };

  listenForNewConversations = (customerId: string) => {
    const {customer: metadata} = this.props;

    const channel = this.socket.channel(`conversation:lobby:${customerId}`, {});

    channel.on('conversation:created', (payload: any) => {
      console.debug('Conversation created!', payload);
      // TODO: clean this up a bit?
      this.fetchLatestConversation(customerId, metadata);
    });

    channel
      .join()
      .receive('ok', (res: any) => {
        console.debug('Successfully listening for new conversations!', res);
      })
      .receive('error', (err: any) => {
        console.debug('Unable to listen for new conversations!', err);
      });
  };

  listenForAgentAvailability = () => {
    const {accountId} = this.props;
    const room = this.socket.channel(`room:${accountId}`, {});

    room
      .join()
      .receive('ok', (res: any) => {
        this.logger.debug('Joined room successfully!', res);
      })
      .receive('error', (err: any) => {
        this.logger.debug('Unable to join room!', err);
      });

    const presence = new Presence(room);

    presence.onSync(() => {
      this.logger.debug('Syncing presence:', presence.list());

      this.setState({
        availableAgents: presence
          .list()
          .map(({metas}) => {
            const [info] = metas;

            return info;
          })
          .filter((info) => !!info.user_id),
      });
    });
  };

  scrollIntoView = () => {
    this.scrollToEl && this.scrollToEl.scrollIntoView(false);
  };

  // If the page is not visible (i.e. user is looking at another tab),
  // we want to mark messages as read once the chat widget becomes visible
  // again, as long as it's open.
  handleVisibilityChange = (e?: any) => {
    const doc = document || (e && e.target);

    if (isWindowHidden(doc)) {
      return;
    }

    const {messages = []} = this.state;
    const shouldMarkSeen = messages.some((msg) => this.shouldMarkAsSeen(msg));

    if (shouldMarkSeen) {
      this.markMessagesAsSeen();
    }
  };

  handlePapercupsPlan = (payload: any = {}) => {
    this.logger.debug('Handling subscription plan:', payload);

    const plan = payload && payload.plan;
    const shouldDisplayBranding = plan
      ? String(plan).toLowerCase() === 'starter'
      : false;

    this.setState({shouldDisplayBranding});
  };

  handleToggleDisplay = (payload: any = {}) => {
    const isOpen = !!payload.isOpen;

    this.setState({isOpen, isTransitioning: false}, () => {
      this.handleVisibilityChange();

      if (isOpen) {
        this.scrollIntoView();
      }
    });
  };

  getDefaultGreeting = (ts?: number): Array<Message> => {
    const {greeting} = this.props;

    if (!greeting) {
      return [];
    }

    return [
      {
        type: 'bot',
        customer_id: 'bot',
        body: greeting, // 'Hi there! How can I help you?',
        created_at: new Date().toISOString(), // TODO: what should this be?
        seen_at: new Date().toISOString(),
      },
    ];
  };

  isValidUuid = (id: string) => {
    if (!id || !id.length) {
      return false;
    }

    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return regex.test(id);
  };

  isValidCustomer = async (customerId?: string | null) => {
    if (!customerId || !customerId.length) {
      return false;
    }

    if (!this.isValidUuid(customerId)) {
      return false;
    }

    const {baseUrl, accountId} = this.props;

    try {
      const isValidCustomer = await API.isValidCustomer(
        customerId,
        accountId,
        baseUrl
      );

      return isValidCustomer;
    } catch (err) {
      this.logger.warn('Failed to validate customer ID.');
      this.logger.warn('You might be on an older version of Papercups.');
      // Return true for backwards compatibility
      return true;
    }
  };

  // Check if we have a matching customer based on the `external_id` provided
  // in the customer metadata. Otherwise, fallback to the cached customer id.
  checkForExistingCustomer = async (
    metadata?: API.CustomerMetadata,
    defaultCustomerId?: string | null
  ): Promise<string | null> => {
    if (!metadata || !metadata?.external_id) {
      this.setState({customerId: defaultCustomerId});

      return defaultCustomerId;
    }

    const {accountId, baseUrl} = this.props;
    const {external_id: externalId} = metadata;
    const {
      customer_id: matchingCustomerId,
    } = await API.findCustomerByExternalId(externalId, accountId, baseUrl);

    if (!matchingCustomerId) {
      this.setState({customerId: null});

      return null;
    } else if (matchingCustomerId === defaultCustomerId) {
      this.setState({customerId: defaultCustomerId});

      return defaultCustomerId;
    } else {
      this.setState({customerId: matchingCustomerId});
      // Emit update so we can cache the ID in the parent window
      this.emit('customer:updated', {customerId: matchingCustomerId});

      return matchingCustomerId;
    }
  };

  // Check if we've seen this customer before; if we have, try to fetch
  // the latest existing conversation for that customer. Otherwise, we wait
  // until the customer initiates the first message to create the conversation.
  fetchLatestConversation = async (
    cachedCustomerId?: string | null,
    metadata?: API.CustomerMetadata
  ) => {
    const customerId = await this.checkForExistingCustomer(
      metadata,
      cachedCustomerId
    );

    if (!customerId) {
      // If there's no customerId, we haven't seen this customer before,
      // so do nothing until they try to create a new message
      this.setState({messages: [...this.getDefaultGreeting()]});

      return;
    }

    const {accountId, baseUrl} = this.props;

    this.logger.debug('Fetching conversations for customer:', customerId);

    try {
      const conversations = await API.fetchCustomerConversations(
        customerId,
        accountId,
        baseUrl
      );

      this.logger.debug('Found existing conversations:', conversations);

      if (!conversations || !conversations.length) {
        // If there are no conversations yet, wait until the customer creates
        // a new message to create the new conversation
        this.setState({messages: [...this.getDefaultGreeting()]});
        this.listenForNewConversations(customerId);

        return;
      }

      const [latest] = conversations;
      const {id: conversationId, messages = []} = latest;
      const formattedMessages = messages.sort(
        (a: Message, b: Message) =>
          +new Date(a.created_at) - +new Date(b.created_at)
      );

      this.setState({
        conversationId,
        messages: [...this.getDefaultGreeting(), ...formattedMessages],
      });

      this.joinConversationChannel(conversationId, customerId);

      await this.updateExistingCustomer(customerId, metadata);

      const unseenMessages = formattedMessages.filter(
        (msg: Message) => !msg.seen_at && !!msg.user_id
      );

      if (unseenMessages.length > 0) {
        const [firstUnseenMessage] = unseenMessages;

        this.emitUnseenMessage(firstUnseenMessage);
      }
    } catch (err) {
      this.logger.debug('Error fetching conversations!', err);
    }
  };

  createOrUpdateCustomer = async (
    accountId: string,
    existingCustomerId?: string,
    email?: string
  ): Promise<string> => {
    const {baseUrl, customer} = this.props;
    const metadata = email ? {...customer, email} : customer;

    try {
      const {id: customerId} = existingCustomerId
        ? await API.updateCustomerMetadata(
            existingCustomerId,
            metadata,
            baseUrl
          )
        : await API.createNewCustomer(accountId, metadata, baseUrl);

      if (!existingCustomerId) {
        this.emit('customer:created', {customerId});
      }

      return customerId;
    } catch (err) {
      // TODO: this edge case may occur if the cached customer ID somehow
      // gets messed up (e.g. between dev and prod environments). The long term
      // fix should be changing the cache key for different environments.
      this.logger.error('Failed to update or create customer:', err);
      this.logger.error('Retrying...');

      const {id: customerId} = await API.createNewCustomer(
        accountId,
        metadata,
        baseUrl
      );

      this.emit('customer:created', {customerId});

      return customerId;
    }
  };

  // Updates the customer with metadata fields like `name`, `email`, `external_id`
  // to make it easier to identify customers in the dashboard.
  updateExistingCustomer = async (
    customerId: string,
    metadata?: API.CustomerMetadata
  ) => {
    if (!metadata) {
      return;
    }

    try {
      const {baseUrl} = this.props;

      await API.updateCustomerMetadata(customerId, metadata, baseUrl);
    } catch (err) {
      this.logger.debug('Error updating customer metadata!', err);
    }
  };

  initializeNewConversation = async (
    existingCustomerId?: string,
    email?: string
  ) => {
    const {accountId, baseUrl} = this.props;
    const customerId = await this.createOrUpdateCustomer(
      accountId,
      existingCustomerId,
      email
    );
    const {id: conversationId} = await API.createNewConversation(
      accountId,
      customerId,
      baseUrl
    );

    this.setState({customerId, conversationId});
    this.joinConversationChannel(conversationId, customerId);

    return {customerId, conversationId};
  };

  joinConversationChannel = (conversationId: string, customerId?: string) => {
    if (this.channel && this.channel.leave) {
      this.channel.leave(); // TODO: what's the best practice here?
    }

    this.logger.debug('Joining channel:', conversationId);

    this.channel = this.socket.channel(`conversation:${conversationId}`, {
      customer_id: customerId,
    });

    // TODO: deprecate 'shout' event in favor of 'message:created'
    this.channel.on('shout', (message: any) => {
      this.setState({isGameMode: false}, () => this.handleNewMessage(message));
    });

    this.channel
      .join()
      .receive('ok', (res: any) => {
        this.logger.debug('Joined conversation successfully!', res);
      })
      .receive('error', (err: any) => {
        this.logger.debug('Unable to join conversation!', err);
      });

    this.emit('conversation:join', {conversationId, customerId});
    this.scrollIntoView();
  };

  isCustomerMessage = (message: Message, customerId: string): boolean => {
    return (
      message.customer_id === customerId ||
      (message.sent_at && message.type === 'customer')
    );
  };

  areDatesEqual = (x: string, y: string) => {
    return Math.floor(+new Date(x) / 1000) === Math.floor(+new Date(y) / 1000);
  };

  emitUnseenMessage = (message: Message) => {
    this.emit('messages:unseen', {message});
  };

  emitOpenWindow = (e: any) => {
    this.emit('papercups:open', {});
    // This is the state where we are waiting for parent window to reply,
    // letting us know when the transition from closed to open is over
    this.setState({isTransitioning: true});
  };

  emitCloseWindow = (e: any) => {
    this.emit('papercups:close', {});
  };

  handleNewMessage = (message: Message) => {
    this.emit('message:received', message);

    const {messages = []} = this.state;
    const unsent = messages.find(
      (m) =>
        !m.created_at &&
        this.areDatesEqual(m.sent_at, message.sent_at) &&
        m.body === message.body
    );
    const updated = unsent
      ? messages.map((m) => (m.sent_at === unsent.sent_at ? message : m))
      : [...messages, message];

    this.setState({messages: updated}, () => {
      this.scrollIntoView();

      if (this.shouldMarkAsSeen(message)) {
        this.markMessagesAsSeen();
      } else if (!unsent) {
        // If the message was not `unsent`, we know it came from the other end,
        // in which case we should indicate that it hasn't been seen yet.
        this.emitUnseenMessage(message);
      }
    });
  };

  shouldMarkAsSeen = (message: Message) => {
    const {isOpen} = this.state;
    const {user_id: agentId, seen_at: seenAt} = message;
    const isAgentMessage = !!agentId;

    // If already seen or the page is not visible, don't mark as seen
    if (seenAt || isWindowHidden(document)) {
      return false;
    }

    return isAgentMessage && isOpen;
  };

  markMessagesAsSeen = () => {
    const {customerId, conversationId, messages = []} = this.state;

    if (!this.channel || !customerId || !conversationId) {
      return;
    }

    this.logger.debug('Marking messages as seen!');

    this.channel.push('messages:seen', {});
    this.emit('messages:seen', {});
    this.setState({
      messages: messages.map((msg) => {
        return msg.seen_at ? msg : {...msg, seen_at: new Date().toISOString()};
      }),
    });
  };

  handleSendMessage = async (message: string, email?: string) => {
    const {customerId, conversationId, isSending} = this.state;

    if (isSending || !message || message.trim().length === 0) {
      return;
    }

    if (shouldActivateGameMode(message)) {
      this.setState({isGameMode: true});

      return;
    }

    const sentAt = new Date().toISOString();
    // TODO: figure out how this should work if `customerId` is null
    const payload: Message = {
      body: message,
      customer_id: customerId,
      type: 'customer',
      sent_at: sentAt,
    };

    this.setState(
      {
        messages: [...this.state.messages, payload],
      },
      () => this.scrollIntoView()
    );

    if (!customerId || !conversationId) {
      await this.initializeNewConversation(customerId, email);
    }

    // We should never hit this block, just adding to satisfy TypeScript
    if (!this.channel) {
      return;
    }

    // TODO: deprecate 'shout' event in favor of 'message:created'
    this.channel.push('shout', {
      body: message,
      customer_id: this.state.customerId,
      sent_at: sentAt,
    });

    // TODO: should this only be emitted after the message is successfully sent?
    this.emit('message:sent', {
      body: message,
      type: 'customer',
      sent_at: sentAt,
      customer_id: this.state.customerId,
      conversation_id: this.state.conversationId,
    });
  };

  // If this is true, we don't allow the customer to send any messages
  // until they enter an email address in the chat widget.
  askForEmailUpfront = () => {
    const {customer, shouldRequireEmail} = this.props;
    const {customerId, messages = []} = this.state;

    if (!shouldRequireEmail) {
      return false;
    }

    if (customer && customer.email) {
      return false;
    }

    // TODO: figure out what this actual logic should be...
    const previouslySentMessages = messages.find((msg) =>
      this.isCustomerMessage(msg, customerId)
    );

    return !previouslySentMessages;
  };

  handleGameLoaded = (e: any) => {
    if (e.currentTarget && e.currentTarget.focus) {
      e.currentTarget.focus();
    }
  };

  handleLeaveGameMode = () => {
    this.setState({isGameMode: false}, () => this.scrollIntoView());
  };

  isOnDeprecatedVersion = (): boolean => {
    const {accountId, version = '1.0.0'} = this.props;

    // TODO: remove after testing
    if (accountId === '873f5102-d267-4b09-9de0-d6e741e0e076') {
      return false;
    }

    return version < '1.1.2';
  };

  renderEmbeddedGame() {
    const {isMobile = false} = this.props;

    return (
      <Flex
        className={isMobile ? 'Mobile' : ''}
        sx={{
          bg: 'background',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          flex: 1,
        }}
      >
        <motion.iframe
          src={`https://reichert621.github.io/?v=2`}
          sandbox="allow-same-origin allow-scripts allow-top-navigation"
          style={{
            flex: 1,
            width: '100%',
            border: 'none',
            boxShadow: 'none',
          }}
          initial={{opacity: 0, y: 2}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.4, ease: 'easeIn'}}
          onLoad={this.handleGameLoaded}
        />
        <Flex
          p={3}
          sx={{
            justifyContent: 'center',
            boxShadow: 'inset rgba(35, 47, 53, 0.09) 0px 2px 8px 0px',
          }}
        >
          <Button
            variant="primary"
            sx={{width: '100%'}}
            onClick={this.handleLeaveGameMode}
          >
            Back to chat
          </Button>
        </Flex>
      </Flex>
    );
  }

  // TODO: make it possible to disable this feature?
  renderUnreadMessages() {
    const MAX_CHARS = 140;

    const {isMobile = false} = this.props;
    const {customerId, messages = []} = this.state;
    const unread = messages
      .filter((msg) => {
        const {seen_at: seen} = msg;

        if (seen) {
          return false;
        }

        // NB: `msg.type` doesn't come from the server, it's just a way to
        // help identify unsent messages in the frontend for now
        const isMe = this.isCustomerMessage(msg, customerId);

        return !isMe;
      })
      .slice(0, 2) // Only show the first 2 unread messages
      .map((msg) => {
        const {body} = msg;

        return {...msg, body: shorten(body, MAX_CHARS)};
      });

    if (unread.length === 0) {
      return null;
    }

    // If the total number of characters in the previewed messages is more
    // than one hundred (100), only show the first message (rather than two)
    const chars = unread.reduce((acc, msg) => acc + msg.body.length, 0);
    const displayed = chars > 100 ? unread.slice(0, 1) : unread;

    return (
      <Flex
        className={isMobile ? 'Mobile' : ''}
        sx={{
          bg: 'transparent',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          height: '100%',
          width: '100%',
          flex: 1,
        }}
      >
        {displayed.map((msg, key) => {
          return (
            <motion.div
              key={key}
              initial={{opacity: 0, x: -2}}
              animate={{opacity: 1, x: 0}}
              transition={{duration: 0.2, ease: 'easeIn'}}
            >
              <PopupChatMessage key={key} message={msg} />
            </motion.div>
          );
        })}

        <Flex mt={2} pr={2} sx={{justifyContent: 'flex-end'}}>
          <Link onClick={this.emitOpenWindow}>View new messages</Link>
        </Flex>
      </Flex>
    );
  }

  render() {
    const {
      title = 'Welcome!',
      subtitle = 'How can we help you?',
      newMessagePlaceholder = 'Start typing...',
      agentAvailableText = "We're online right now!",
      agentUnavailableText = "We're away at the moment.",
      companyName,
      isMobile = false,
      isCloseable = true,
      showAgentAvailability = false,
    } = this.props;
    const {
      customerId,
      messages = [],
      availableAgents = [],
      isSending,
      isOpen,
      isTransitioning,
      isGameMode,
      shouldDisplayNotifications,
      shouldDisplayBranding,
    } = this.state;

    if (isGameMode) {
      return this.renderEmbeddedGame();
    }

    if (isTransitioning) {
      return null; // TODO: need to figure out the best way to handle this
    }

    if (!isOpen && shouldDisplayNotifications) {
      return this.renderUnreadMessages();
    }

    // FIXME: only return null for versions of the chat-widget after v1.1.0
    if (!isOpen && !this.isOnDeprecatedVersion()) {
      return null;
    }

    const shouldAskForEmail = this.askForEmailUpfront();
    const hasAvailableAgents = availableAgents.length > 0;

    return (
      <Flex
        className={isMobile ? 'Mobile' : ''}
        sx={{
          bg: 'background',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          flex: 1,
        }}
      >
        <Box sx={{bg: 'primary', position: 'relative'}}>
          <Box pt={3} pb={showAgentAvailability ? 12 : 16} px={20}>
            {/* TODO: wrap in a button element */}
            {isCloseable && !this.isOnDeprecatedVersion() && (
              <CloseIcon
                className="CloseIcon"
                width={24}
                height={24}
                onClick={this.emitCloseWindow}
              />
            )}
            <Heading
              as="h2"
              className="Papercups-heading"
              sx={{color: 'background', my: 1, mr: 12}}
            >
              {title}
            </Heading>
            <Text sx={{color: 'offset'}}>{subtitle}</Text>
          </Box>

          {showAgentAvailability && (
            <AgentAvailability
              hasAvailableAgents={hasAvailableAgents}
              agentAvailableText={agentAvailableText}
              agentUnavailableText={agentUnavailableText}
            />
          )}
        </Box>

        <Box
          p={3}
          sx={{
            flex: 1,
            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 21px 4px -20px inset',
            overflowY: 'scroll',
          }}
        >
          {messages.map((msg, key) => {
            // Slight hack
            const next = messages[key + 1];
            const isLastInGroup = next
              ? msg.customer_id !== next.customer_id
              : true;
            const shouldDisplayTimestamp = key === messages.length - 1;
            // NB: `msg.type` doesn't come from the server, it's just a way to
            // help identify unsent messages in the frontend for now
            const isMe = this.isCustomerMessage(msg, customerId);

            return (
              <motion.div
                key={key}
                initial={{opacity: 0, x: isMe ? 2 : -2}}
                animate={{opacity: 1, x: 0}}
                transition={{duration: 0.2, ease: 'easeIn'}}
              >
                <ChatMessage
                  key={key}
                  message={msg}
                  isMe={isMe}
                  companyName={companyName}
                  isLastInGroup={isLastInGroup}
                  shouldDisplayTimestamp={shouldDisplayTimestamp}
                />
              </motion.div>
            );
          })}
          <div ref={(el) => (this.scrollToEl = el)} />
        </Box>
        {shouldDisplayBranding && <PapercupsBranding />}
        <Box
          px={2}
          sx={{
            borderTop: '1px solid rgb(230, 230, 230)',
            // TODO: only show shadow on focus TextArea below
            boxShadow: 'rgba(0, 0, 0, 0.1) 0px 0px 100px 0px',
          }}
        >
          {/*
            NB: we use a `key` prop here to force re-render on open so
            that the input will auto-focus appropriately
          */}
          <ChatFooter
            key={isOpen ? 1 : 0}
            placeholder={newMessagePlaceholder}
            isSending={isSending}
            shouldRequireEmail={shouldAskForEmail}
            onSendMessage={this.handleSendMessage}
          />
        </Box>
        <img
          alt="Papercups"
          src="https://papercups.s3.us-east-2.amazonaws.com/papercups-logo.svg"
          width="0"
          height="0"
        />
      </Flex>
    );
  }
}

export default ChatWindow;
