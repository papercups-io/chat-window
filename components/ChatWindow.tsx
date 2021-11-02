import React from 'react';
import {Box, Flex, Heading, Text} from 'theme-ui';
import {Presence} from 'phoenix';
import {motion} from 'framer-motion';
import {
  Papercups,
  isCustomerMessage,
  isAgentMessage,
} from '@papercups-io/browser';
import ChatMessage from './ChatMessage';
import ChatFooter from './ChatFooter';
import AgentAvailability from './AgentAvailability';
import PapercupsBranding from './PapercupsBranding';
import CloseIcon from './CloseIcon';
import {
  shorten,
  shouldActivateGameMode,
  setupPostMessageHandlers,
} from '../helpers/utils';
import {
  Message,
  CustomerMetadata,
  WidgetSettings,
  QuickReply,
} from '../helpers/types';
import Logger from '../helpers/logger';
import {
  isWindowHidden,
  addVisibilityEventListener,
} from '../helpers/visibility';
import analytics from '../helpers/analytics';
import EmbeddedGame from './EmbeddedGame';
import UnreadMessages from './UnreadMessages';
import QuickReplies from './QuickReplies';

type Props = {
  inboxId?: string;
  accountId: string;
  customerId?: string;
  title?: string;
  subtitle?: string;
  baseUrl?: string;
  greeting?: string;
  awayMessage?: string;
  newMessagePlaceholder?: string;
  emailInputPlaceholder?: string;
  newMessagesNotificationText?: string;
  shouldRequireEmail?: boolean;
  isMobile?: boolean;
  customer?: CustomerMetadata;
  companyName?: string;
  agentAvailableText?: string;
  agentUnavailableText?: string;
  showAgentAvailability?: boolean;
  disableAnalyticsTracking?: boolean;
  isCloseable?: boolean;
  debug?: boolean;
  version?: string;
  ts?: string;
};

type State = {
  messages: Array<Message>;
  customerId: string;
  conversationId: string | null;
  availableAgents: Array<any>;
  settings: WidgetSettings;
  isSending: boolean;
  isOpen: boolean;
  isTransitioning: boolean;
  isGameMode?: boolean;
  shouldDisplayNotifications: boolean;
  popUpInitialMessage?: boolean;
  shouldDisplayBranding: boolean;
};

class ChatWindow extends React.Component<Props, State> {
  scrollToEl: any = null;
  subscriptions: Array<() => void> = [];
  logger: Logger;
  papercups: Papercups;

  constructor(props: Props) {
    super(props);

    const {debug: debugModeEnabled, disableAnalyticsTracking = false} = props;

    this.logger = new Logger(debugModeEnabled);

    if (!disableAnalyticsTracking) {
      this.logger.debug('Initializing analytics...');
      // Just initializes Sentry for error monitoring if available
      analytics.init();
    } else {
      this.logger.debug('Analytics disabled.');
    }

    const win = window as any;
    const doc = (document || win.document) as any;

    this.papercups = Papercups.init({
      customerId: props.customerId,
      accountId: props.accountId,
      inboxId: props.inboxId,
      baseUrl: props.baseUrl,
      customer: props.customer,
      debug: debugModeEnabled,
      setInitialMessage: this.getDefaultGreeting,
      onPresenceSync: this.onPresenceSync,
      onSetCustomerId: this.onSetCustomerId,
      onSetConversationId: this.onSetConversationId,
      onSetWidgetSettings: this.onWidgetSettingsLoaded,
      onMessagesUpdated: this.onMessagesUpdated,
      onConversationCreated: this.onConversationCreated,
      onMessageCreated: this.handleNewMessage,
    });

    this.subscriptions = [
      setupPostMessageHandlers(win, this.postMessageHandlers),
      addVisibilityEventListener(doc, this.handleVisibilityChange),
    ];

    this.state = {
      messages: [],
      // TODO: figure out how to determine these, either by IP or localStorage
      // (eventually we will probably use cookies for this)
      // TODO: remove this from state if possible, just use props instead?
      customerId: null,
      availableAgents: [],
      settings: {} as WidgetSettings,
      conversationId: null,
      isSending: false,
      isOpen: false,
      isTransitioning: false,
      isGameMode: false,
      shouldDisplayNotifications: false,
      popUpInitialMessage: false,
      shouldDisplayBranding: false,
    };
  }

  async componentDidMount() {
    await this.papercups.start();

    this.emit('chat:loaded');

    if (this.isOnDeprecatedVersion()) {
      console.warn('You are currently on a deprecated version of Papercups.');
      console.warn('Please upgrade to version 1.1.2 or above.');
    }
  }

