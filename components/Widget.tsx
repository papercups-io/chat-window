import React from 'react';
import {ThemeProvider} from 'theme-ui';
import ChatWindow from './ChatWindow';
import getThemeConfig from '../helpers/theme';
import {useConfig} from './ConfigProvider';

const WidgetWrapper = () => {
  const {config} = useConfig();

  if (Object.keys(config).length === 0) {
    return null;
  }

  const {
    accountId,
    customerId,
    title,
    subtitle,
    primaryColor,
    baseUrl,
    greeting,
    newMessagePlaceholder,
    emailInputPlaceholder,
    newMessagesNotificationText,
    shouldRequireEmail,
    isMobile,
    customer,
    companyName,
    agentAvailableText,
    agentUnavailableText,
    showAgentAvailability,
    isCloseable,
    version,
  } = config;
  const theme = getThemeConfig({primary: primaryColor});

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
        showAgentAvailability={showAgentAvailability}
        shouldRequireEmail={shouldRequireEmail}
        isMobile={isMobile}
        isCloseable={isCloseable}
        baseUrl={baseUrl}
        customer={customer}
        version={version}
      />
    </ThemeProvider>
  );
};

export default WidgetWrapper;
