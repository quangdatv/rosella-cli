import React from 'react';
import { Box, Text, useStdout } from 'ink';

type PromptMode = 'input' | 'keyListen' | 'none';

interface Props {
  promptText?: string;
  promptMode?: PromptMode;
  message?: string | null;
  error?: string | null;
  hints?: string | null;
}

export const StatusBar: React.FC<Props> = ({
  promptText = '',
  promptMode = 'none',
  message,
  error,
  hints,
}) => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  // Helper to pad text to full width
  const padToWidth = (text: string, maxWidth: number): string => {
    // Remove ANSI codes to calculate actual visible length
    // eslint-disable-next-line no-control-regex
    const visibleLength = text.replace(/\u001b\[[0-9;]*m/g, '').length;
    const padding = Math.max(0, maxWidth - visibleLength);
    return text + ' '.repeat(padding);
  };

  let line1: string;
  let line2: string;
  let backgroundColor: string;
  let textColor: string;

  // Determine what to show
  if (promptMode !== 'none' && promptText) {
    // Prompt mode - show prompt text
    if (promptMode === 'input') {
      // Input mode - show cursor
      line1 = promptText;
      line2 = '';
      backgroundColor = 'white';
      textColor = 'black';
    } else {
      // Key listen mode - yellow background for confirmation prompts
      line1 = promptText;
      line2 = '';
      backgroundColor = 'yellow';
      textColor = 'black';
    }
  } else {
    // Status mode - show error, message, or hints
    const content = (() => {
      if (error) {
        return ` ${error} `;
      }
      if (message) {
        return ` ${message} `;
      }
      if (hints) {
        return ` ${hints} `;
      }
      return '';
    })();

    // Choose colors based on state
    backgroundColor = error ? 'red' : message ? 'green' : 'blue';
    textColor = 'white';

    // Split content across two lines if needed
    if (content.length <= width) {
      // Fits on one line
      line1 = content;
      line2 = '';
    } else if (content.length <= width * 2) {
      // Fits on two lines - split smartly
      let splitPoint = width;
      const searchStart = Math.max(0, width - 20);
      const pipeIndex = content.lastIndexOf('|', width);

      if (pipeIndex > searchStart) {
        // Split at the last pipe before width
        splitPoint = pipeIndex;
        line1 = content.substring(0, splitPoint).trimEnd() + ' ';
        line2 = content.substring(splitPoint).trimStart();
      } else {
        // No good split point - just split at width
        line1 = content.substring(0, width);
        line2 = content.substring(width);
      }
    } else {
      // Too long for two lines - truncate
      line1 = content.substring(0, width);
      line2 = content.substring(width, width * 2 - 2) + '… ';
    }
  }

  return (
    <Box flexDirection="column">
      <Box>
        {promptMode === 'input' ? (
          <Text>
            {line1}
            <Text inverse> </Text>
            {' '.repeat(Math.max(0, width - line1.length - 1))}
          </Text>
        ) : (
          <Text backgroundColor={backgroundColor} color={textColor}>
            {padToWidth(line1, width)}
          </Text>
        )}
      </Box>
      <Box>
        <Text backgroundColor={backgroundColor} color={textColor}>
          {padToWidth(line2, width)}
        </Text>
      </Box>
    </Box>
  );
};
