import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import type { BranchInfo, SearchState } from '../types/index.js';
import { GitManager, validateBranchName } from '../utils/git.js';
import { Help } from './Help.js';
import { BranchList } from './BranchList.js';
import { StatusBar } from './StatusBar.js';
import { PromptBar } from './PromptBar.js';
import { Header } from './Header.js';

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
  const [forceDeletePrompt, setForceDeletePrompt] = useState<{
    active: boolean;
    branchName: string;
  } | null>(null);
  const [creation, setCreation] = useState<{
    active: boolean;
    branchName: string;
    validationError?: string;
  }>({ active: false, branchName: '' });
  const [checkoutPrompt, setCheckoutPrompt] = useState<{
    active: boolean;
    branchName: string;
  } | null>(null);
  const [savedSelectionIndex, setSavedSelectionIndex] = useState<number>(0);

  // Calculate viewport size - use full terminal height like vim
  // Account for: header (2), prompt bar (1), status bar (1), borders (2)
  const getViewportHeight = () => {
    const terminalHeight = stdout?.rows || 24;
    const uiOverhead = 6; // Header (2 lines) + PromptBar + StatusBar + TopBorder + BottomBorder
    // Return content area height (excluding borders which are rendered by the Box component)
    return Math.max(1, terminalHeight - uiOverhead);
  };

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

  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredBranches.length]);

  const handleCheckout = async () => {
    if (filteredBranches.length === 0) return;

    const selectedBranch = filteredBranches[selectedIndex];
    if (selectedBranch.current) {
      setError(null);
      setMessage('Already on this branch');
      return;
    }

    try {
      await gitManager.checkoutBranch(selectedBranch.name);
      await loadBranches();
      setSelectedIndex(0);
      setError(null);
      setTopIndex(0); // Reset viewport to show first line
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
    setError(null);
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
      setError(null);
      setMessage(`${deleteType} branch '${branchName}'`);

      // Keep selectedIndex at same position (will select next branch)
      // The filtered branches will be updated by loadBranches
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Delete failed';

      // Check if error is due to unmerged changes
      if (!force && errorMessage.includes('not fully merged')) {
        // Clear initial confirmation and show force delete prompt
        setConfirmation(null);
        setForceDeletePrompt({
          active: true,
          branchName,
        });
      } else {
        // Other errors - show error message
        setConfirmation(null);
        setError(errorMessage);
      }
    }
  };

  const handleCancelDelete = () => {
    setConfirmation(null);
  };

  const handleForceDelete = async () => {
    if (!forceDeletePrompt) return;

    const { branchName } = forceDeletePrompt;

    try {
      await gitManager.deleteBranch(branchName, true);

      // Clear force delete prompt
      setForceDeletePrompt(null);

      // Reload branches
      await loadBranches();

      // Show success message
      setError(null);
      setMessage(`Force deleted branch '${branchName}'`);
    } catch (err) {
      setForceDeletePrompt(null);
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleCancelForceDelete = () => {
    setForceDeletePrompt(null);
  };

  const handleCreateRequest = () => {
    setSavedSelectionIndex(selectedIndex);
    setError(null);
    setCreation({ active: true, branchName: '', validationError: undefined });
  };

  const handleConfirmCreate = async () => {
    const branchName = creation.branchName.trim();

    // Validate branch name
    const validation = validateBranchName(branchName);
    if (!validation.valid) {
      setCreation((prev) => ({
        ...prev,
        validationError: validation.error || 'Invalid branch name'
      }));
      return; // Stay in creation mode
    }

    try {
      await gitManager.createBranch(branchName);

      // Clear creation state
      setCreation({ active: false, branchName: '', validationError: undefined });

      // Reload branches immediately to update UI
      await loadBranches();

      // Show success message in StatusBar
      setError(null);
      setMessage(`Branch '${branchName}' created`);

      // Show checkout prompt in PromptBar
      setCheckoutPrompt({
        active: true,
        branchName,
      });
    } catch (err) {
      // Clear creation state and show error in StatusBar
      setCreation({ active: false, branchName: '', validationError: undefined });
      setMessage(null);
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
        setTopIndex(0); // Reset viewport to show first line
        setError(null);
        setMessage(`Switched to branch '${branchName}'`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Checkout failed');
      }
    } else {
      // Don't checkout, the branch list was already reloaded
      // The "Branch 'X' created" message is already showing in StatusBar
      // Just restore saved selection and ensure it's visible in viewport
      const newSelectedIndex = Math.min(savedSelectionIndex, filteredBranches.length - 1);
      setSelectedIndex(newSelectedIndex);

      // Calculate topIndex to ensure the saved selection is visible
      const viewportHeight = getViewportHeight();
      const maxTopIndex = Math.max(0, filteredBranches.length - viewportHeight);
      let newTopIndex = topIndex;

      // If saved selection is above current viewport, scroll up
      if (newSelectedIndex < topIndex) {
        newTopIndex = newSelectedIndex;
      }
      // If saved selection is below current viewport, scroll down
      else if (newSelectedIndex >= topIndex + viewportHeight) {
        newTopIndex = Math.min(newSelectedIndex - viewportHeight + 1, maxTopIndex);
      }
      // Otherwise keep current topIndex if selection is already visible

      setTopIndex(newTopIndex);
      // Message is already set, no need to update it
    }
  };

  const handleCancelCreate = () => {
    setCreation({ active: false, branchName: '', validationError: undefined });
  };

  // Helper function to calculate navigation indices
  // This batches the state updates to prevent screen flashing
  const calculateNavigation = (
    direction: 'up' | 'down',
    currentIndex: number,
    currentTopIndex: number,
    listLength: number
  ): { newIndex: number; newTopIndex: number } => {
    const viewportHeight = getViewportHeight();
    let newIndex: number;
    let newTopIndex = currentTopIndex;

    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : listLength - 1;

      // Scroll viewport if needed
      if (newIndex < currentTopIndex) {
        newTopIndex = newIndex;
      } else if (newIndex === listLength - 1 && currentIndex === 0) {
        // Wrapped to bottom
        newTopIndex = Math.max(0, listLength - viewportHeight);
      }
    } else {
      // down
      newIndex = currentIndex < listLength - 1 ? currentIndex + 1 : 0;

      // Scroll viewport if needed
      if (newIndex >= currentTopIndex + viewportHeight) {
        newTopIndex = currentTopIndex + 1;
      } else if (newIndex === 0 && currentIndex === listLength - 1) {
        // Wrapped to top
        newTopIndex = 0;
      }
    }

    return { newIndex, newTopIndex };
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

    // Handle force delete prompt mode
    if (forceDeletePrompt?.active) {
      if (input === 'y' || input === 'Y') {
        handleForceDelete();
      } else {
        handleCancelForceDelete();
      }
      return;
    }

    // Handle confirmation mode
    if (confirmation?.active) {
      if (input === 'y' || input === 'Y') {
        handleConfirmDelete(false); // Normal delete
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
        // If input is empty, close the prompt
        if (creation.branchName.length === 0) {
          handleCancelCreate();
        } else {
          setCreation((prev) => ({
            ...prev,
            branchName: prev.branchName.slice(0, -1),
            validationError: undefined
          }));
        }
      } else if (key.upArrow) {
        // Allow navigation in creation mode
        const { newIndex, newTopIndex } = calculateNavigation(
          'up',
          selectedIndex,
          topIndex,
          filteredBranches.length
        );
        setSelectedIndex(newIndex);
        setTopIndex(newTopIndex);
      } else if (key.downArrow) {
        // Allow navigation in creation mode
        const { newIndex, newTopIndex } = calculateNavigation(
          'down',
          selectedIndex,
          topIndex,
          filteredBranches.length
        );
        setSelectedIndex(newIndex);
        setTopIndex(newTopIndex);
      } else if (input) {
        setCreation((prev) => ({ 
          ...prev, 
          branchName: prev.branchName + input,
          validationError: undefined
        }));
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
      } else if (key.upArrow) {
        // Allow navigation in search mode
        const { newIndex, newTopIndex } = calculateNavigation(
          'up',
          selectedIndex,
          topIndex,
          filteredBranches.length
        );
        setSelectedIndex(newIndex);
        setTopIndex(newTopIndex);
      } else if (key.downArrow) {
        // Allow navigation in search mode
        const { newIndex, newTopIndex } = calculateNavigation(
          'down',
          selectedIndex,
          topIndex,
          filteredBranches.length
        );
        setSelectedIndex(newIndex);
        setTopIndex(newTopIndex);
      } else if (input) {
        setSearch((prev) => ({ ...prev, query: prev.query + input }));
      }
      return;
    }

    // Normal mode
    if (key.escape || input === 'q') {
      exit();
    } else if (key.upArrow || input === 'k') {
      const { newIndex, newTopIndex } = calculateNavigation(
        'up',
        selectedIndex,
        topIndex,
        filteredBranches.length
      );
      setSelectedIndex(newIndex);
      setTopIndex(newTopIndex);
      // Clear message on navigation
      if (message) setMessage(null);
    } else if (key.downArrow || input === 'j') {
      const { newIndex, newTopIndex } = calculateNavigation(
        'down',
        selectedIndex,
        topIndex,
        filteredBranches.length
      );
      setSelectedIndex(newIndex);
      setTopIndex(newTopIndex);
      // Clear message on navigation
      if (message) setMessage(null);
    } else if (key.return) {
      handleCheckout();
    } else if (input === '/') {
      setError(null);
      setSearch({ active: true, query: '', mode: 'normal' });
    } else if (input === ':') {
      setError(null);
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

  // Help page view
  if (showHelp) {
    return <Help />;
  }

  // Main branch list view
  const viewportHeight = getViewportHeight();
  const version = '1.0.0'; // TODO: Get from package.json
  const cwd = process.cwd();

  // Determine prompt bar content and mode
  const getPromptBarProps = (): { text: string; mode: 'input' | 'keyListen' } => {
    if (confirmation?.active) {
      return {
        text: `Delete branch '${confirmation.branchName}'? (y/n)`,
        mode: 'keyListen',
      };
    }

    if (forceDeletePrompt?.active) {
      return {
        text: `Branch '${forceDeletePrompt.branchName}' is not fully merged. Force delete? (y/n)`,
        mode: 'keyListen',
      };
    }

    if (checkoutPrompt?.active) {
      return {
        text: `Checkout now? (y/n)`,
        mode: 'keyListen',
      };
    }

    if (search.active) {
      const prefix = search.mode === 'regex' ? 'Regex search: ' : 'Fuzzy search: ';
      return {
        text: prefix + search.query,
        mode: 'input',
      };
    }

    if (creation.active) {
      const baseText = `New branch: ${creation.branchName}`;
      const text = creation.validationError
        ? `${baseText} - Error: ${creation.validationError}`
        : baseText;
      return {
        text,
        mode: 'input',
      };
    }

    // Default empty state
    return {
      text: '',
      mode: 'input',
    };
  };

  const promptBarProps = getPromptBarProps();

  return (
    <Box flexDirection="column">
      <Header version={version} cwd={cwd} />

      <BranchList
        branches={filteredBranches}
        selectedIndex={selectedIndex}
        topIndex={topIndex}
        viewportHeight={viewportHeight}
      />

      <PromptBar {...promptBarProps} />

      <StatusBar
        selectedIndex={selectedIndex}
        totalBranches={filteredBranches.length}
        message={message}
        error={error}
      />
    </Box>
  );
};
