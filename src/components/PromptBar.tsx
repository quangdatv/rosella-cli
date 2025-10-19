import React from 'react';
import { Box, Text, useStdout } from 'ink';

type PromptMode = 'input' | 'keyListen';

interface Props {
  text: string;
  mode: PromptMode;
}

export const PromptBar: React.FC<Props> = ({ text, mode }) => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  if (mode === 'input') {
    // Text input mode - shows cursor
    return (
      <Box>
        <Text>
          {text}
          <Text inverse> </Text>
          {' '.repeat(Math.max(0, width - text.length - 1))}
        </Text>
      </Box>
    );
  }

  // Key listen mode - shows text without cursor, typically for yes/no prompts
  const padToWidth = (str: string): string => {
    // Remove ANSI codes to calculate actual visible length
    // eslint-disable-next-line no-control-regex
    const visibleLength = str.replace(/\u001b\[[0-9;]*m/g, '').length;
    const padding = Math.max(0, width - visibleLength);
    return str + ' '.repeat(padding);
  };

  return (
    <Box>
      <Text color="yellow">{padToWidth(text)}</Text>
    </Box>
  );
};
