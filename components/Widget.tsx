import React from 'react';
import {ThemeProvider} from 'theme-ui';
import ChatWindow from './ChatWindow';
import {CustomerMetadata} from '../helpers/types';
import {setupPostMessageHandlers} from '../helpers/utils';
import getThemeConfig from '../helpers/theme';
import Logger from '../helpers/logger';

type Config = {
  token?: string;
  inbox?: string;
  // TODO: deprecate
  accountId?: string;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  baseUrl?: string;
  greeting?: string;
  awayMessage?: string;
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
  disableAnalyticsTracking?: boolean;
  closeable?: boolean;
  debug?: boolean;
  mobile?: boolean;
  metadata?: string; // stringified CustomerMetadata JSON
  version?: string;
  ts?: string;
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

  const valid = [
    'token',
    'inbox',
    'accountId',
    'title',
    'subtitle',
    'primaryColor',
    'baseUrl',
    'greeting',
    'awayMessage',
    'companyName',
    'requireEmailUpfront',
    'newMessagePlaceholder',
    'emailInputPlaceholder',
    'newMessagesNotificationText',
    'agentAvailableText',
    'agentUnavailableText',
    'showAgentAvailability',
    'disableAnalyticsTracking',
    'closeable',
    'debug',
    'version',
  ];

  return valid.reduce((acc, key) => {
    if (typeof payload[key] !== 'undefined') {
      return {...acc, [key]: payload[key]};
    } else {
      return acc;
    }
  }, {} as Config);
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
    const debugModeEnabled = !!Number(this.props.config.debug);

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
      token,
      inbox,
      accountId,
      customerId,
      greeting,
      awayMessage,
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
      disableAnalyticsTracking = '0',
      closeable = '1',
      debug = '0',
      mobile = '0',
      metadata = '{}',
      version = '1.0.0',
      ts,
    } = config;

    const theme = getThemeConfig({primary: primaryColor});
    const customer = parseCustomerMetadata(metadata);

    return (
      <ThemeProvider theme={theme}>
        <ChatWindow
          accountId={token || accountId}
          inboxId={inbox}
          customerId={customerId}
          title={title}
          subtitle={subtitle}
          greeting={greeting}
          awayMessage={awayMessage}
          companyName={companyName}
          newMessagePlaceholder={newMessagePlaceholder}
          emailInputPlaceholder={emailInputPlaceholder}
          newMessagesNotificationText={newMessagesNotificationText}
          agentAvailableText={agentAvailableText}
          agentUnavailableText={agentUnavailableText}
          showAgentAvailability={!!Number(showAgentAvailability)}
          shouldRequireEmail={!!Number(requireEmailUpfront)}
          isMobile={!!Number(mobile)}
          isCloseable={!!Number(closeable)}
          debug={!!Number(debug)}
          disableAnalyticsTracking={!!Number(disableAnalyticsTracking)}
          baseUrl={baseUrl}
          customer={customer}
          version={version}
          ts={ts}
        />
      </ThemeProvider>
    );
  }
}

export default Wrapper;
