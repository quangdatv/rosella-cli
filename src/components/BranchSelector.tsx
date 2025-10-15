import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import type { BranchInfo, SearchState } from '../types/index.js';
import { GitManager } from '../utils/git.js';

interface Props {
  gitManager: GitManager;
}

export const BranchSelector: React.FC<Props> = ({ gitManager }) => {
  const { exit } = useApp();
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<BranchInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
      setSelectedIndex(0);
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
    setSelectedIndex(0);
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

  useInput((input, key) => {
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
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredBranches.length - 1
      );
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex((prev) =>
        prev < filteredBranches.length - 1 ? prev + 1 : 0
      );
    } else if (key.return) {
      handleCheckout();
    } else if (input === '/') {
      setSearch({ active: true, query: '', mode: 'normal' });
    } else if (input === ':') {
      setSearch({ active: true, query: '', mode: 'regex' });
    }
  });

  if (loading) {
    return <Text>Loading branches...</Text>;
  }

  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Git Branch Manager - Rosella</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text dimColor>
          ↑/↓ or j/k: Navigate | Enter: Checkout | /: Search | :: Regex | Esc/q: Quit
        </Text>
      </Box>

      {search.active && (
        <Box marginBottom={1}>
          <Text>
            {search.mode === 'regex' ? ':' : '/'}
            {search.query}
            <Text inverse> </Text>
          </Text>
        </Box>
      )}

      {message && (
        <Box marginBottom={1}>
          <Text color="green">{message}</Text>
        </Box>
      )}

      <Box flexDirection="column">
        {filteredBranches.length === 0 ? (
          <Text dimColor>No branches found</Text>
        ) : (
          filteredBranches.map((branch, index) => (
            <Box key={branch.name}>
              <Text>
                {index === selectedIndex ? (
                  <Text color="cyan" bold>
                    {'> '}
                  </Text>
                ) : (
                  <Text>{'  '}</Text>
                )}
                {branch.current ? (
                  <Text color="green" bold>
                    * {branch.name}
                  </Text>
                ) : (
                  <Text>{branch.name}</Text>
                )}
                <Text dimColor> ({branch.commit.substring(0, 7)})</Text>
              </Text>
            </Box>
          ))
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          {filteredBranches.length} of {branches.length} branches
        </Text>
      </Box>
    </Box>
  );
};
