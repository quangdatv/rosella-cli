import { render } from 'ink-testing-library';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GitBranchUI } from '../../components/GitBranchUI.js';
import type { BranchInfo } from '../../types/index.js';
import type { GitManager } from '../../utils/git.js';

// Mock GitManager
vi.mock('../../utils/git.js', () => ({
  GitManager: vi.fn(),
  validateBranchName: vi.fn((name: string) => {
    if (!name || name.trim() === '') {
      return { valid: false, error: 'Branch name cannot be empty' };
    }
    if (name.includes(' ')) {
      return { valid: false, error: 'Branch name cannot contain spaces' };
    }
    return { valid: true };
  }),
}));

describe('GitBranchUI - Integration Tests', () => {
  let mockGitManager: {
    getBranches: ReturnType<typeof vi.fn>;
    checkoutBranch: ReturnType<typeof vi.fn>;
    isGitRepository: ReturnType<typeof vi.fn>;
    createBranch: ReturnType<typeof vi.fn>;
    deleteBranch: ReturnType<typeof vi.fn>;
    getGitVersion: ReturnType<typeof vi.fn>;
  };
  let mockBranches: BranchInfo[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockBranches = [
      {
        name: 'main',
        current: true,
        commit: 'abc123',
        label: 'main',
      },
      {
        name: 'feature-1',
        current: false,
        commit: 'def456',
        label: 'feature-1',
      },
      {
        name: 'feature-2',
        current: false,
        commit: 'ghi789',
        label: 'feature-2',
      },
    ];

    mockGitManager = {
      getBranches: vi.fn().mockResolvedValue(mockBranches),
      checkoutBranch: vi.fn().mockResolvedValue(undefined),
      isGitRepository: vi.fn().mockResolvedValue(true),
      createBranch: vi.fn().mockResolvedValue(undefined),
      deleteBranch: vi.fn().mockResolvedValue(undefined),
      getGitVersion: vi.fn().mockResolvedValue('git version 2.39.2'),
    };
  });

  describe('Initial Loading', () => {
    it('should render loading state initially', () => {
      const { lastFrame } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      expect(lastFrame()).toContain('Loading branches');
    });

    it('should load and display branches after initialization', async () => {
      const { lastFrame } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const output = lastFrame();
      expect(output).toContain('main');
      expect(output).toContain('feature-1');
      expect(output).toContain('feature-2');
    });

    it('should show error when not in git repository', async () => {
      mockGitManager.isGitRepository.mockResolvedValue(false);

      const { lastFrame } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const output = lastFrame();
      expect(output).toContain('Not a git repository');
    });

    it('should handle getBranches error', async () => {
      mockGitManager.getBranches.mockRejectedValue(new Error('Failed to get branches'));

      const { lastFrame } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const output = lastFrame();
      expect(output).toContain('Failed to get branches');
    });
  });

  describe('Branch Checkout Workflow', () => {
    it('should checkout branch when Enter is pressed on non-current branch', async () => {
      const { stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Move to second branch
      stdin.write('j');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Press Enter to checkout
      stdin.write('\r');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGitManager.checkoutBranch).toHaveBeenCalledWith('feature-1');
    });

    it('should show message when trying to checkout current branch', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press Enter on current branch (main)
      stdin.write('\r');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const output = lastFrame();
      expect(output).toContain('Already on this branch');
      expect(mockGitManager.checkoutBranch).not.toHaveBeenCalled();
    });
  });

  describe('Branch Creation Workflow', () => {
    it('should complete full branch creation workflow', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start creation
      stdin.write('n');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type branch name
      stdin.write('new-feature');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Confirm
      stdin.write('\r');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Now expects to be called with the selected branch name as the second parameter
      expect(mockGitManager.createBranch).toHaveBeenCalledWith('new-feature', 'main');

      const output = lastFrame();
      expect(output).toContain("Branch 'new-feature' created from 'main'");
      expect(output).toContain('Checkout now?');
    });

    it('should checkout new branch when accepted', async () => {
      const { stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Create branch
      stdin.write('n');
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write('new-feature');
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write('\r');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Accept checkout
      stdin.write('y');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGitManager.checkoutBranch).toHaveBeenCalledWith('new-feature');
    });

    it('should validate branch name and show error', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start creation
      stdin.write('n');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type invalid branch name (with spaces)
      stdin.write('invalid branch');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Try to confirm
      stdin.write('\r');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const output = lastFrame();
      expect(output).toContain('cannot contain spaces');
      expect(mockGitManager.createBranch).not.toHaveBeenCalled();
    });

    it('should cancel creation with Escape', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start creation
      stdin.write('n');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Cancel
      stdin.write('\x1B'); // Escape key
      await new Promise((resolve) => setTimeout(resolve, 50));

      const output = lastFrame();
      expect(output).not.toContain('New branch:');
    });
  });

  describe('Branch Deletion Workflow', () => {
    it('should show non-blocking error when delete fails due to unmerged changes', async () => {
      mockGitManager.deleteBranch.mockRejectedValue(
        new Error("Branch 'feature-1' is not fully merged. Use Shift+Delete to force delete.")
      );

      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Move to non-current branch
      stdin.write('j');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press Delete
      stdin.write('\x7F');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Confirm deletion
      stdin.write('y');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const output = lastFrame();
      // Error should be displayed
      expect(output).toContain('not fully merged');
      // But UI should still be interactive (branch list should still be visible)
      expect(output).toContain('main');
      expect(output).toContain('feature-1');
    });

    it('should complete full branch deletion workflow', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Move to non-current branch
      stdin.write('j');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press Delete
      stdin.write('\x7F');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Confirm deletion
      stdin.write('y');
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGitManager.deleteBranch).toHaveBeenCalledWith('feature-1', false);

      const output = lastFrame();
      expect(output).toContain("Deleted branch 'feature-1'");
    });

    it('should prevent deleting current branch', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Try to delete current branch (main)
      stdin.write('\x7F'); // Delete key
      await new Promise((resolve) => setTimeout(resolve, 50));

      const output = lastFrame();
      expect(output).toContain('Cannot delete the currently checked out branch');
    });

    it('should cancel deletion with any key other than y', async () => {
      const { stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Move to non-current branch
      stdin.write('j');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Press Delete
      stdin.write('\x7F');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Cancel deletion
      stdin.write('n');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockGitManager.deleteBranch).not.toHaveBeenCalled();
    });

    it('should clear error when a new message appears', async () => {
      // First, cause an error - deletion will fail and show force delete prompt
      mockGitManager.deleteBranch.mockRejectedValueOnce(
        new Error("Branch 'feature-1' is not fully merged.")
      );

      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Move to non-current branch
      stdin.write('j');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Try to delete (will fail and show force delete prompt)
      stdin.write('\x7F');
      await new Promise((resolve) => setTimeout(resolve, 50));
      stdin.write('y');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify force delete prompt is shown
      let output = lastFrame();
      expect(output).toContain('not fully merged');
      expect(output).toContain('Force delete?');

      // Accept force delete (mock will succeed this time)
      mockGitManager.deleteBranch.mockResolvedValueOnce(undefined);
      stdin.write('y');
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Success message should be shown in StatusBar
      output = lastFrame();
      expect(output).not.toContain('not fully merged');
      expect(output).toContain('Force deleted branch');
    });
  });

  describe('Search Workflow', () => {
    it('should filter branches with normal search', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start search
      stdin.write('/');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type search query character by character
      const query = 'feat';
      for (const char of query) {
        stdin.write(char);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      await new Promise((resolve) => setTimeout(resolve, 50));

      const output = lastFrame();
      expect(output).toContain('Fuzzy search: feat');
    });

    it('should filter branches with regex search', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start regex search
      stdin.write(':');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type regex pattern character by character
      const pattern = 'feat';
      for (const char of pattern) {
        stdin.write(char);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      await new Promise((resolve) => setTimeout(resolve, 50));

      const output = lastFrame();
      expect(output).toContain('Regex search: feat');
    });

    it('should clear search with Escape', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Start search
      stdin.write('/');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Type pattern
      stdin.write('test');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Exit search
      stdin.write('\x1B'); // Escape
      await new Promise((resolve) => setTimeout(resolve, 50));

      const output = lastFrame();
      expect(output).not.toContain('/test');
    });
  });

  describe('Help System', () => {
    it('should toggle help screen', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      stdin.write('h');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const output = lastFrame();
      expect(output).toContain('Help');
      expect(output).toContain('Navigation');
    });

    it('should close help with h key', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Open help
      stdin.write('h');
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Close help
      stdin.write('h');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const output = lastFrame();
      expect(output).not.toContain('Press h, q, or Esc to close help');
    });
  });

  describe('Navigation', () => {
    it('should navigate with j/k keys', async () => {
      const { stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press 'j' to move down
      stdin.write('j');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockGitManager.getBranches).toHaveBeenCalled();
    });

    it('should navigate with arrow keys', async () => {
      const { stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Press down arrow
      stdin.write('\x1B[B'); // Down arrow escape sequence
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockGitManager.getBranches).toHaveBeenCalled();
    });
  });

  describe('UI Component Integration', () => {
    it('should display all UI components together', async () => {
      const { lastFrame } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const output = lastFrame();
      // Should show branch list
      expect(output).toContain('main');
      // Should show hints in status bar
      expect(output).toContain('h: Help');
    });

    it('should coordinate state across components', async () => {
      const { lastFrame, stdin } = render(<GitBranchUI gitManager={mockGitManager as unknown as GitManager} />);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Navigate to change selected index
      stdin.write('j');
      await new Promise((resolve) => setTimeout(resolve, 50));

      const output = lastFrame();
      // Status bar should show hints
      expect(output).toContain('h: Help');
    });
  });
});
