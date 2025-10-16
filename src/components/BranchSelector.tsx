import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import type { BranchInfo, SearchState } from '../types/index.js';
import { GitManager } from '../utils/git.js';

interface Props {
  gitManager: GitManager;
}

export const BranchSelector: React.FC<Props> = ({ gitManager }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<BranchInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [topIndex, setTopIndex] = useState(0); // Viewport top position
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [search, setSearch] = useState<SearchState>({
    active: false,
    query: '',
    mode: 'normal',
  });

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    filterBranches();
  }, [branches, search.query, search.mode]);

  // Reset viewport when filtered branches change
  useEffect(() => {
    setSelectedIndex(0);
    setTopIndex(0);
  }, [filteredBranches.length]);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const isRepo = await gitManager.isGitRepository();
      if (!isRepo) {
        setError('Not a git repository');
        setLoading(false);
        return;
      }

      const branchList = await gitManager.getBranches();
      setBranches(branchList);
      setFilteredBranches(branchList);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  const filterBranches = () => {
    if (!search.query) {
      setFilteredBranches(branches);
      return;
    }

    let filtered: BranchInfo[];
    if (search.mode === 'regex') {
      try {
        const regex = new RegExp(search.query, 'i');
        filtered = branches.filter((b) => regex.test(b.name));
      } catch {
        // Invalid regex, fall back to normal search
        filtered = branches.filter((b) =>
          b.name.toLowerCase().includes(search.query.toLowerCase())
        );
      }
    } else {
      filtered = branches.filter((b) =>
        b.name.toLowerCase().includes(search.query.toLowerCase())
      );
    }

    setFilteredBranches(filtered);
  };

  const handleCheckout = async () => {
    if (filteredBranches.length === 0) return;

    const selectedBranch = filteredBranches[selectedIndex];
    if (selectedBranch.current) {
      setMessage('Already on this branch');
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    try {
      await gitManager.checkoutBranch(selectedBranch.name);
      setMessage(`Switched to branch '${selectedBranch.name}'`);
      setTimeout(() => {
        exit();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setTimeout(() => setError(null), 3000);
    }
  };

  // Calculate viewport size - use full terminal height like vim
  // Account for: header (1), message (1 if present), status bar (1), blank line (1), search input (1 if active)
  const getViewportHeight = () => {
    const terminalHeight = stdout?.rows || 24;
    const uiOverhead = 3 + (message ? 1 : 0) + (search.active ? 1 : 0);
    return Math.max(1, terminalHeight - uiOverhead);
  };

  useInput((input, key) => {
    // Handle help mode
    if (showHelp) {
      if (key.escape || input === 'q' || input === 'h') {
        setShowHelp(false);
      }
      return;
    }

    // Handle search mode
    if (search.active) {
      if (key.escape) {
        setSearch({ active: false, query: '', mode: 'normal' });
      } else if (key.return) {
        setSearch((prev) => ({ ...prev, active: false }));
      } else if (key.backspace || key.delete) {
        setSearch((prev) => ({ ...prev, query: prev.query.slice(0, -1) }));
      } else if (input) {
        setSearch((prev) => ({ ...prev, query: prev.query + input }));
      }
      return;
    }

    // Normal mode
    if (key.escape || input === 'q') {
      exit();
    } else if (key.upArrow || input === 'k') {
      setSelectedIndex((prev) => {
        const newIndex = prev > 0 ? prev - 1 : filteredBranches.length - 1;

        // Scroll viewport if needed
        if (newIndex < topIndex) {
          setTopIndex(newIndex);
        } else if (newIndex === filteredBranches.length - 1 && prev === 0) {
          // Wrapped to bottom
          const viewportHeight = getViewportHeight();
          setTopIndex(Math.max(0, filteredBranches.length - viewportHeight));
        }

        return newIndex;
      });
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) => {
        const newIndex = prev < filteredBranches.length - 1 ? prev + 1 : 0;
        const viewportHeight = getViewportHeight();

        // Scroll viewport if needed
        if (newIndex >= topIndex + viewportHeight) {
          setTopIndex(topIndex + 1);
        } else if (newIndex === 0 && prev === filteredBranches.length - 1) {
          // Wrapped to top
          setTopIndex(0);
        }

        return newIndex;
      });
    } else if (key.return) {
      handleCheckout();
    } else if (input === '/') {
      setSearch({ active: true, query: '', mode: 'normal' });
    } else if (input === ':') {
      setSearch({ active: true, query: '', mode: 'regex' });
    } else if (input === 'h') {
      setShowHelp(true);
    }
  });

  if (loading) {
    return <Text>Loading branches...</Text>;
  }

  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }

  // Help page view
  if (showHelp) {
    return (
      <Box flexDirection="column">
        <Box>
          <Text bold color="cyan">rosella - Help</Text>
        </Box>

        <Box flexDirection="column">
          <Text></Text>
          <Text bold>Navigation</Text>
          <Text>  <Text color="cyan">↑/↓</Text> or <Text color="cyan">j/k</Text>  Navigate up/down</Text>
          <Text>  <Text color="cyan">Enter</Text>      Checkout selected branch</Text>
          <Text></Text>
          <Text bold>Search</Text>
          <Text>  <Text color="cyan">/</Text>          Start search (fuzzy match)</Text>
          <Text>  <Text color="cyan">:</Text>          Start regex search</Text>
          <Text>  <Text color="cyan">Esc</Text>        Clear search</Text>
          <Text></Text>
          <Text bold>Other</Text>
          <Text>  <Text color="cyan">h</Text>          Toggle this help</Text>
          <Text>  <Text color="cyan">q</Text>          Quit</Text>
        </Box>

        {/* Spacer to push status bar to bottom */}
        <Box flexGrow={1}></Box>

        <Box>
          <Text backgroundColor="blue" color="white">
            {' Press h, q, or Esc to close help'.padEnd(80)}
          </Text>
        </Box>

        <Box>
          <Text></Text>
        </Box>
      </Box>
    );
  }

  // Main branch list view
  return (
    <Box flexDirection="column">
      {message && (
        <Box>
          <Text color="green">{message}</Text>
        </Box>
      )}

      <Box flexDirection="column" flexGrow={1}>
        {filteredBranches.length === 0 ? (
          <Text dimColor>No branches found</Text>
        ) : (
          (() => {
            const viewportHeight = getViewportHeight();
            const visibleBranches = filteredBranches.slice(
              topIndex,
              topIndex + viewportHeight
            );

            return visibleBranches.map((branch, viewportIndex) => {
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
                      {branch.current ? (
                        <Text color="green">* </Text>
                      ) : (
                        '  '
                      )}
                      {branch.name}
                      <Text dimColor> ({branch.commit.substring(0, 7)})</Text>
                    </Text>
                  )}
                </Box>
              );
            });
          })()
        )}
      </Box>

      {/* Status bar - tig style */}
      <Box>
        <Text backgroundColor="blue" color="white">
          {(() => {
            if (filteredBranches.length === 0) {
              return ' No branches ';
            }
            const percentage = filteredBranches.length > 0
              ? Math.round(((selectedIndex + 1) / filteredBranches.length) * 100)
              : 0;
            const percentageStr = `${percentage}%`.padStart(4); // Ensures consistent width: "  1%", " 10%", "100%"
            return ` [press h for help] - line ${selectedIndex + 1} of ${filteredBranches.length}${' '.repeat(50)}${percentageStr} `;
          })()}
        </Text>
      </Box>

      {/* Blank line below status bar */}
      <Box>
        <Text></Text>
      </Box>

      {/* Search input at bottom */}
      {search.active && (
        <Box>
          <Text>
            {search.mode === 'regex' ? ':' : '/'}
            {search.query}
            <Text inverse> </Text>
          </Text>
        </Box>
      )}
    </Box>
  );
};
