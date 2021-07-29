import React from 'react';
import {Button, Flex} from 'theme-ui';
import {motion} from 'framer-motion';

type Props = {
  isMobile?: boolean;
  onLoadGame: (e: any) => void;
  onLeaveGame: () => void;
};

const EmbeddedGame = ({isMobile, onLoadGame, onLeaveGame}: Props) => {
  return (
    <Flex
      className={isMobile ? 'Mobile' : ''}
      sx={{
        bg: 'background',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        flex: 1,
      }}
    >
      <motion.iframe
        src={`https://reichert621.github.io/?v=2`}
        sandbox="allow-same-origin allow-scripts allow-top-navigation"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          boxShadow: 'none',
        }}
        initial={{opacity: 0, y: 2}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.4, ease: 'easeIn'}}
        onLoad={onLoadGame}
      />
      <Flex
        p={3}
        sx={{
          justifyContent: 'center',
          boxShadow: 'inset rgba(35, 47, 53, 0.09) 0px 2px 8px 0px',
        }}
      >
        <Button variant="primary" sx={{width: '100%'}} onClick={onLeaveGame}>
          Back to chat
        </Button>
      </Flex>
    </Flex>
  );
};

export default EmbeddedGame;
