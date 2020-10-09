import React from 'react';
import {Box, Flex, Text} from 'theme-ui';

const AgentAvailability = ({
  hasAvailableAgents,
  agentAvailableText,
  agentUnavailableText,
}: {
  hasAvailableAgents: boolean;
  agentAvailableText: string;
  agentUnavailableText: string;
}) => {
  return (
    <Flex
      px={20}
      py={1}
      sx={{
        bg: 'lighter',
        borderTop: '1px solid rgba(230, 230, 230, 0.25)',
        alignItems: 'center',
      }}
    >
      <Box
        mr={2}
        sx={{
          height: 8,
          width: 8,
          bg: hasAvailableAgents ? 'green' : 'muted',
          border: '1px solid #fff',
          borderRadius: '50%',
        }}
      ></Box>
      <Text sx={{color: 'offset', fontSize: 12}}>
        {hasAvailableAgents ? agentAvailableText : agentUnavailableText}
      </Text>
    </Flex>
  );
};

export default AgentAvailability;