  componentWillUnmount() {
    this.papercups.disconnect();
    this.subscriptions.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
  }

  emit = (event: string, data = {}) => {
    const payload = {...data, ts: this.props.ts};
    this.logger.debug('Sending event from iframe:', {event, payload});

    parent.postMessage({event, payload}, '*'); // TODO: remove?
  };

  postMessageHandlers = (msg: any) => {
    const {event, payload = {}} = msg.data;
    this.logger.debug('Handling in iframe:', msg.data);

    switch (event) {
      case 'customer:set:id':
        return this.papercups
          .setCustomerId(payload)
          .fetchLatestConversation(payload);
      case 'customer:update':
        return this.handleCustomerUpdated(payload);
      case 'notifications:display':
        return this.handleDisplayNotifications(payload);
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

  handleCustomerUpdated = (payload: any) => {
    const {customerId, metadata = {}} = payload;
    const {email = null, external_id: externalId = null} = metadata;
    const ts = this.props.ts || String(+new Date());
    const identifier = externalId || email || ts;

    return customerId
      ? this.papercups.updateCustomerMetadata(customerId, metadata)
      : this.papercups.identify(identifier, metadata);
  };

  handleDisplayNotifications = (payload: any) => {
    const {
      shouldDisplayNotifications = false,
      popUpInitialMessage = false,
    } = payload;

    return this.setState(
      {
        shouldDisplayNotifications,
        popUpInitialMessage,
      },
      () => {
        const unread = this.getUnreadMessages();

        if (
          shouldDisplayNotifications &&
          popUpInitialMessage &&
          unread.length === 0
        ) {
          this.markMessagesAsSeen();
        }
      }
    );
  };

  onWidgetSettingsLoaded = (settings: WidgetSettings) => {
    this.setState({settings});
  };

  onSetCustomerId = (customerId: string) => {
    this.logger.debug('Setting customer ID:', customerId);

    if (customerId !== this.state.customerId) {
      this.setState({customerId});
      this.emit('customer:updated', {customerId});
    }
  };

  onSetConversationId = (conversationId: string) => {
    this.setState({conversationId});
    this.emit('conversation:join', {
      conversationId,
      customerId: this.state.customerId,
    });
  };

  onConversationCreated = (customerId: string, data: any) => {
    this.logger.debug('Handling conversation created:', data);
  };

  onPresenceSync = (presence: Presence) => {
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
  };

  onMessagesUpdated = (messages: Array<Message>) => {
    this.setState({messages}, () => this.scrollIntoView());

    const unseenMessages = messages.filter(
      (msg: Message) => !msg.seen_at && !!msg.user_id
    );

    if (unseenMessages.length > 0) {
      const [firstUnseenMessage] = unseenMessages;

      this.emitUnseenMessage(firstUnseenMessage);
    }
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

    const {settings = {} as WidgetSettings} = this.state;
    const plan = payload && payload.plan;
    const shouldHideBranding = settings && settings.is_branding_hidden;
    const isTeamPlan = plan && String(plan).toLowerCase() === 'team';
    const shouldDisplayBranding = !(isTeamPlan && shouldHideBranding);

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

  getDefaultGreeting = (overrides = {}): Array<Message> => {
    const {greeting, awayMessage} = this.props;

    if (!greeting && !awayMessage) {
      return [];
    }

    const {settings, availableAgents = []} = this.state;
    const hasAvailableAgents = availableAgents.length > 0;
    const hasAwayMessage = awayMessage && awayMessage.length > 0;
    const isOutsideWorkingHours = settings.account?.is_outside_working_hours;
    const shouldDisplayAwayMessage =
      hasAwayMessage && isOutsideWorkingHours && !hasAvailableAgents;
    const body = shouldDisplayAwayMessage ? awayMessage : greeting;
    const hasValidMessage = body && body.trim().length > 0;

    if (!hasValidMessage) {
      return [];
    }

    return [
      {
        type: 'bot',
        customer_id: 'bot',
        body: shouldDisplayAwayMessage ? awayMessage : greeting,
        created_at: new Date().toISOString(), // TODO: what should this be?
        ...overrides,
      },
    ];
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
    if (isAgentMessage(message)) {
      this.emit('message:received', message);
    } else {
      this.emit('message:sent', message);
    }

    if (this.shouldMarkAsSeen(message)) {
      this.markMessagesAsSeen();
    } else if (isAgentMessage(message)) {
      this.emitUnseenMessage(message);
      this.playNotificationSound();
    }
  };

  shouldMarkAsSeen = (message: Message) => {
    const {isOpen} = this.state;
    const {seen_at: seenAt} = message;

    // If already seen or the page is not visible, don't mark as seen
    if (seenAt || isWindowHidden(document)) {
      return false;
    }

    return isAgentMessage(message) && isOpen;
  };

  markMessagesAsSeen = () => {
    const {customerId, conversationId} = this.state;

    this.logger.debug('Marking messages as seen!');
    this.emit('messages:seen', {});

    if (customerId && conversationId) {
      this.papercups.markMessagesAsSeen();
    }
  };

  handleSendMessage = async (message: Partial<Message>, email?: string) => {
    if (this.state.isSending) {
      return;
    }

    const {body = ''} = message;

    if (shouldActivateGameMode(body)) {
      this.setState({isGameMode: true});

      return;
    }

    this.papercups.sendNewMessage(message, email);
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
      isCustomerMessage(msg, customerId)
    );

    return !previouslySentMessages;
  };

  playNotificationSound = async (volume = 0.2) => {
    try {
      const file = '/alert.mp3';
      const audio = new Audio(file);
      audio.volume = volume;

      await audio?.play();
    } catch (err) {
      this.logger.error('Failed to play notification sound:', err);
    }
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
    const {version = '1.0.0'} = this.props;
    const [major, minor, patch] = version.split('.').map((n) => Number(n) || 0);

    return major <= 1 && minor <= 1 && patch <= 2;
  };

  handleSelectQuickReply = ({text, action}: QuickReply) => {
    this.handleSendMessage({
      body: text,
      metadata: {
        // TODO: what should this be called?
        reply_action: action,
      },
    });
  };

  getQuickReplies = (messages: Array<Message>): Array<QuickReply> => {
    if (!messages || messages.length === 0) {
      return [];
    }

    const message = messages[messages.length - 1];

    if (!isAgentMessage(message)) {
      return [];
    }

    const replies =
      message.quick_replies || message.metadata?.quick_replies || [];

    return replies.filter(
      (reply: any): reply is QuickReply => !!reply.text && !!reply.action
    );
  };

  getUnreadMessages = () => {
    const MAX_CHARS = 140;
    const {customerId, popUpInitialMessage, messages = []} = this.state;
    const [initialMessage] = messages;
    const hasOnlyBotMessage =
      messages.length === 1 &&
      initialMessage.type === 'bot' &&
      !initialMessage.seen_at;

    if (popUpInitialMessage && hasOnlyBotMessage) {
      return messages;
    }

    return messages
      .filter((msg) => {
        const {seen_at: seen, type: messageType} = msg;

        if (seen || messageType === 'bot') {
          return false;
        }

        // NB: `msg.type` doesn't come from the server, it's just a way to
        // help identify unsent messages in the frontend for now
        const isMe = isCustomerMessage(msg, customerId);

        return !isMe;
      })
      .slice(0, 2) // Only show the first 2 unread messages
      .map((msg) => {
        const {body} = msg;

        return {...msg, body: shorten(body, MAX_CHARS)};
      });
  };

  render() {
    const {
      title = 'Welcome!',
      subtitle = 'How can we help you?',
      newMessagePlaceholder = 'Start typing...',
      emailInputPlaceholder = 'Enter your email',
      agentAvailableText = "We're online right now!",
      agentUnavailableText = "We're away at the moment.",
      newMessagesNotificationText = 'View new messages',
      companyName,
      isMobile = false,
      isCloseable = true,
      showAgentAvailability = false,
      accountId,
      baseUrl,
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
      return (
        <EmbeddedGame
          isMobile={isMobile}
          onLoadGame={this.handleGameLoaded}
          onLeaveGame={this.handleLeaveGameMode}
        />
      );
    }

    if (isTransitioning) {
      return null; // TODO: need to figure out the best way to handle this
    }

    if (!isOpen && shouldDisplayNotifications) {
      return (
        <UnreadMessages
          messages={this.getUnreadMessages()}
          newMessagesNotificationText={newMessagesNotificationText}
          isMobile={isMobile}
          onOpen={this.emitOpenWindow}
        />
      );
    }

    // FIXME: only return null for versions of the chat-widget after v1.1.0
    if (!isOpen && !this.isOnDeprecatedVersion()) {
      return null;
    }

    const shouldAskForEmail = this.askForEmailUpfront();
    const hasAvailableAgents = availableAgents.length > 0;
    const replies = this.getQuickReplies(messages);

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
            const isMe = isCustomerMessage(msg, customerId);

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

          {replies && replies.length > 0 ? (
            <QuickReplies
              replies={replies}
              onSelect={this.handleSelectQuickReply}
            />
          ) : null}

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
            accountId={accountId}
            baseUrl={baseUrl}
            placeholder={newMessagePlaceholder}
            emailInputPlaceholder={emailInputPlaceholder}
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
