import React from 'react';
import {Box, Flex, Heading, Text} from 'theme-ui';
import {Socket} from 'phoenix';
import {motion} from 'framer-motion';
import ChatMessage from './ChatMessage';
import ChatFooter from './ChatFooter';
import * as API from '../helpers/api';
import {Message, now} from '../helpers/utils';
import {getWebsocketUrl} from '../helpers/config';

// TODO: set this up somewhere else
const setup = (w: any, handler: (msg: any) => void) => {
  console.debug('Setting up!');

  const cb = (msg: any) => {
    console.debug('Received message!', msg);

    handler(msg);
  };

  if (w.addEventListener) {
    w.addEventListener('message', cb);

    return () => w.removeEventListener('message', cb);
  } else {
    w.attachEvent('onmessage', cb);

    return () => w.detachEvent('message', cb);
  }
};

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
};

type State = {
  messages: Array<Message>;
  customerId: string;
  conversationId: string | null;
  isSending: boolean;
  isOpen: boolean;
};

class ChatWindow extends React.Component<Props, State> {
  scrollToEl: any = null;

  unsubscribe: () => {};
  socket: any;
  channel: any;

  constructor(props: Props) {
    super(props);

    this.state = {
      messages: [],
      // TODO: figure out how to determine these, either by IP or localStorage
      // (eventually we will probably use cookies for this)
      // TODO: remove this from state if possible, just use props instead?
      customerId: props.customerId,
      conversationId: null,
      isSending: false,
      isOpen: false,
    };
  }

  componentDidMount() {
    const {baseUrl, customerId} = this.props;
    const win = window as any;

    this.unsubscribe = setup(win, this.postMessageHandlers);

    const websocketUrl = getWebsocketUrl(baseUrl);

    this.socket = new Socket(websocketUrl);
    this.socket.connect();

    this.fetchLatestConversation(customerId);
    this.emit('chat:loaded');
  }

  componentWillUnmount() {
    this.channel && this.channel.leave();
    this.unsubscribe && this.unsubscribe();
  }

  emit = (event: string, payload?: any) => {
    console.debug('Sending event from iframe:', {event, payload});

    parent.postMessage({event, payload}, '*'); // TODO: remove?
  };

  postMessageHandlers = (msg: any) => {
    const {event, payload = {}} = msg.data;
    console.debug('Handling in iframe:', msg.data);

    switch (event) {
      case 'customer:update':
        const {customerId, metadata} = payload;

        return this.updateExistingCustomer(customerId, metadata);
      case 'papercups:toggle':
        return this.setState({isOpen: !!payload.isOpen});
      case 'papercups:ping':
        return console.debug('Pong!');
      default:
        return null;
    }
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
        created_at: now().toISOString(), // TODO: what should this be?
      },
    ];
  };

  fetchLatestConversation = async (customerId: string) => {
    if (!customerId) {
      // If there's no customerId, we haven't seen this customer before,
      // so do nothing until they try to create a new message
      this.setState({messages: [...this.getDefaultGreeting()]});

      return;
    }

    const {accountId, baseUrl, customer: metadata} = this.props;

    console.debug('Fetching conversations for customer:', customerId);

    try {
      const conversations = await API.fetchCustomerConversations(
        customerId,
        accountId,
        baseUrl
      );

      console.debug('Found existing conversations:', conversations);

      if (!conversations || !conversations.length) {
        // If there are no conversations yet, wait until the customer creates
        // a new message to create the new conversation
        this.setState({messages: [...this.getDefaultGreeting()]});

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
    } catch (err) {
      console.debug('Error fetching conversations!', err);
    }
  };

  createNewCustomerId = async (accountId: string, email?: string) => {
    const {baseUrl, customer} = this.props;
    const metadata = email ? {...customer, email} : customer;
    const {id: customerId} = await API.createNewCustomer(
      accountId,
      metadata,
      baseUrl
    );

    this.emit('customer:created', {customerId});

    return customerId;
  };

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
      console.debug('Error updating customer metadata!', err);
    }
  };

  initializeNewConversation = async (email?: string) => {
    const {accountId, baseUrl} = this.props;

    const customerId = await this.createNewCustomerId(accountId, email);
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

    console.debug('Joining channel:', conversationId);

    this.channel = this.socket.channel(`conversation:${conversationId}`, {
      customer_id: customerId,
    });

    // TODO: deprecate 'shout' event in favor of 'message:created'
    this.channel.on('shout', (message: any) => {
      this.handleNewMessage(message);
    });

    this.channel
      .join()
      .receive('ok', (res: any) => {
        console.debug('Joined successfully!', res);
      })
      .receive('error', (err: any) => {
        console.debug('Unable to join!', err);
      });

    this.emit('conversation:join', {conversationId, customerId});
    this.scrollToEl.scrollIntoView();
  };

  areDatesEqual = (x: string, y: string) => {
    return Math.floor(+new Date(x) / 1000) === Math.floor(+new Date(y) / 1000);
  };

  handleNewMessage = (message: Message) => {
    this.emit('message:received', {message});

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
      this.scrollToEl.scrollIntoView();
    });
  };

  handleSendMessage = async (message: string, email?: string) => {
    const {customerId, conversationId, isSending} = this.state;

    if (isSending || !message || message.trim().length === 0) {
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
      () => this.scrollToEl.scrollIntoView()
    );

    if (!customerId || !conversationId) {
      await this.initializeNewConversation(email);
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
  };

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
    const previouslySentMessages = messages.find(
      (msg) => msg.customer_id === customerId
    );

    return !customerId && !previouslySentMessages;
  };

  render() {
    const {
      title = 'Welcome!',
      subtitle = 'How can we help you?',
      newMessagePlaceholder = 'Start typing...',
      isMobile = false,
    } = this.props;
    const {customerId, messages = [], isSending, isOpen} = this.state;
    const shouldAskForEmail = this.askForEmailUpfront();

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
        <Box py={3} px={4} sx={{bg: 'primary'}}>
          <Heading
            as="h2"
            className="Papercups-heading"
            sx={{color: 'background', my: 1}}
          >
            {title}
          </Heading>
          <Text sx={{color: 'offset'}}>{subtitle}</Text>
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
            const isMe =
              msg.customer_id === customerId ||
              (msg.sent_at && msg.type === 'customer');

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
                  isLastInGroup={isLastInGroup}
                  shouldDisplayTimestamp={shouldDisplayTimestamp}
                />
              </motion.div>
            );
          })}
          <div ref={(el) => (this.scrollToEl = el)} />
        </Box>
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
