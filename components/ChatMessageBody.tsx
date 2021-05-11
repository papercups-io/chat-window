import React from 'react';
import ReactMarkdown from 'react-markdown';
import breaks from 'remark-breaks';
import {Box, Image} from 'theme-ui';
import emoji from 'remark-emoji';
import {Attachment} from '../helpers/types';

/**
 * Whitelist elements that we allow when we render markdown.
 * Reference https://github.com/remarkjs/react-markdown#appendix-b-components
 */
export const allowedElements: any[] = [
  'br',
  'p',
  'em',
  'strong',
  'blockquote',
  'a',
  'ol',
  'ul',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'pre',
  'code',
  'img',
];

const renderers = {
  img: (props: any) => {
    return <img {...props} style={{maxWidth: '100%', maxHeight: 400}} />;
  },
};

const ChatMessageAttachment = ({attachment}: {attachment: Attachment}) => {
  const {
    id,
    filename,
    file_url: fileUrl,
    content_type: contentType,
  } = attachment;
  const isImageFile = contentType.indexOf('image') !== -1;

  return (
    <Box key={id} mb={1}>
      <a
        href={fileUrl}
        style={{
          textDecoration: 'underline',
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        {isImageFile && false ? (
          <Box>
            <Image alt={filename} src={fileUrl} />
          </Box>
        ) : (
          filename
        )}
      </a>
    </Box>
  );
};

type ChatMessageBodyProps = {
  className?: string;
  content: string;
  sx?: object;
  attachments?: Array<Attachment>;
};

const ChatMessageBody = ({
  className,
  content,
  sx,
  attachments = [],
}: ChatMessageBodyProps) => {
  const parsedSx = Object.assign(
    {
      px: '14px',
      py: 2,
      borderRadius: 4,
      maxWidth: '80%',
      p: {
        mb: 0,
      },
      blockquote: {
        px: 2,
        borderLeft: '3px solid',
        mb: 0,
      },
    },
    sx
  );

  return (
    <Box sx={parsedSx}>
      <ReactMarkdown
        className={`Text--markdown ${className || ''}`}
        children={content}
        allowedElements={allowedElements}
        components={renderers}
        remarkPlugins={[breaks, [emoji, {emoticon: true}]]}
      />
      {attachments && attachments.length > 0 && (
        <Box mt={2} className={`Text--markdown ${className || ''}`}>
          {attachments.map((attachment) => {
            return (
              <ChatMessageAttachment
                key={attachment.id}
                attachment={attachment}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default ChatMessageBody;
