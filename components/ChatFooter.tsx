import React from 'react';
import {Box, Button, Flex, Input} from 'theme-ui';
import Upload from 'rc-upload';
import ResizableTextArea from './ResizableTextArea';
import SendIcon from './SendIcon';
import PaperclipIcon from './PaperclipIcon';
import {Attachment, Message} from '../helpers/types';

const ChatFooter = ({
  placeholder,
  emailInputPlaceholder,
  isSending,
  shouldRequireEmail,
  accountId,
  baseUrl,
  onSendMessage,
}: {
  placeholder?: string;
  emailInputPlaceholder?: string;
  isSending: boolean;
  shouldRequireEmail?: boolean;
  accountId: string;
  baseUrl?: string;
  onSendMessage: (message: Partial<Message>, email?: string) => Promise<void>;
}) => {
  const [message, setMessage] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const messageInput = React.useRef(null);

  const hasValidEmail = email && email.length > 5 && email.indexOf('@') !== -1;
  const isDisabled = isUploading || isSending;

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
    setMessage(e.target.value);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(e.target.value);

  const handleSetEmail = (e?: React.FormEvent<HTMLFormElement>) => {
    e && e.preventDefault();

    if (messageInput.current) {
      messageInput.current.focus();
    }
  };

  const handleSendMessage = (e?: React.FormEvent<HTMLFormElement>) => {
    e && e.preventDefault();

    onSendMessage({body: message}, email);
    setMessage('');
    setEmail('');
  };

  const handleUploadStarted = () => setIsUploading(true);

  const handleUploadError = (err: any) => {
    setError(err);
    setIsUploading(false);
  };

  const handleUploadSuccess = ({data: file}: {data: Attachment}) => {
    if (file && file.id) {
      onSendMessage({body: message, file_ids: [file.id]}, email);
      setMessage('');
      setEmail('');
      setIsUploading(false);
      setError(null);
    }
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
          <Box mr={2} sx={{flex: 1}}>
            <ResizableTextArea
              sx={{
                fontFamily: 'body',
                color: 'input',
                variant: 'styles.input.transparent',
              }}
              ref={messageInput}
              className="TextArea--transparent"
              placeholder={placeholder}
              minRows={1}
              maxRows={4}
              autoFocus
              value={message}
              disabled={isDisabled || (shouldRequireEmail && !hasValidEmail)}
              onKeyDown={handleKeyDown}
              onChange={handleMessageChange}
            />
          </Box>

          <Flex>
            <Upload
              action={`${baseUrl}/api/upload`}
              data={{account_id: accountId}}
              headers={{'X-Requested-With': null}}
              onStart={handleUploadStarted}
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
            >
              <Button
                variant="link"
                type="button"
                disabled={isDisabled}
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
                <PaperclipIcon
                  width={16}
                  height={16}
                  fill={error ? 'red' : 'gray'}
                />
              </Button>
            </Upload>

            <Button
              variant="primary"
              type="submit"
              disabled={isDisabled}
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
          </Flex>
        </Flex>
      </form>
    </Box>
  );
};

export default ChatFooter;
