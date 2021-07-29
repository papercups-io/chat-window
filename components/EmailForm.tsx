import React from 'react';
import {Box, Button, Flex, Input} from 'theme-ui';
import {Message} from '../helpers/types';
import ResizableTextArea from './ResizableTextArea';
import SendIcon from './SendIcon';

type Props = {
  newMessagePlaceholder?: string;
  emailInputPlaceholder?: string;
  isSending?: boolean;
  onSendMessage: (message: Partial<Message>, email: string) => Promise<void>;
};

const EmailForm = ({
  newMessagePlaceholder,
  emailInputPlaceholder,
  isSending,
  onSendMessage,
}: Props) => {
  const [message, setMessage] = React.useState('');
  const [email, setEmail] = React.useState('');

  const hasValidEmail = email && email.length > 5 && email.indexOf('@') !== -1;
  const hasValidMessage = message && message.trim().length > 0;
  const isDisabled = !!isSending || !hasValidEmail || !hasValidMessage;

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setMessage(e.target.value);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);

  const handleSendMessage = (e?: any) => {
    e && e.preventDefault();

    onSendMessage({body: message}, email);
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
    <Flex
      py={2}
      px={3}
      sx={{
        flex: 1,
        flexDirection: 'column',
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 21px 4px -20px inset',
        overflowY: 'scroll',
      }}
    >
      <Box py={1} sx={{borderBottom: '1px solid rgb(230, 230, 230)'}}>
        <Input
          sx={{variant: 'styles.input.transparent'}}
          placeholder={emailInputPlaceholder || 'email@example.com'}
          autoFocus
          value={email}
          onChange={handleEmailChange}
        />
      </Box>
      <Box py={2} sx={{flex: 1}}>
        <ResizableTextArea
          sx={{
            fontFamily: 'body',
            color: 'input',
            variant: 'styles.input.transparent',
          }}
          className="TextArea--transparent"
          placeholder={newMessagePlaceholder || 'Write your message...'}
          value={message}
          onKeyDown={handleKeyDown}
          onChange={handleMessageChange}
        />
      </Box>
      <Flex sx={{justifyContent: 'flex-end'}}>
        <Button
          variant="link"
          type="submit"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '50%',
            height: '36px',
            width: '36px',
            padding: 0,
          }}
          onClick={handleSendMessage}
        >
          <SendIcon
            width={16}
            height={16}
            fill={isDisabled ? 'muted' : 'primary'}
          />
        </Button>
      </Flex>
    </Flex>
  );
};

export default EmailForm;
