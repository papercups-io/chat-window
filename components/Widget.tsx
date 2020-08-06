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
  customer?: CustomerMetadata;
  defaultIsOpen?: boolean;
};

// TODO: DRY up with ChatWindow handlers
const setup = (w: any, handler: (msg: any) => void) => {
  const cb = (msg: any) => {
    console.log('Received message!', msg);

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

const sanitizeConfigPayload = (payload: any): Config => {
  if (!payload) {
    return {};
  }

  const {accountId, title, subtitle, primaryColor, baseUrl, greeting} = payload;

  return {
    accountId,
    title,
    subtitle,
    primaryColor,
    baseUrl,
    greeting,
  };
};

type Props = {
  config: Config;
};

const Wrapper = ({config: defaultConfig}: Props) => {
  console.log('Widget default config:', defaultConfig);
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
    console.log('Handling in wrapper:', msg.data);
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
    title = 'Welcome!',
    subtitle = 'How can we help you?',
    primaryColor = '1890ff',
    baseUrl = 'http://localhost:4000',
    greeting,
  } = config;

  const theme = getThemeConfig({primary: primaryColor});

  return (
    <ThemeProvider theme={theme}>
      <ChatWindow
        title={title}
        subtitle={subtitle}
        accountId={accountId}
        greeting={greeting}
        baseUrl={baseUrl}
      />
    </ThemeProvider>
  );
};

export default Wrapper;
