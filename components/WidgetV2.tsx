import React from 'react';
import {ThemeProvider} from 'theme-ui';
import ChatBuilder from './ChatBuilder';
import ChatHeader from './ChatHeader';
import ChatBody from './ChatBody';
import ChatFooter from './ChatFooter';
import {CustomerMetadata} from '../helpers/api';
import {isDev} from '../helpers/config';
import {setupPostMessageHandlers} from '../helpers/utils';
import getThemeConfig from '../helpers/theme';
import Logger from '../helpers/logger';

type Config = {
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  accountId?: string;
  baseUrl?: string;
  greeting?: string;
  customerId?: string;
  newMessagePlaceholder?: string;
  emailInputPlaceholder?: string;
  newMessagesNotificationText?: string;
  companyName?: string;
  agentAvailableText?: string;
  agentUnavailableText?: string;
  showAgentAvailability?: boolean;
  defaultIsOpen?: boolean;
  requireEmailUpfront?: boolean;
  closeable?: boolean;
  mobile?: boolean;
  metadata?: string; // stringified CustomerMetadata JSON
  version?: string;
};

const parseCustomerMetadata = (str: string): CustomerMetadata => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return {} as CustomerMetadata;
  }
};

const sanitizeConfigPayload = (payload: any): Config => {
  if (!payload) {
    return {};
  }

  const {
    accountId,
    title,
    subtitle,
    primaryColor,
    baseUrl,
    greeting,
    companyName,
    newMessagePlaceholder,
    emailInputPlaceholder,
    newMessagesNotificationText,
    agentAvailableText,
    agentUnavailableText,
    showAgentAvailability,
    closeable,
    version,
  } = payload;

  return {
    accountId,
    title,
    subtitle,
    primaryColor,
    baseUrl,
    greeting,
    companyName,
    newMessagePlaceholder,
    emailInputPlaceholder,
    newMessagesNotificationText,
    agentAvailableText,
    agentUnavailableText,
    showAgentAvailability,
    closeable,
    version,
  };
};

type Props = {config: Config};
type State = {config: Config};

class Wrapper extends React.Component<Props, State> {
  logger: Logger;
  unsubscribe: () => void;

  constructor(props: Props) {
    super(props);

    this.state = {
      config: props.config,
    };
  }

  componentDidMount() {
    // TODO: make it possible to opt into debug mode
    const debugModeEnabled = isDev(window);

    this.logger = new Logger(debugModeEnabled);
    this.unsubscribe = setupPostMessageHandlers(
      window,
      this.postMessageHandlers
    );
  }

  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe();
  }

  postMessageHandlers = (msg: any) => {
    this.logger.debug('Handling in wrapper:', msg.data);
    const {event, payload = {}} = msg.data;

    switch (event) {
      case 'config:update':
        return this.handleConfigUpdate(payload);
      default:
        return null;
    }
  };

  handleConfigUpdate = (payload: any) => {
    const updates = sanitizeConfigPayload(payload);
    this.logger.debug('Updating widget config:', updates);

    this.setState({config: {...this.state.config, ...updates}});
  };

  render() {
    const {config = {}} = this.state;

    if (Object.keys(config).length === 0) {
      return null;
    }

    const {
      accountId,
      customerId,
      greeting,
      companyName,
      agentAvailableText,
      agentUnavailableText,
      title = 'Welcome!',
      subtitle = 'How can we help you?',
      newMessagePlaceholder = 'Start typing...',
      emailInputPlaceholder = 'Enter your email',
      newMessagesNotificationText = 'View new messages',
      primaryColor = '1890ff',
      baseUrl = 'https://app.papercups.io',
      requireEmailUpfront = '0',
      showAgentAvailability = '0',
      closeable = '1',
      mobile = '0',
      metadata = '{}',
      version = '1.0.0',
    } = config;

    const shouldRequireEmail = !!Number(requireEmailUpfront);
    const isMobile = !!Number(mobile);
    const isCloseable = !!Number(closeable);
    const shouldShowAvailability = !!Number(showAgentAvailability);
    const theme = getThemeConfig({primary: primaryColor});
    const customer = parseCustomerMetadata(metadata);

    const formatted = {
      accountId,
      customerId,
      greeting,
      companyName,
      agentAvailableText,
      agentUnavailableText,
      title,
      subtitle,
      newMessagePlaceholder,
      emailInputPlaceholder,
      newMessagesNotificationText,
      primaryColor,
      baseUrl,
      shouldRequireEmail,
      customer,
      isMobile,
      isCloseable,
      showAgentAvailability: shouldShowAvailability,
    };

    return (
      <ThemeProvider theme={theme}>
        <ChatBuilder
          config={formatted}
          version={version}
          header={({config, state, onClose}) => {
            const {
              title = 'Welcome!',
              subtitle = 'How can we help you?',
              agentAvailableText = "We're online right now!",
              agentUnavailableText = "We're away at the moment.",
              showAgentAvailability,
              isCloseable,
            } = config;
            const {availableAgents = []} = state;

            return (
              <ChatHeader
                title={title}
                subtitle={subtitle}
                showAgentAvailability={showAgentAvailability}
                agentAvailableText={agentAvailableText}
                agentUnavailableText={agentUnavailableText}
                isCloseable={isCloseable}
                hasAvailableAgents={availableAgents.length > 0}
                onClose={onClose}
              />
            );
          }}
          body={({config, state, scrollToRef}) => {
            const {companyName} = config;
            const {customerId, messages = []} = state;

            return (
              <ChatBody
                messages={messages}
                companyName={companyName}
                customerId={customerId}
                scrollToRef={scrollToRef}
              />
            );
          }}
          footer={({config, state, onSendMessage}) => {
            const {
              accountId,
              baseUrl,
              newMessagePlaceholder = 'Start typing...',
              emailInputPlaceholder = 'Enter your email',
            } = config;
            const {isOpen, isSending} = state;

            return (
              <ChatFooter
                key={isOpen ? 1 : 0}
                accountId={accountId}
                baseUrl={baseUrl}
                placeholder={newMessagePlaceholder}
                emailInputPlaceholder={emailInputPlaceholder}
                isSending={isSending}
                // FIXME
                shouldRequireEmail={false}
                onSendMessage={onSendMessage}
              />
            );
          }}
        />
      </ThemeProvider>
    );
  }
}

export default Wrapper;
