import React from 'react';
import {Box, Button, Flex} from 'theme-ui';
import {motion} from 'framer-motion';
import {QuickReply} from '../helpers/types';

type Props = {
  replies: Array<QuickReply>;
  onSelect: (reply: QuickReply) => void;
};

const QuickReplies = ({replies, onSelect}: Props) => {
  if (!replies || !replies.length) {
    return null;
  }

  return (
    <Flex
      pb={5}
      sx={{
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      {replies.map((reply) => {
        const {text, action} = reply;

        return (
          <motion.div
            key={action}
            initial={{opacity: 0, x: -2}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.2, ease: 'easeIn'}}
          >
            <Box key={action} mb={2}>
              <Button
                variant="secondary"
                px={2}
                py={1}
                sx={{maxWidth: 200, textAlign: 'left'}}
                onClick={() => onSelect(reply)}
              >
                {text}
              </Button>
            </Box>
          </motion.div>
        );
      })}
    </Flex>
  );
};

export default QuickReplies;
