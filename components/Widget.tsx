import React from 'react';
import {ThemeProvider} from 'theme-ui';
import ChatWindow from './ChatWindow';
import {CustomerMetadata} from '../helpers/api';
import getThemeConfig from '../helpers/theme';

type Config = {
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  accountId?: string;
  baseUrl?: string;
  greeting?: string;
  customerId?: string;
  newMessagePlaceholder?: string;
  defaultIsOpen?: boolean;
  requireEmailUpfront?: boolean;
  mobile?: boolean;
  metadata?: string; // stringified CustomerMetadata JSON
};

// TODO: DRY up with ChatWindow handlers
const setup = (w: any, handler: (msg: any) => void) => {
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
    newMessagePlaceholder,
  } = payload;

  return {
    accountId,
    title,
    subtitle,
    primaryColor,
    baseUrl,
    greeting,
    newMessagePlaceholder,
  };
};

type Props = {
  config: Config;
};

const Wrapper = ({config: defaultConfig}: Props) => {
  console.debug('Widget default config:', defaultConfig);
  const [config, setConfig] = React.useState(defaultConfig);

  React.useEffect(() => {
    const unsubscribe = setup(window, handlers);

    return () => unsubscribe();
  }, []);

  function handleConfigUpdate(payload) {
    const updates = sanitizeConfigPayload(payload);

    setConfig({...config, ...updates});
  }

  function handlers(msg: any) {
    console.debug('Handling in wrapper:', msg.data);
    const {event, payload = {}} = msg.data;

    switch (event) {
      case 'config:update':
        return handleConfigUpdate(payload);
      default:
        return null;
    }
  }

  if (Object.keys(config).length === 0) {
    return null;
  }

  const {
    accountId,
    customerId,
    greeting,
    title = 'Welcome!',
    subtitle = 'How can we help you?',
    newMessagePlaceholder = 'Start typing...',
    primaryColor = '1890ff',
    baseUrl = 'https://app.papercups.io',
    requireEmailUpfront = '0',
    mobile = '0',
    metadata = '{}',
  } = config;

  const shouldRequireEmail = !!Number(requireEmailUpfront);
  const isMobile = !!Number(mobile);
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
        newMessagePlaceholder={newMessagePlaceholder}
        shouldRequireEmail={shouldRequireEmail}
        isMobile={isMobile}
        baseUrl={baseUrl}
        customer={customer}
      />
    </ThemeProvider>
  );
};

export default Wrapper;
