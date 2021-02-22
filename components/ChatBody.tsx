import React from 'react';
import {Box} from 'theme-ui';
import {motion} from 'framer-motion';
import ChatMessage from './ChatMessage';
import {Message} from '../helpers/types';
import {isCustomerMessage} from '../helpers/utils';

const ChatBody = ({
  messages,
  companyName,
  customerId,
  scrollToRef,
}: {
  messages: Array<Message>;
  companyName: string;
  customerId: string;
  scrollToRef: (el: any) => void;
}) => {
  return (
    <Box
      p={3}
      sx={{
        flex: 1,
        boxShadow: 'rgba(0, 0, 0, 0.2) 0px 21px 4px -20px inset',
        overflowY: 'scroll',
      }}
    >
      {messages.map((msg, key) => {
        // Slight hack
        const next = messages[key + 1];
        const isLastInGroup = next
          ? msg.customer_id !== next.customer_id
          : true;
        const shouldDisplayTimestamp = key === messages.length - 1;
        // NB: `msg.type` doesn't come from the server, it's just a way to
        // help identify unsent messages in the frontend for now
        const isMe = isCustomerMessage(msg, customerId);

        return (
          <motion.div
            key={key}
            initial={{opacity: 0, x: isMe ? 2 : -2}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.2, ease: 'easeIn'}}
          >
            <ChatMessage
              key={key}
              message={msg}
              isMe={isMe}
              companyName={companyName}
              isLastInGroup={isLastInGroup}
              shouldDisplayTimestamp={shouldDisplayTimestamp}
            />
          </motion.div>
        );
      })}
      <div ref={scrollToRef} />
    </Box>
  );
};

export default ChatBody;
