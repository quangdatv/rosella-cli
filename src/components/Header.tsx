import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  version: string;
  cwd: string;
}

export const Header: React.FC<Props> = ({ version, cwd }) => {
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>Rosella</Text>
        <Text> {version}</Text>
      </Box>
      <Box>
        <Text dimColor>{cwd}</Text>
      </Box>
    </Box>
  );
};
