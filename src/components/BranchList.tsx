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
  const hasMoreAbove = topIndex > 0;
  const hasMoreBelow = topIndex + viewportHeight < branches.length;

  return (
    <Box flexDirection="column" borderStyle="round" paddingLeft={1} paddingRight={1} minHeight={viewportHeight}>
      {branches.length === 0 ? (
        <Text dimColor>No branches found</Text>
      ) : (
        <>
          {hasMoreAbove && (
            <Box justifyContent="center">
              <Text dimColor>▲ more above ▲</Text>
            </Box>
          )}
          {visibleBranches.map((branch, viewportIndex) => {
            const actualIndex = topIndex + viewportIndex;
            const isSelected = actualIndex === selectedIndex;

            // Build the branch indicator prefix
            let branchPrefix = '';
            if (branch.current) {
              branchPrefix = branch.hasUncommittedChanges ? '* ● ' : '* ';
            } else {
              branchPrefix = '  ';
            }

            // Determine remote sync status icon and color
            let remoteSyncIcon = '';
            if (branch.aheadRemote && branch.behindRemote) {
              // Diverged - both ahead and behind
              remoteSyncIcon = '↕ ';
            } else if (branch.aheadRemote) {
              // Ahead of remote only
              remoteSyncIcon = '↑ ';
            } else if (branch.behindRemote) {
              // Behind remote only
              remoteSyncIcon = '↓ ';
            }

            return (
              <Box key={branch.name}>
                {isSelected ? (
                  <Text inverse>
                    {branch.current ? (
                      <Text color={branch.hasUncommittedChanges ? 'yellow' : 'green'}>{branchPrefix}</Text>
                    ) : (
                      branchPrefix
                    )}
                    {remoteSyncIcon && <Text color="blue">{remoteSyncIcon}</Text>}
                    {branch.name}
                    <Text dimColor> ({branch.commit.substring(0, 7)})</Text>
                  </Text>
                ) : (
                  <Text>
                    {branch.current ? (
                      <Text color={branch.hasUncommittedChanges ? 'yellow' : 'green'}>{branchPrefix}</Text>
                    ) : (
                      branchPrefix
                    )}
                    {remoteSyncIcon && <Text color="blue">{remoteSyncIcon}</Text>}
                    {branch.name}
                    <Text dimColor> ({branch.commit.substring(0, 7)})</Text>
                  </Text>
                )}
              </Box>
            );
          })}
          {hasMoreBelow && (
            <Box justifyContent="center">
              <Text dimColor>▼ more below ▼</Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
