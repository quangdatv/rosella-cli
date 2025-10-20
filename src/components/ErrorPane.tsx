import React from 'react';
import { Box, Text } from 'ink';
import { useStdout } from 'ink';

interface Props {
  error: string;
}

export const ErrorPane: React.FC<Props> = ({ error }) => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;
  const height = stdout?.rows || 24;

  // Split error into lines
  const errorLines = error.split('\n');

  // Calculate max content height - leave space for dividers and title
  const maxContentHeight = Math.min(height - 6, 20);

  // Wrap long lines to fit within terminal width
  const wrappedLines: string[] = [];
  for (const line of errorLines) {
    if (line.length <= width) {
      wrappedLines.push(line);
    } else {
      // Split long lines
      for (let i = 0; i < line.length; i += width) {
        wrappedLines.push(line.substring(i, i + width));
      }
    }
  }

  // Limit to maxContentHeight
  const displayLines = wrappedLines.slice(0, maxContentHeight);
  const hasMore = wrappedLines.length > maxContentHeight;

  // Create divider
  const divider = '─'.repeat(width);

  // Center the pane vertically
  const totalPaneHeight = displayLines.length + 5 + (hasMore ? 1 : 0); // +5 for 3 dividers + title + dismiss
  const topPadding = Math.max(0, Math.floor((height - totalPaneHeight) / 2));

  return (
    <Box flexDirection="column" paddingTop={topPadding}>
      {/* Top divider */}
      <Box>
        <Text color="red">{divider}</Text>
      </Box>

      {/* Title */}
      <Box>
        <Text color="red" bold>ERROR</Text>
      </Box>

      {/* Divider after title */}
      <Box>
        <Text color="red">{divider}</Text>
      </Box>

      {/* Error content */}
      {displayLines.map((line, index) => (
        <Box key={index}>
          <Text color="white">{line}</Text>
        </Box>
      ))}

      {/* "More lines" indicator */}
      {hasMore && (
        <Box>
          <Text color="yellow">... and more lines</Text>
        </Box>
      )}

      {/* Divider before dismiss message */}
      <Box>
        <Text color="red">{divider}</Text>
      </Box>

      {/* Dismiss message */}
      <Box>
        <Text color="yellow" dimColor>Press any key to dismiss</Text>
      </Box>
    </Box>
  );
};
