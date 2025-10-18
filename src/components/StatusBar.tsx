import React from 'react';
import { Box, Text, useStdout } from 'ink';

interface Props {
  selectedIndex: number;
  totalBranches: number;
  message?: string | null;
}

export const StatusBar: React.FC<Props> = ({ selectedIndex, totalBranches, message }) => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  const text = (() => {
    // Message takes priority and overrides the default status
    if (message) {
      return ` ${message} `;
    }

    if (totalBranches === 0) {
      return ' No branches ';
    }
    return ` [press h for help] - line ${selectedIndex + 1} of ${totalBranches} `;
  })();

  // Pad to full width
  const paddedText = text + ' '.repeat(Math.max(0, width - text.length));

  return (
    <Box>
      <Text backgroundColor="blue" color="white">
        {paddedText}
      </Text>
    </Box>
  );
};
