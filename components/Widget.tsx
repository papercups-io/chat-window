import React from 'react';
import {ThemeProvider} from 'theme-ui';
import ChatWindow from './ChatWindow';
import {CustomerMetadata} from '../helpers/api';
import {isDev} from '../helpers/config';
import {setupPostMessageHandlers} from '../helpers/utils';
import getThemeConfig from '../helpers/theme';
import Logger from '../helpers/logger';
import {Config} from '../helpers/types';

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
    requireEmailUpfront,
    agentAvailableText,
    agentUnavailableText,
    showAgentAvailability,
    closeable,
    version,
  } = payload;

  const updates = {
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
    requireEmailUpfront,
    agentAvailableText,
    agentUnavailableText,
    showAgentAvailability,
    closeable,
    version,
  };

  return Object.keys(updates).reduce((acc, key) => {
    const value = updates[key];

    if (typeof value === 'undefined') {
      return acc;
    }

    return {...acc, [key]: value};
  }, {});
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

    return (
      <ThemeProvider theme={theme}>
        <ChatWindow
          title={title}
          subtitle={subtitle}
          accountId={accountId}
          customerId={customerId}
          greeting={greeting}
          companyName={companyName}
          newMessagePlaceholder={newMessagePlaceholder}
          emailInputPlaceholder={emailInputPlaceholder}
          newMessagesNotificationText={newMessagesNotificationText}
          agentAvailableText={agentAvailableText}
          agentUnavailableText={agentUnavailableText}
          showAgentAvailability={shouldShowAvailability}
          shouldRequireEmail={shouldRequireEmail}
          isMobile={isMobile}
          isCloseable={isCloseable}
          baseUrl={baseUrl}
          customer={customer}
          version={version}
        />
      </ThemeProvider>
    );
  }
}

export default Wrapper;
