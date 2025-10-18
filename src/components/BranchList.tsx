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
  const visibleBranches = branches.slice(topIndex, topIndex + viewportHeight);

  return (
    <Box flexDirection="column" borderStyle="round" paddingLeft={1} paddingRight={1} minHeight={viewportHeight}>
      {branches.length === 0 ? (
        <Text dimColor>No branches found</Text>
      ) : (
        <>
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
        </>
      )}
    </Box>
  );
};
