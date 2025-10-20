import React from 'react';
import { Box, Text } from 'ink';
import { APP_DISPLAY_NAME } from '../utils/app-info.js';

interface Props {
  version: string;
  gitVersion: string;
  cwd: string;
}

export const Header: React.FC<Props> = ({ version, gitVersion, cwd }) => {
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>{APP_DISPLAY_NAME}</Text>
        <Text> {version}</Text>
        <Text dimColor> | {gitVersion}</Text>
      </Box>
      <Box>
        <Text dimColor>{cwd}</Text>
      </Box>
    </Box>
  );
};
