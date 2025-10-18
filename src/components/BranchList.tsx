import React from 'react';
import { Box, Text } from 'ink';
import type { BranchInfo } from '../types/index.js';

interface Props {
  branches: BranchInfo[];
  selectedIndex: number;
  topIndex: number;
  viewportHeight: number;
}

export const BranchList: React.FC<Props> = ({
  branches,
  selectedIndex,
  topIndex,
  viewportHeight,
}) => {
  if (branches.length === 0) {
    return (
      <Box flexDirection="column" flexGrow={1}>
        <Text dimColor>No branches found</Text>
      </Box>
    );
  }

  const visibleBranches = branches.slice(topIndex, topIndex + viewportHeight);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {visibleBranches.map((branch, viewportIndex) => {
        const actualIndex = topIndex + viewportIndex;
        const isSelected = actualIndex === selectedIndex;

        return (
          <Box key={branch.name}>
            {isSelected ? (
              <Text inverse>
                {branch.current ? '* ' : '  '}
                {branch.name}
                <Text dimColor> ({branch.commit.substring(0, 7)})</Text>
              </Text>
            ) : (
              <Text>
                {branch.current ? <Text color="green">* </Text> : '  '}
                {branch.name}
                <Text dimColor> ({branch.commit.substring(0, 7)})</Text>
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
};
