import React from 'react';
import { Box, Text } from 'ink';

interface Props {
  selectedIndex: number;
  totalBranches: number;
}

export const StatusBar: React.FC<Props> = ({ selectedIndex, totalBranches }) => {
  return (
    <>
      <Box>
        <Text backgroundColor="blue" color="white">
          {(() => {
            if (totalBranches === 0) {
              return ' No branches ';
            }
            return ` [press h for help] - line ${selectedIndex + 1} of ${totalBranches} `;
          })()}
        </Text>
      </Box>

      {/* Blank line below status bar */}
      <Box>
        <Text></Text>
      </Box>
    </>
  );
};
