import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import type { BranchInfo, SearchState } from '../types/index.js';
import { GitManager, validateBranchName } from '../utils/git.js';

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
  const [confirmation, setConfirmation] = useState<{
    active: boolean;
    branchName: string;
    force: boolean;
  } | null>(null);
  const [creation, setCreation] = useState<{
    active: boolean;
    branchName: string;
  }>({ active: false, branchName: '' });
  const [checkoutPrompt, setCheckoutPrompt] = useState<{
    active: boolean;
    branchName: string;
  } | null>(null);

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

  const handleDeleteRequest = (force: boolean) => {
    if (filteredBranches.length === 0) return;

    const selectedBranch = filteredBranches[selectedIndex];

    // Prevent deleting current branch
    if (selectedBranch.current) {
      setError('Cannot delete the currently checked out branch');
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Show confirmation dialog
    setConfirmation({
      active: true,
      branchName: selectedBranch.name,
      force,
    });
  };

  const handleConfirmDelete = async () => {
    if (!confirmation) return;

    const { branchName, force } = confirmation;

    try {
      await gitManager.deleteBranch(branchName, force);

      // Clear confirmation
      setConfirmation(null);

      // Reload branches
      await loadBranches();

      // Show success message
      const deleteType = force ? 'Force deleted' : 'Deleted';
      setMessage(`${deleteType} branch '${branchName}'`);
      setTimeout(() => setMessage(null), 2000);

      // Keep selectedIndex at same position (will select next branch)
      // The filtered branches will be updated by loadBranches
    } catch (err) {
      setConfirmation(null);
      setError(err instanceof Error ? err.message : 'Delete failed');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCancelDelete = () => {
    setConfirmation(null);
  };

  const handleCreateRequest = () => {
    setCreation({ active: true, branchName: '' });
  };

  const handleConfirmCreate = async () => {
    const branchName = creation.branchName.trim();

    // Validate branch name
    const validation = validateBranchName(branchName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid branch name');
      setTimeout(() => setError(null), 3000);
      return; // Stay in creation mode
    }

    try {
      await gitManager.createBranch(branchName);

      // Clear creation state
      setCreation({ active: false, branchName: '' });

      // Show checkout prompt
      setCheckoutPrompt({
        active: true,
        branchName,
      });
    } catch (err) {
      // Show error but stay in creation mode for correction
      setError(err instanceof Error ? err.message : 'Create failed');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCheckoutPrompt = async (shouldCheckout: boolean) => {
    if (!checkoutPrompt) return;

    const { branchName } = checkoutPrompt;

    // Clear checkout prompt
    setCheckoutPrompt(null);

    if (shouldCheckout) {
      // Checkout the new branch
      try {
        await gitManager.checkoutBranch(branchName);
        setMessage(`Switched to branch '${branchName}'`);
        setTimeout(() => {
          exit();
        }, 1000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed');
        setTimeout(() => setError(null), 3000);
      }
    } else {
      // Don't checkout, just refresh and show success
      await loadBranches();
      setMessage(`Created branch '${branchName}'`);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleCancelCreate = () => {
    setCreation({ active: false, branchName: '' });
  };

  // Calculate viewport size - use full terminal height like vim
  // Account for: header (1), message (1 if present), status bar (1), blank line (1), search input (1 if active)
  const getViewportHeight = () => {
    const terminalHeight = stdout?.rows || 24;
    const uiOverhead = 3 + (message ? 1 : 0) + (search.active ? 1 : 0);
    return Math.max(1, terminalHeight - uiOverhead);
  };

  useInput((input, key) => {
    // Handle checkout prompt mode
    if (checkoutPrompt?.active) {
      if (input === 'y' || input === 'Y') {
        handleCheckoutPrompt(true);
      } else if (input === 'n' || input === 'N' || key.escape) {
        handleCheckoutPrompt(false);
      }
      return;
    }

    // Handle confirmation mode
    if (confirmation?.active) {
      if (input === 'y' || input === 'Y') {
        handleConfirmDelete();
      } else if (input === 'n' || input === 'N' || key.escape) {
        handleCancelDelete();
      }
      return;
    }

    // Handle help mode
    if (showHelp) {
      if (key.escape || input === 'q' || input === 'h') {
        setShowHelp(false);
      }
      return;
    }

    // Handle creation mode
    if (creation.active) {
      if (key.escape) {
        handleCancelCreate();
      } else if (key.return) {
        handleConfirmCreate();
      } else if (key.backspace || key.delete) {
        setCreation((prev) => ({ ...prev, branchName: prev.branchName.slice(0, -1) }));
      } else if (input) {
        setCreation((prev) => ({ ...prev, branchName: prev.branchName + input }));
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
    } else if (input === 'n') {
      handleCreateRequest();
    } else if (key.delete && key.shift) {
      // Shift+Delete for force delete
      handleDeleteRequest(true);
    } else if (key.delete) {
      // Delete for safe delete
      handleDeleteRequest(false);
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
          <Text bold>Branch Actions</Text>
          <Text>  <Text color="cyan">n</Text>           Create new branch from current</Text>
          <Text>  <Text color="cyan">Delete</Text>       Safe delete branch (git branch -d)</Text>
          <Text>  <Text color="cyan">Shift+Del</Text>   Force delete branch (git branch -D)</Text>
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

      {confirmation?.active && (
        <Box>
          <Text color="yellow">
            {confirmation.force ? 'Force delete' : 'Delete'} branch '{confirmation.branchName}'? (y/n)
          </Text>
        </Box>
      )}

      {checkoutPrompt?.active && (
        <Box>
          <Text color="cyan">
            Branch '{checkoutPrompt.branchName}' created. Checkout now? (y/n)
          </Text>
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
            const leftPart = ` [press h for help] - line ${selectedIndex + 1} of ${filteredBranches.length}`;
            const percentageStr = `${percentage}%`.padStart(4); // Ensures consistent width: "  1%", " 10%", "100%"
            return `${leftPart.padEnd(70)}${percentageStr} `;
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

      {/* Creation input at bottom */}
      {creation.active && (
        <Box>
          <Text>
            New branch: {creation.branchName}
            <Text inverse> </Text>
          </Text>
        </Box>
      )}
    </Box>
  );
};
