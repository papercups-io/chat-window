import React from 'react';
import {Box, Button, Flex, Input, Textarea} from 'theme-ui';
import SendIcon from './SendIcon';

const ChatFooter = ({
  placeholder,
  emailInputPlaceholder,
  isSending,
  shouldRequireEmail,
  onSendMessage,
}: {
  placeholder?: string;
  emailInputPlaceholder?: string;
  isSending: boolean;
  shouldRequireEmail?: boolean;
  onSendMessage: (message: string, email?: string) => Promise<void>;
}) => {
  const [message, setMessage] = React.useState('');
  const [email, setEmail] = React.useState('');
  const messageInput = React.useRef(null);

  const hasValidEmail = email && email.length > 5 && email.indexOf('@') !== -1;

  const handleMessageChange = (e: any) => {
    setMessage(e.target.value);
  };

  const handleEmailChange = (e: any) => {
    setEmail(e.target.value);
  };

  const handleSetEmail = (e?: any) => {
    e && e.preventDefault();

    if (messageInput.current) {
      messageInput.current.focus();
    }
  };

  const handleSendMessage = (e?: any) => {
    e && e.preventDefault();

    onSendMessage(message, email);
    setMessage('');
    setEmail('');
  };

  const handleKeyDown = (e: any) => {
    const {key, shiftKey} = e;

    if (!shiftKey && key === 'Enter') {
      handleSendMessage(e);
    }
  };

  return (
    <Box>
      <form onSubmit={handleSetEmail}>
        {shouldRequireEmail && (
          <Box py={1} sx={{borderBottom: '1px solid rgb(230, 230, 230)'}}>
            <Input
              sx={{variant: 'styles.input.transparent'}}
              placeholder={emailInputPlaceholder}
              value={email}
              onChange={handleEmailChange}
            />
          </Box>
        )}
      </form>

      <form onSubmit={handleSendMessage}>
        <Flex sx={{alignItems: 'center'}} py={2}>
          <Box mr={3} sx={{flex: 1}}>
            <Textarea
              sx={{
                fontFamily: 'body',
                color: 'input',
                variant: 'styles.input.transparent',
              }}
              ref={messageInput}
              className="TextArea--transparent"
              placeholder={placeholder}
              rows={1}
              autoFocus
              value={message}
              disabled={shouldRequireEmail && !hasValidEmail}
              onKeyDown={handleKeyDown}
              onChange={handleMessageChange}
            />
          </Box>

          <Box pl={3}>
            <Button
              variant="primary"
              type="submit"
              disabled={isSending}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: '50%',
                height: '36px',
                width: '36px',
                padding: 0,
              }}
            >
              <SendIcon width={16} height={16} fill="background" />
            </Button>
          </Box>
        </Flex>
      </form>
    </Box>
  );
};

export default ChatFooter;
