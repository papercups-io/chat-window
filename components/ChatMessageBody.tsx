import React from 'react';
import ReactMarkdown from 'react-markdown';
import breaks from 'remark-breaks';
import {Box, Image, ThemeUICSSObject} from 'theme-ui';
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
  // eslint-disable-next-line react/display-name
  img: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
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
        {isImageFile ? (
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
  sx?: ThemeUICSSObject;
  attachments?: Array<Attachment>;
};

const ChatMessageBody = ({
  className,
  content,
  sx,
  attachments = [],
}: ChatMessageBodyProps): JSX.Element => {
  const parsedSx = Object.assign(
    {
      px: '14px',
      py: 2,
      borderRadius: 4,
      maxWidth: '80%',
      p: {mb: 0},
      ul: {my: 2},
      ol: {my: 2},
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
        allowedElements={allowedElements}
        components={renderers}
        remarkPlugins={[breaks, [emoji, {emoticon: true}]]}
      >
        {content}
      </ReactMarkdown>
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
