import React from 'react';
import {Link, Flex} from 'theme-ui';
import {motion} from 'framer-motion';
import {PopupChatMessage} from './ChatMessage';
import {Message} from '../helpers/types';

type Props = {
  messages: Array<Message>;
  newMessagesNotificationText?: string;
  isMobile?: boolean;
  onOpen: (e: any) => void;
};

const UnreadMessages = ({
  messages,
  newMessagesNotificationText,
  isMobile,
  onOpen,
}: Props) => {
  if (messages.length === 0) {
    return null;
  }

  // If the total number of characters in the previewed messages is more
  // than one hundred (100), only show the first message (rather than two)
  const chars = messages.reduce((acc, msg) => acc + msg.body.length, 0);
  const displayed = chars > 100 ? messages.slice(0, 1) : messages;

  return (
    <Flex
      className={isMobile ? 'Mobile' : ''}
      sx={{
        bg: 'transparent',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        height: '100%',
        width: '100%',
        flex: 1,
      }}
    >
      {displayed.map((msg, key) => {
        return (
          <motion.div
            key={key}
            initial={{opacity: 0, x: -2}}
            animate={{opacity: 1, x: 0}}
            transition={{duration: 0.2, ease: 'easeIn'}}
          >
            <PopupChatMessage key={key} message={msg} />
          </motion.div>
        );
      })}

      <Flex mt={2} pr={2} sx={{justifyContent: 'flex-end'}}>
        <Link onClick={onOpen}>{newMessagesNotificationText}</Link>
      </Flex>
    </Flex>
  );
};

export default UnreadMessages;
