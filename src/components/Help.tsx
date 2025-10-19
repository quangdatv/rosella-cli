import React from 'react';
import { Box, Text } from 'ink';
import { APP_DISPLAY_NAME } from '../utils/app-info.js';

export const Help: React.FC = () => {
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">{APP_DISPLAY_NAME} - Help</Text>
      </Box>

      <Box flexDirection="column">
        <Text></Text>
        <Text bold>Navigation</Text>
        <Text>  <Text color="cyan">↑/↓</Text> or <Text color="cyan">j/k</Text>   Navigate up/down</Text>
        <Text>  <Text color="cyan">Enter</Text>        Checkout selected branch</Text>
        <Text></Text>
        <Text bold>Branch Actions</Text>
        <Text>  <Text color="cyan">n</Text>            Create new branch from current</Text>
        <Text>  <Text color="cyan">Delete</Text>       Safe delete branch (git branch -d)</Text>
        <Text>  <Text color="cyan">Shift+Del</Text>    Force delete branch (git branch -D)</Text>
        <Text></Text>
        <Text bold>Search</Text>
        <Text>  <Text color="cyan">/</Text>            Start search (fuzzy match)</Text>
        <Text>  <Text color="cyan">:</Text>            Start regex search</Text>
        <Text>  <Text color="cyan">Esc</Text>          Clear search</Text>
        <Text></Text>
        <Text bold>Other</Text>
        <Text>  <Text color="cyan">h</Text>            Toggle this help</Text>
        <Text>  <Text color="cyan">q</Text>            Quit</Text>
      </Box>

      {/* Spacer to push status bar to bottom */}
      <Box flexGrow={1}></Box>

      <Box>
        <Text backgroundColor="blue" color="white">
          {' Press h, q, or Esc to close help'.padEnd(80)}
        </Text>
      </Box>

      <Box>
        <Text></Text>
      </Box>
    </Box>
  );
};
