import React from 'react';
import { Box, Text, useStdout } from 'ink';

interface Props {
  options: string[];
  selectedIndex: number;
  promptText?: string;
  keybinds?: string[];
  backgroundColor?: string;
  textColor?: string;
}

export const SelectionBar: React.FC<Props> = ({
  options,
  selectedIndex,
  promptText,
  keybinds,
  backgroundColor = 'yellow',
  textColor = 'black',
}) => {
  const { stdout } = useStdout();
  const width = stdout?.columns || 80;

  // Render line 1 with full background
  const renderLine1 = () => {
    const elements: React.ReactNode[] = [];

    // Add prompt or leading space
    const leadingText = promptText ? ` ${promptText} ` : ' ';
    elements.push(
      <Text key="leading" backgroundColor={backgroundColor} color={textColor}>
        {leadingText}
      </Text>
    );

    // Add all options
    options.forEach((option, index) => {
      const isSelected = index === selectedIndex;
      const keybind = keybinds?.[index];
      const optionText = keybind ? `${keybind}: ${option}` : option;

      if (isSelected) {
        // Selected item: bold, inverse colors
        elements.push(
          <Text
            key={`option-${index}`}
            backgroundColor={textColor}
            color={backgroundColor}
            bold
          >
            {`[${optionText}]`}
          </Text>
        );
      } else {
        // Unselected item
        elements.push(
          <Text
            key={`option-${index}`}
            backgroundColor={backgroundColor}
            color={textColor}
          >
            {`[${optionText}]`}
          </Text>
        );
      }

      // Add space between options
      if (index < options.length - 1) {
        elements.push(
          <Text key={`space-${index}`} backgroundColor={backgroundColor} color={textColor}>
            {' '}
          </Text>
        );
      }
    });

    // Calculate how much space we've used (plain text length)
    let usedLength = leadingText.length;
    options.forEach((option, index) => {
      const keybind = keybinds?.[index];
      const optionText = keybind ? `${keybind}: ${option}` : option;
      usedLength += `[${optionText}]`.length;
      if (index < options.length - 1) {
        usedLength += 1; // space between options
      }
    });

    // Add padding to fill the rest of the line
    const remainingSpace = width - usedLength;
    if (remainingSpace > 0) {
      elements.push(
        <Text key="padding" backgroundColor={backgroundColor} color={textColor}>
          {' '.repeat(remainingSpace)}
        </Text>
      );
    }

    return elements;
  };

  return (
    <Box flexDirection="column">
      <Box>
        {renderLine1()}
      </Box>
      <Box>
        <Text backgroundColor={backgroundColor} color={textColor}>
          {' '.repeat(width)}
        </Text>
      </Box>
    </Box>
  );
};
