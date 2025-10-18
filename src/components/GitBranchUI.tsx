import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import type { BranchInfo, SearchState } from '../types/index.js';
import { GitManager, validateBranchName } from '../utils/git.js';
import { Help } from './Help.js';
import { BranchList } from './BranchList.js';
import { StatusBar } from './StatusBar.js';
import { BottomBar } from './BottomBar.js';

interface Props {
  gitManager: GitManager;
}

export const GitBranchUI: React.FC<Props> = ({ gitManager }) => {
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
  } | null>(null);
  const [creation, setCreation] = useState<{
    active: boolean;
    branchName: string;
  }>({ active: false, branchName: '' });
  const [checkoutPrompt, setCheckoutPrompt] = useState<{
    active: boolean;
    branchName: string;
  } | null>(null);
  const [savedSelectionIndex, setSavedSelectionIndex] = useState<number>(0);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    filterBranches();
  }, [branches, search.query, search.mode]);

  // Adjust selection when filtered branches change
  useEffect(() => {
    if (filteredBranches.length === 0) {
      setSelectedIndex(0);
      setTopIndex(0);
    } else if (selectedIndex >= filteredBranches.length) {
      // If current selection is out of bounds, select the last item
      const newIndex = filteredBranches.length - 1;
      setSelectedIndex(newIndex);

      // Adjust viewport to show the new selection
      const viewportHeight = getViewportHeight();
      const newTopIndex = Math.max(0, newIndex - viewportHeight + 1);
      setTopIndex(newTopIndex);
    }
    // If selectedIndex is still valid, keep it as is
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
      return;
    }

    try {
      await gitManager.checkoutBranch(selectedBranch.name);
      await loadBranches();
      setSelectedIndex(0);
      setMessage(`Switched to branch '${selectedBranch.name}'`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    }
  };

  const handleDeleteRequest = () => {
    if (filteredBranches.length === 0) return;

    const selectedBranch = filteredBranches[selectedIndex];

    // Prevent deleting current branch
    if (selectedBranch.current) {
      setError('Cannot delete the currently checked out branch');
      return;
    }

    // Show confirmation dialog
    setConfirmation({
      active: true,
      branchName: selectedBranch.name,
    });
  };

  const handleConfirmDelete = async (force: boolean) => {
    if (!confirmation) return;

    const { branchName } = confirmation;

    try {
      await gitManager.deleteBranch(branchName, force);

      // Clear confirmation
      setConfirmation(null);

      // Reload branches
      await loadBranches();

      // Show success message
      const deleteType = force ? 'Force deleted' : 'Deleted';
      setMessage(`${deleteType} branch '${branchName}'`);

      // Keep selectedIndex at same position (will select next branch)
      // The filtered branches will be updated by loadBranches
    } catch (err) {
      setConfirmation(null);
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleCancelDelete = () => {
    setConfirmation(null);
  };

  const handleCreateRequest = () => {
    setSavedSelectionIndex(selectedIndex);
    setCreation({ active: true, branchName: '' });
  };

  const handleConfirmCreate = async () => {
    const branchName = creation.branchName.trim();

    // Validate branch name
    const validation = validateBranchName(branchName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid branch name');
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
        await loadBranches();
        setSelectedIndex(0);
        setMessage(`Switched to branch '${branchName}'`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed');
      }
    } else {
      // Don't checkout, just refresh and show success
      await loadBranches();
      setSelectedIndex(savedSelectionIndex);
      setMessage(`Created branch '${branchName}'`);
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
      } else {
        handleCheckoutPrompt(false);
      }
      return;
    }

    // Handle confirmation mode
    if (confirmation?.active) {
      if (input === 'y' || input === 'Y') {
        handleConfirmDelete(false); // Normal delete
      } else if (input === 'f' || input === 'F') {
        handleConfirmDelete(true); // Force delete
      } else {
        handleCancelDelete(); // Cancel on any other key
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
        setSearch((prev) => {
          // If query is already empty, exit search mode
          if (prev.query.length === 0) {
            return { active: false, query: '', mode: 'normal' };
          }
          // Otherwise, delete the last character
          const newQuery = prev.query.slice(0, -1);
          return { ...prev, query: newQuery };
        });
      } else if (key.upArrow || input === 'k') {
        // Allow navigation in search mode
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
        // Allow navigation in search mode
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
    } else if (key.delete) {
      // Delete - will prompt for normal or force delete
      handleDeleteRequest();
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
    return <Help />;
  }

  // Main branch list view
  const viewportHeight = getViewportHeight();

  return (
    <Box flexDirection="column">
      <BranchList
        branches={filteredBranches}
        selectedIndex={selectedIndex}
        topIndex={topIndex}
        viewportHeight={viewportHeight}
      />

      <StatusBar
        selectedIndex={selectedIndex}
        totalBranches={filteredBranches.length}
      />

      <BottomBar
        confirmation={confirmation}
        checkoutPrompt={checkoutPrompt}
        search={search}
        creation={creation}
        message={message}
      />
    </Box>
  );
};
