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

type Props = {
  config: Config;
};

const Wrapper = ({config}: Props) => {
  // console.log({config});
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

  const customer = null;

  // if (!accountId) {
  //   throw new Error('An accountId is required to render the chat window!');
  // }

  // console.log({accountId, title, subtitle, greeting});

  const theme = getThemeConfig({primary: primaryColor});

  return (
    <ThemeProvider theme={theme}>
      <ChatWindow
        title={title}
        subtitle={subtitle}
        accountId={accountId}
        greeting={greeting}
        customer={customer}
        baseUrl={baseUrl}
      />
    </ThemeProvider>
  );
};

export default Wrapper;
