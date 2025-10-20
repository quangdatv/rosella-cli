import React from 'react';
import { Box, Text, useStdout } from 'ink';

interface Props {
  totalBranches: number;
  message?: string | null;
  error?: string | null;
  hints?: string | null;
}

export const StatusBar: React.FC<Props> = ({ totalBranches, message, error, hints }) => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  // Primary content: Status, message, or error -> hints
  const content = (() => {
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

    // Secondary content: Hints or empty
    if (hints) {
      return ` ${hints} `;
    }

    return ''; // Empty string instead of single space
  })();

  // Helper to pad text to full width
  const padToWidth = (text: string, maxWidth: number): string => {
    return text + ' '.repeat(Math.max(0, maxWidth - text.length));
  };

  let line1: string;
  let line2: string;

  // Determine what content to show
  if (content.length <= width) {
    // Fits on one line - put on line 1
    line1 = padToWidth(content, width);
    line2 = padToWidth('', width);
  } else if (content.length <= width * 2) {
    // Fits on two lines - split smartly
    // Try to split at a word boundary near the middle
    let splitPoint = width;
    const searchStart = Math.max(0, width - 20);
    const pipeIndex = content.lastIndexOf('|', width);

    if (pipeIndex > searchStart) {
      // Split at the last pipe before width
      splitPoint = pipeIndex;
      line1 = padToWidth(content.substring(0, splitPoint).trimEnd() + ' ', width);
      line2 = padToWidth(content.substring(splitPoint).trimStart(), width);
    } else {
      // No good split point - just split at width
      line1 = padToWidth(content.substring(0, width), width);
      line2 = padToWidth(content.substring(width), width);
    }
  } else {
    // Too long for two lines - truncate
    line1 = padToWidth(content.substring(0, width), width);
    line2 = padToWidth(content.substring(width, width * 2 - 2) + '… ', width);
  }

  // Choose colors based on state
  const backgroundColor = error ? 'red' : message ? 'green' : 'blue';
  const textColor = 'white';

  return (
    <Box flexDirection="column">
      <Text backgroundColor={backgroundColor} color={textColor}>
        {line1}
      </Text>
      <Text backgroundColor={backgroundColor} color={textColor}>
        {line2}
      </Text>
    </Box>
  );
};
