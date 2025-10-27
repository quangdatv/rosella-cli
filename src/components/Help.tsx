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
        <Text>  <Text color="cyan">↑/↓</Text> or <Text color="cyan">j/k</Text>     Navigate branch list up/down</Text>
        <Text>  <Text color="cyan">←/→</Text>              Navigate status bar actions</Text>
        <Text>  <Text color="cyan">PgUp/PgDn</Text>        Page up/down</Text>
        <Text>  <Text color="cyan">Enter</Text>            Execute selected action</Text>
        <Text></Text>
        <Text bold>Actions (Current Branch)</Text>
        <Text>  <Text color="cyan">1</Text>                Create new branch</Text>
        <Text>  <Text color="cyan">2</Text>                Pull from remote</Text>
        <Text>  <Text color="cyan">3</Text>                Push to remote</Text>
        <Text>  <Text color="cyan">4</Text>                Fetch from remote</Text>
        <Text></Text>
        <Text bold>Actions (Other Branch)</Text>
        <Text>  <Text color="cyan">1</Text>                Checkout branch</Text>
        <Text>  <Text color="cyan">2</Text>                Create new branch</Text>
        <Text>  <Text color="cyan">3</Text>                Delete branch</Text>
        <Text>  <Text color="cyan">4</Text>                Merge into current</Text>
        <Text>  <Text color="cyan">5</Text>                Rebase current onto selected</Text>
        <Text>  <Text color="cyan">6</Text>                Fetch from remote</Text>
        <Text></Text>
        <Text bold>Search</Text>
        <Text>  <Text color="cyan">/</Text>                Start search (fuzzy match)</Text>
        <Text>  <Text color="cyan">*</Text>                Start regex search</Text>
        <Text>  <Text color="cyan">Enter</Text>            Exit search (keep selection)</Text>
        <Text>  <Text color="cyan">Esc</Text>              Clear search</Text>
        <Text></Text>
        <Text bold>Other</Text>
        <Text>  <Text color="cyan">h</Text>                Toggle this help</Text>
        <Text>  <Text color="cyan">q</Text> or <Text color="cyan">Esc</Text>         Quit (with confirmation)</Text>
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
