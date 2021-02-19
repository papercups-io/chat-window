import React, {useContext} from 'react';
import Logger from '../helpers/logger';
import {CustomerMetadata} from '../helpers/types';
import {isDev} from '../helpers/config';
import {setupPostMessageHandlers} from '../helpers/utils';

type StringifiedConfig = {
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
  showAgentAvailability?: '0' | '1';
  defaultIsOpen?: '0' | '1';
  requireEmailUpfront?: '0' | '1';
  closeable?: '0' | '1';
  mobile?: '0' | '1';
  metadata?: string; // stringified CustomerMetadata JSON
  version?: string;
};

export type Config = {
  accountId: string;
  customerId?: string;
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  baseUrl?: string;
  greeting?: string;
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
  isCloseable?: boolean;
  version?: string;
};

const parseCustomerMetadata = (str: string): CustomerMetadata => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return {} as CustomerMetadata;
  }
};

const sanitizeConfigPayload = (
  payload?: Record<string, any> | null
): Partial<StringifiedConfig> => {
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

const parseStringifiedConfig = (payload: StringifiedConfig): Config => {
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
  } = payload;

  return {
    title,
    subtitle,
    accountId,
    customerId,
    greeting,
    primaryColor,
    companyName,
    newMessagePlaceholder,
    emailInputPlaceholder,
    newMessagesNotificationText,
    agentAvailableText,
    agentUnavailableText,
    baseUrl,
    version,
    shouldRequireEmail: !!Number(requireEmailUpfront),
    isMobile: !!Number(mobile),
    isCloseable: !!Number(closeable),
    showAgentAvailability: !!Number(showAgentAvailability),
    customer: parseCustomerMetadata(metadata),
  };
};

export const ConfigurationContext = React.createContext<{
  config: Config;
  logger: Logger;
}>({
  config: null,
  logger: null,
});

export const useConfig = () => useContext(ConfigurationContext);

type Props = React.PropsWithChildren<{config: StringifiedConfig}>;
type State = {config: StringifiedConfig};

class ConfigProvider extends React.Component<Props, State> {
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

    return (
      <ConfigurationContext.Provider
        value={{
          config: parseStringifiedConfig(config),
          logger: this.logger,
        }}
      >
        {this.props.children}
      </ConfigurationContext.Provider>
    );
  }
}

export default ConfigProvider;
