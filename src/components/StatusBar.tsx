import React from 'react';
import { Box, Text, useStdout } from 'ink';

interface Props {
  selectedIndex: number;
  totalBranches: number;
  message?: string | null;
  error?: string | null;
}

export const StatusBar: React.FC<Props> = ({ selectedIndex, totalBranches, message, error }) => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  const text = (() => {
    // Error takes highest priority
    if (error) {
      return ` ${error} `;
    }

    // Message takes priority over default status
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

  // Choose colors based on state
  const backgroundColor = error ? 'red' : message ? 'green' : 'blue';
  const textColor = 'white';

  return (
    <Box>
      <Text backgroundColor={backgroundColor} color={textColor}>
        {paddedText}
      </Text>
    </Box>
  );
};
