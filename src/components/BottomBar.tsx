import React from 'react';
import { Box, Text } from 'ink';
import type { SearchState } from '../types/index.js';

interface Props {
  confirmation?: {
    active: boolean;
    branchName: string;
  } | null;
  checkoutPrompt?: {
    active: boolean;
    branchName: string;
  } | null;
  search: SearchState;
  creation: {
    active: boolean;
    branchName: string;
  };
  message?: string | null;
}

export const BottomBar: React.FC<Props> = ({
  confirmation,
  checkoutPrompt,
  search,
  creation,
  message,
}) => {
  // Prompts override message when active
  if (confirmation?.active) {
    return (
      <Box>
        <Text color="yellow">
          Delete branch '{confirmation.branchName}'? (y=normal, f=force, other=cancel)
        </Text>
      </Box>
    );
  }

  if (checkoutPrompt?.active) {
    return (
      <Box>
        <Text color="yellow">
          Branch '{checkoutPrompt.branchName}' created. Checkout now? (y/n)
        </Text>
      </Box>
    );
  }

  if (search.active) {
    return (
      <Box>
        <Text>
          {search.mode === 'regex' ? 'Regex search: ' : 'Fuzzy search: '}
          {search.query}
          <Text inverse> </Text>
        </Text>
      </Box>
    );
  }

  if (creation.active) {
    return (
      <Box>
        <Text>
          New branch: {creation.branchName}
          <Text inverse> </Text>
        </Text>
      </Box>
    );
  }

  if (message) {
    return (
      <Box>
        <Text color="green">{message}</Text>
      </Box>
    );
  }

  return null;
};
