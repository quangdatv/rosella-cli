import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import type { BranchInfo, SearchState } from '../types/index.js';
import { GitManager, validateBranchName } from '../utils/git.js';
import { Help } from './Help.js';
import { BranchList } from './BranchList.js';
import { StatusBar } from './StatusBar.js';
import { PromptBar } from './PromptBar.js';
import { Header } from './Header.js';
import { ErrorPane } from './ErrorPane.js';
import { APP_VERSION } from '../utils/app-info.js';

interface Props {
  gitManager: GitManager;
}

// UI overhead constants for viewport height calculation
const UI_OVERHEAD = {
  HEADER: 2,
  PROMPT_BAR: 1,
  STATUS_BAR: 2,
  BORDERS: 2,
} as const;

const TOTAL_UI_OVERHEAD = Object.values(UI_OVERHEAD).reduce((a, b) => a + b, 0);

// Helper function to provide user-friendly error messages
function parseGitError(error: unknown, operation: string): string {
  const errorMessage = error instanceof Error ? error.message : `${operation} failed`;

  // Network errors
  if (errorMessage.includes('Could not resolve host') ||
      errorMessage.includes('network') ||
      errorMessage.includes('Connection') ||
      errorMessage.includes('timeout')) {
    return `Network error: Unable to connect to remote.\nPlease check your internet connection and try again.`;
  }

  // Authentication errors
  if (errorMessage.includes('Authentication failed') ||
      errorMessage.includes('Permission denied') ||
      errorMessage.includes('fatal: could not read')) {
    return `Authentication error: Failed to authenticate with remote.\nPlease check your credentials and try again.`;
  }

  // Merge conflicts
  if (errorMessage.includes('CONFLICT') || errorMessage.includes('conflict')) {
    return `Merge conflict detected:\n${errorMessage}\n\nResolve conflicts manually and try again.`;
  }

  // Diverged branches
  if (errorMessage.includes('diverged') || errorMessage.includes('non-fast-forward')) {
    return `Branches have diverged.\nPull the latest changes or force push (use with caution).`;
  }

  // Uncommitted changes blocking operation
  if (errorMessage.includes('would be overwritten') ||
      errorMessage.includes('Please commit your changes')) {
    return `Uncommitted changes detected.\nCommit or stash your changes before proceeding.`;
  }

  // Return original error if no specific case matched
  return errorMessage;
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
  const [gitVersion, setGitVersion] = useState<string>('loading...');
  const loadRequestIdRef = React.useRef<number>(0); // Track request IDs to prevent race conditions
  const [search, setSearch] = useState<SearchState>({
    active: false,
    query: '',
    mode: 'normal',
  });
  const [searchValidationError, setSearchValidationError] = useState<string | null>(null);
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
    fromBranch?: string;
    validationError?: string;
  }>({ active: false, branchName: '' });
  const [checkoutPrompt, setCheckoutPrompt] = useState<{
    active: boolean;
    branchName: string;
  } | null>(null);
  const [savedSelectionIndex, setSavedSelectionIndex] = useState<number>(0);
  const [mergePrompt, setMergePrompt] = useState<{
    active: boolean;
    branchName: string;
  } | null>(null);
  const [rebasePrompt, setRebasePrompt] = useState<{
    active: boolean;
    branchName: string;
  } | null>(null);
  const [pushPrompt, setPushPrompt] = useState<{
    active: boolean;
    needsUpstream: boolean;
  } | null>(null);
  const [operationInProgress, setOperationInProgress] = useState<string | null>(null);
  const [showErrorPane, setShowErrorPane] = useState(false);

  // Calculate viewport size - use full terminal height like vim
  const getViewportHeight = () => {
    const terminalHeight = stdout?.rows || 24;
    // Return content area height (excluding borders which are rendered by the Box component)
    return Math.max(1, terminalHeight - TOTAL_UI_OVERHEAD);
  };

  const loadBranches = async () => {
    // Increment request ID to track this specific request
    loadRequestIdRef.current += 1;
    const currentRequestId = loadRequestIdRef.current;

    try {
      setLoading(true);
      const isRepo = await gitManager.isGitRepository();

      // Check if this request is still the latest
      if (currentRequestId !== loadRequestIdRef.current) {
        return; // Abort if a newer request was started
      }

      if (!isRepo) {
        setError('Not a git repository');
        setLoading(false);
        return;
      }

      const branchList = await gitManager.getBranches();

      // Check again before updating state
      if (currentRequestId !== loadRequestIdRef.current) {
        return; // Abort if a newer request was started
      }

      setBranches(branchList);
      setFilteredBranches(branchList);
      setLoading(false);
    } catch (err) {
      // Only update error if this is still the latest request
      if (currentRequestId === loadRequestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
  };

  const filterBranches = () => {
    if (!search.query) {
      setFilteredBranches(branches);
      setSearchValidationError(null);
      return;
    }

    let filtered: BranchInfo[];
    if (search.mode === 'regex') {
      try {
        const regex = new RegExp(search.query, 'i');
        filtered = branches.filter((b) => regex.test(b.name));
        setSearchValidationError(null); // Clear error if regex is valid
      } catch {
        // Invalid regex - show error and display all branches
        setSearchValidationError('Invalid regex pattern');
        filtered = branches;
      }
    } else {
      filtered = branches.filter((b) =>
        b.name.toLowerCase().includes(search.query.toLowerCase())
      );
      setSearchValidationError(null);
    }

    setFilteredBranches(filtered);
  };

  useEffect(() => {
    loadBranches();
    // Fetch git version
    gitManager.getGitVersion().then((version) => {
      setGitVersion(version);
    }).catch(() => {
      setGitVersion('git version unknown');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branches, search.query, search.mode]);

  // Check if error is multi-line and should trigger error pane
  useEffect(() => {
    if (error && error.includes('\n')) {
      setShowErrorPane(true);
    }
  }, [error]);

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
    const selectedBranch = filteredBranches[selectedIndex];
    setCreation({
      active: true,
      branchName: '',
      fromBranch: selectedBranch?.name,
      validationError: undefined
    });
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
      await gitManager.createBranch(branchName, creation.fromBranch);

      // Clear creation state
      setCreation({ active: false, branchName: '', validationError: undefined });

      // Reload branches immediately to update UI
      await loadBranches();

      // Show success message in StatusBar
      setError(null);
      const fromMsg = creation.fromBranch ? ` from '${creation.fromBranch}'` : '';
      setMessage(`Branch '${branchName}' created${fromMsg}`);

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

  const handleMergeRequest = () => {
    if (filteredBranches.length === 0) return;

    const selectedBranch = filteredBranches[selectedIndex];

    // Can't merge the current branch into itself
    if (selectedBranch.current) {
      setError('Cannot merge current branch into itself');
      return;
    }

    setError(null);
    setMergePrompt({
      active: true,
      branchName: selectedBranch.name,
    });
  };

  const handleConfirmMerge = async () => {
    if (!mergePrompt) return;

    const { branchName } = mergePrompt;

    try {
      setMergePrompt(null);
      setOperationInProgress('Merging...');

      await gitManager.merge(branchName);

      setOperationInProgress(null);
      await loadBranches();

      setError(null);
      setMessage(`✓ Merged '${branchName}' into current branch`);
    } catch (err) {
      setOperationInProgress(null);
      setError(parseGitError(err, 'Merge'));
    }
  };

  const handleCancelMerge = () => {
    setMergePrompt(null);
  };

  const handleRebaseRequest = () => {
    if (filteredBranches.length === 0) return;

    const selectedBranch = filteredBranches[selectedIndex];

    // Can't rebase on the current branch
    if (selectedBranch.current) {
      setError('Cannot rebase current branch onto itself');
      return;
    }

    setError(null);
    setRebasePrompt({
      active: true,
      branchName: selectedBranch.name,
    });
  };

  const handleConfirmRebase = async () => {
    if (!rebasePrompt) return;

    const { branchName } = rebasePrompt;

    try {
      setRebasePrompt(null);
      setOperationInProgress('Rebasing...');

      await gitManager.rebase(branchName);

      setOperationInProgress(null);
      await loadBranches();

      setError(null);
      setMessage(`✓ Rebased onto '${branchName}'`);
    } catch (err) {
      setOperationInProgress(null);
      setError(parseGitError(err, 'Rebase'));
    }
  };

  const handleCancelRebase = () => {
    setRebasePrompt(null);
  };

  const handlePullRequest = async () => {
    if (filteredBranches.length === 0) return;

    const selectedBranch = filteredBranches[selectedIndex];

    // Can only pull on the current branch
    if (!selectedBranch.current) {
      setError('Can only pull on current branch');
      return;
    }

    try {
      setError(null);
      setOperationInProgress('Pulling...');

      await gitManager.pull();

      setOperationInProgress(null);
      await loadBranches();

      setMessage(`✓ Pulled latest changes`);
    } catch (err) {
      setOperationInProgress(null);
      setError(parseGitError(err, 'Pull'));
    }
  };

  const handlePushRequest = async () => {
    if (filteredBranches.length === 0) return;

    const selectedBranch = filteredBranches[selectedIndex];

    // Can only push on the current branch
    if (!selectedBranch.current) {
      setError('Can only push from current branch');
      return;
    }

    try {
      setError(null);
      setOperationInProgress('Pushing...');

      await gitManager.push();

      setOperationInProgress(null);
      await loadBranches();

      setMessage(`✓ Pushed to remote`);
    } catch (err) {
      setOperationInProgress(null);

      const errorMessage = err instanceof Error ? err.message : 'Push failed';

      // Check if upstream needs to be set
      if (errorMessage.includes('NO_UPSTREAM')) {
        setPushPrompt({
          active: true,
          needsUpstream: true,
        });
      } else {
        setError(parseGitError(err, 'Push'));
      }
    }
  };

  const handleConfirmPush = async () => {
    if (!pushPrompt) return;

    try {
      setPushPrompt(null);
      setOperationInProgress('Pushing...');

      await gitManager.push(true); // Set upstream

      setOperationInProgress(null);
      await loadBranches();

      setError(null);
      setMessage(`✓ Pushed to remote with upstream set`);
    } catch (err) {
      setOperationInProgress(null);
      setError(parseGitError(err, 'Push'));
    }
  };

  const handleCancelPush = () => {
    setPushPrompt(null);
  };

  const handleFetchRequest = async () => {
    try {
      setError(null);
      setOperationInProgress('Fetching...');

      await gitManager.fetch();

      setOperationInProgress(null);
      await loadBranches();

      setMessage(`✓ Fetched from remote`);
    } catch (err) {
      setOperationInProgress(null);
      setError(parseGitError(err, 'Fetch'));
    }
  };

  // Generate context-aware hints for the status bar
  const generateHints = (): string | null => {
    // Don't show hints if in any modal/prompt mode
    if (
      search.active ||
      creation.active ||
      confirmation?.active ||
      forceDeletePrompt?.active ||
      checkoutPrompt?.active ||
      mergePrompt?.active ||
      rebasePrompt?.active ||
      pushPrompt?.active ||
      operationInProgress ||
      showHelp
    ) {
      return null;
    }

    if (filteredBranches.length === 0) {
      return 'f: Fetch | h: Help';
    }

    const selectedBranch = filteredBranches[selectedIndex];
    const isActiveBranch = selectedBranch?.current;

    // Global commands (always available)
    const globalHints = 'f: Fetch';

    // Branch-specific commands
    let branchHints: string;
    if (isActiveBranch) {
      // Commands for active branch
      branchHints = 'n: New Branch | u: Pull | p: Push';
    } else {
      // Commands for non-active branch
      branchHints = 'Enter: Checkout | n: New Branch | Del: Delete | m: Merge | r: Rebase';
    }

    return `${globalHints} | ${branchHints} | h: Help`;
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
    // Handle error pane dismissal
    if (showErrorPane) {
      setShowErrorPane(false);
      setError(null);
      return;
    }

    // Disable input during operations
    if (operationInProgress) {
      return;
    }

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

    // Handle merge prompt mode
    if (mergePrompt?.active) {
      if (input === 'y' || input === 'Y') {
        handleConfirmMerge();
      } else {
        handleCancelMerge();
      }
      return;
    }

    // Handle rebase prompt mode
    if (rebasePrompt?.active) {
      if (input === 'y' || input === 'Y') {
        handleConfirmRebase();
      } else {
        handleCancelRebase();
      }
      return;
    }

    // Handle push prompt mode
    if (pushPrompt?.active) {
      if (input === 'y' || input === 'Y') {
        handleConfirmPush();
      } else {
        handleCancelPush();
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
        setSearchValidationError(null);
      } else if (key.return) {
        setSearch((prev) => ({ ...prev, active: false }));
        setSearchValidationError(null);
      } else if (key.backspace || key.delete) {
        setSearch((prev) => {
          // If query is already empty, exit search mode
          if (prev.query.length === 0) {
            setSearchValidationError(null);
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
      setMessage(null);
      setSearch({ active: true, query: '', mode: 'normal' });
    } else if (input === ':') {
      setError(null);
      setMessage(null);
      setSearch({ active: true, query: '', mode: 'regex' });
    } else if (input === 'h') {
      setMessage(null);
      setShowHelp(true);
    } else if (input === 'n') {
      setMessage(null);
      handleCreateRequest();
    } else if (key.delete) {
      // Delete - will prompt for normal or force delete
      handleDeleteRequest();
    } else if (input === 'f') {
      // Fetch - always available (global command)
      setMessage(null);
      handleFetchRequest();
    } else if (input === 'm') {
      // Merge - only available when non-active branch is selected
      setMessage(null);
      handleMergeRequest();
    } else if (input === 'r') {
      // Rebase - only available when non-active branch is selected
      setMessage(null);
      handleRebaseRequest();
    } else if (input === 'u') {
      // Pull - only available when active branch is selected
      setMessage(null);
      handlePullRequest();
    } else if (input === 'p') {
      // Push - only available when active branch is selected
      setMessage(null);
      handlePushRequest();
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
  const cwd = process.cwd();

  // Determine prompt bar content and mode
  const getPromptBarProps = (): { text: string; mode: 'input' | 'keyListen' } => {
    if (operationInProgress) {
      return {
        text: operationInProgress,
        mode: 'keyListen',
      };
    }

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

    if (mergePrompt?.active) {
      // Get current branch name
      const currentBranch = branches.find((b) => b.current);
      return {
        text: `Merge '${mergePrompt.branchName}' into '${currentBranch?.name || 'current'}'? (y/n)`,
        mode: 'keyListen',
      };
    }

    if (rebasePrompt?.active) {
      return {
        text: `Rebase onto '${rebasePrompt.branchName}'? (y/n)`,
        mode: 'keyListen',
      };
    }

    if (pushPrompt?.active) {
      return {
        text: pushPrompt.needsUpstream
          ? `No upstream branch set. Push and set upstream? (y/n)`
          : `Push to remote? (y/n)`,
        mode: 'keyListen',
      };
    }

    if (search.active) {
      const prefix = search.mode === 'regex' ? 'Regex search: ' : 'Fuzzy search: ';
      const baseText = prefix + search.query;
      const text = searchValidationError
        ? `${baseText} - Error: ${searchValidationError}`
        : baseText;
      return {
        text,
        mode: 'input',
      };
    }

    if (creation.active) {
      const fromText = creation.fromBranch ? ` from '${creation.fromBranch}'` : '';
      const baseText = `New branch${fromText}: ${creation.branchName}`;
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

  // Show error pane if multi-line error is present
  if (showErrorPane && error) {
    return (
      <ErrorPane error={error} />
    );
  }

  return (
    <Box flexDirection="column">
      <Header version={APP_VERSION} gitVersion={gitVersion} cwd={cwd} />

      <BranchList
        branches={filteredBranches}
        selectedIndex={selectedIndex}
        topIndex={topIndex}
        viewportHeight={viewportHeight}
      />

      <PromptBar {...promptBarProps} />

      <StatusBar
        totalBranches={filteredBranches.length}
        message={message}
        error={error}
        hints={generateHints()}
      />
    </Box>
  );
};
