import React from 'react';
import {Box, Button, Flex, Textarea} from 'theme-ui';
import SendIcon from './SendIcon';

const ChatFooter = ({
  message,
  placeholder,
  isSending,
  onKeyDown,
  onChangeMessage,
  onSendMessage,
}: {
  message: string;
  placeholder?: string;
  isSending: boolean;
  onKeyDown: (e: any) => void;
  onChangeMessage: (e: any) => void;
  onSendMessage: () => void;
}) => {
  return (
    <form onSubmit={onSendMessage}>
      <Flex sx={{alignItems: 'center'}}>
        <Box mr={3} sx={{flex: 1}}>
          <Textarea
            sx={{
              fontFamily: 'body',
              color: 'input',
              variant: 'styles.textarea.transparent',
            }}
            className="TextArea--transparent"
            placeholder={placeholder}
            rows={1}
            autoFocus
            value={message}
            onKeyDown={onKeyDown}
            onChange={onChangeMessage}
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
  );
};

export default ChatFooter;
