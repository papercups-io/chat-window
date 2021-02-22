import React from 'react';
import {Box, Button, Flex, Heading, Text, Link} from 'theme-ui';
import AgentAvailability from './AgentAvailability';
import CloseIcon from './CloseIcon';

const ChatHeader = ({
  title,
  subtitle,
  showAgentAvailability,
  hasAvailableAgents,
  agentAvailableText,
  agentUnavailableText,
  isCloseable,
  onClose,
}: {
  title: string;
  subtitle: string;
  showAgentAvailability?: boolean;
  hasAvailableAgents?: boolean;
  agentAvailableText?: string;
  agentUnavailableText?: string;
  isCloseable?: boolean;
  onClose: (e: any) => void;
}) => {
  return (
    <Box sx={{bg: 'primary', position: 'relative'}}>
      <Box pt={3} pb={showAgentAvailability ? 12 : 16} px={20}>
        {/* TODO: wrap in a button element */}
        {isCloseable && (
          <CloseIcon
            className="CloseIcon"
            width={24}
            height={24}
            onClick={onClose}
          />
        )}
        <Heading
          as="h2"
          className="Papercups-heading"
          sx={{color: 'background', my: 1, mr: 12}}
        >
          {title}
        </Heading>
        <Text sx={{color: 'offset'}}>{subtitle}</Text>
      </Box>

      {showAgentAvailability && (
        <AgentAvailability
          hasAvailableAgents={hasAvailableAgents}
          agentAvailableText={agentAvailableText}
          agentUnavailableText={agentUnavailableText}
        />
      )}
    </Box>
  );
};

export default ChatHeader;
