import React from 'react';
import ReactMarkdown from 'react-markdown';
import breaks from 'remark-breaks';
import {Twemoji} from 'react-emoji-render';
import {Box} from 'theme-ui';

/**
 * Whitelist node types that we allow when we render markdown.
 * Reference https://github.com/rexxars/react-markdown#node-types
 */
export const allowedNodeTypes: any[] = [
  'root',
  'text',
  'break',
  'paragraph',
  'emphasis',
  'strong',
  'blockquote',
  'delete',
  'link',
  'linkReference',
  'list',
  'listItem',
  'heading',
  'inlineCode',
  'code',
];

const renderers = {
  text: (props: any) => {
    return <Twemoji text={props.children} />;
  },
};

type ChatMessageBodyProps = {
  className?: string;
  content: string;
  sx?: object;
};

const ChatMessageBody = ({className, content, sx}: ChatMessageBodyProps) => {
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
        source={content}
        allowedTypes={allowedNodeTypes}
        renderers={renderers}
        plugins={[breaks]}
      />
    </Box>
  );
};

export default ChatMessageBody;
