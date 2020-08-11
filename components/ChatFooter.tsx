import React from 'react';
import {Box, Button, Flex, Input, Textarea} from 'theme-ui';
import SendIcon from './SendIcon';

const ChatFooter = ({
  placeholder,
  isSending,
  shouldRequireEmail,
  onSendMessage,
}: {
  placeholder?: string;
  isSending: boolean;
  shouldRequireEmail?: boolean;
  onSendMessage: (message: string, email?: string) => Promise<void>;
}) => {
  const [message, setMessage] = React.useState('');
  const [email, setEmail] = React.useState('');

  const hasValidEmail = email && email.length > 5 && email.indexOf('@') !== -1;

  const handleMessageChange = (e: any) => {
    setMessage(e.target.value);
  };

  const handleEmailChange = (e: any) => {
    setEmail(e.target.value);
  };

  const handleSendMessage = (e?: any) => {
    e && e.preventDefault();

    onSendMessage(message, email).then(() => {
      setMessage('');
      setEmail('');
    });
  };

  const handleKeyDown = (e: any) => {
    const {key, shiftKey} = e;

    if (!shiftKey && key === 'Enter') {
      handleSendMessage(e);
    }
  };

  return (
    <Box>
      <form onSubmit={handleSendMessage}>
        {shouldRequireEmail && (
          <Box py={1} sx={{borderBottom: '1px solid rgb(230, 230, 230)'}}>
            <Input
              sx={{variant: 'styles.input.transparent'}}
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
            />
          </Box>
        )}

        <Flex sx={{alignItems: 'center'}} py={2}>
          <Box mr={3} sx={{flex: 1}}>
            <Textarea
              sx={{
                fontFamily: 'body',
                color: 'input',
                variant: 'styles.input.transparent',
              }}
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
