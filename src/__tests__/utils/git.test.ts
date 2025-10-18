import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { BranchSummary } from 'simple-git';

// Mock the simple-git module
const mockGit = {
  branch: vi.fn<(args?: string[]) => Promise<BranchSummary | void>>(),
  checkout: vi.fn<(branchName: string) => Promise<void>>(),
  status: vi.fn<() => Promise<any>>(),
  deleteLocalBranch: vi.fn<(branchName: string, force?: boolean) => Promise<void>>(),
};

const mockSimpleGit = vi.fn(() => mockGit);

vi.mock('simple-git', () => ({
  simpleGit: mockSimpleGit,
}));

const { GitManager, validateBranchName } = await import('../../utils/git.js');

describe('GitManager', () => {
  let gitManager: InstanceType<typeof GitManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    gitManager = new GitManager();
  });

  describe('getBranches', () => {
    it('should return list of local branches', async () => {
      const mockBranchSummary: BranchSummary = {
        all: ['main', 'feature-1', 'feature-2'],
        branches: {
          'main': {
            current: true,
            name: 'main',
            commit: 'abc123',
            label: 'main',
            linkedWorkTree: false,
          },
          'feature-1': {
            current: false,
            name: 'feature-1',
            commit: 'def456',
            label: 'feature-1',
            linkedWorkTree: false,
          },
          'feature-2': {
            current: false,
            name: 'feature-2',
            commit: 'ghi789',
            label: 'feature-2',
            linkedWorkTree: false,
          },
        },
        current: 'main',
        detached: false,
      };

      mockGit.branch.mockResolvedValue(mockBranchSummary);

      const branches = await gitManager.getBranches();

      expect(branches).toHaveLength(3);
      expect(branches[0].name).toBe('main');
      expect(branches[0].current).toBe(true);
      expect(mockGit.branch).toHaveBeenCalledTimes(1);
    });

    it('should filter out remote branches', async () => {
      const mockBranchSummary: BranchSummary = {
        all: ['main', 'remotes/origin/main', 'origin/feature'],
        branches: {
          'main': {
            current: true,
            name: 'main',
            commit: 'abc123',
            label: 'main',
            linkedWorkTree: false,
          },
          'remotes/origin/main': {
            current: false,
            name: 'remotes/origin/main',
            commit: 'abc123',
            label: 'origin/main',
            linkedWorkTree: false,
          },
          'origin/feature': {
            current: false,
            name: 'origin/feature',
            commit: 'def456',
            label: 'origin/feature',
            linkedWorkTree: false,
          },
        },
        current: 'main',
        detached: false,
      };

      mockGit.branch.mockResolvedValue(mockBranchSummary);

      const branches = await gitManager.getBranches();

      expect(branches).toHaveLength(1);
      expect(branches[0].name).toBe('main');
    });

    it('should sort branches with current first, then main/master, then alphabetically', async () => {
      const mockBranchSummary: BranchSummary = {
        all: ['feature-b', 'main', 'feature-a', 'dev'],
        branches: {
          'feature-b': {
            current: false,
            name: 'feature-b',
            commit: 'def456',
            label: 'feature-b',
            linkedWorkTree: false,
          },
          'main': {
            current: false,
            name: 'main',
            commit: 'abc123',
            label: 'main',
            linkedWorkTree: false,
          },
          'feature-a': {
            current: false,
            name: 'feature-a',
            commit: 'ghi789',
            label: 'feature-a',
            linkedWorkTree: false,
          },
          'dev': {
            current: true,
            name: 'dev',
            commit: 'jkl012',
            label: 'dev',
            linkedWorkTree: false,
          },
        },
        current: 'dev',
        detached: false,
      };

      mockGit.branch.mockResolvedValue(mockBranchSummary);

      const branches = await gitManager.getBranches();

      expect(branches[0].name).toBe('dev'); // current branch first
      expect(branches[1].name).toBe('main'); // main second
      expect(branches[2].name).toBe('feature-a'); // alphabetically
      expect(branches[3].name).toBe('feature-b');
    });

    it('should throw error when git.branch fails', async () => {
      mockGit.branch.mockRejectedValue(new Error('Git error'));

      await expect(gitManager.getBranches()).rejects.toThrow(
        'Failed to fetch branches'
      );
    });
  });

  describe('checkoutBranch', () => {
    it('should checkout the specified branch', async () => {
      mockGit.checkout.mockResolvedValue(undefined);

      await gitManager.checkoutBranch('feature-1');

      expect(mockGit.checkout).toHaveBeenCalledWith('feature-1');
      expect(mockGit.checkout).toHaveBeenCalledTimes(1);
    });

    it('should throw error when checkout fails', async () => {
      mockGit.checkout.mockRejectedValue(new Error('Checkout error'));

      await expect(gitManager.checkoutBranch('nonexistent')).rejects.toThrow(
        "Failed to checkout branch 'nonexistent'"
      );
    });
  });

  describe('isGitRepository', () => {
    it('should return true when in a git repository', async () => {
      mockGit.status.mockResolvedValue({});

      const result = await gitManager.isGitRepository();

      expect(result).toBe(true);
      expect(mockGit.status).toHaveBeenCalledTimes(1);
    });

    it('should return false when not in a git repository', async () => {
      mockGit.status.mockRejectedValue(new Error('Not a git repo'));

      const result = await gitManager.isGitRepository();

      expect(result).toBe(false);
    });
  });

  describe('deleteBranch', () => {
    it('should delete a branch with safe delete (force=false)', async () => {
      mockGit.deleteLocalBranch.mockResolvedValue(undefined);

      await gitManager.deleteBranch('feature-1', false);

      expect(mockGit.deleteLocalBranch).toHaveBeenCalledWith('feature-1');
      expect(mockGit.deleteLocalBranch).toHaveBeenCalledTimes(1);
    });

    it('should delete a branch with force delete (force=true)', async () => {
      mockGit.deleteLocalBranch.mockResolvedValue(undefined);

      await gitManager.deleteBranch('feature-1', true);

      expect(mockGit.deleteLocalBranch).toHaveBeenCalledWith('feature-1', true);
      expect(mockGit.deleteLocalBranch).toHaveBeenCalledTimes(1);
    });

    it('should use safe delete by default when force parameter is omitted', async () => {
      mockGit.deleteLocalBranch.mockResolvedValue(undefined);

      await gitManager.deleteBranch('feature-1');

      expect(mockGit.deleteLocalBranch).toHaveBeenCalledWith('feature-1');
    });

    it('should throw helpful error when branch is not fully merged', async () => {
      const gitError = new Error('error: The branch \'feature-1\' is not fully merged.');
      mockGit.deleteLocalBranch.mockRejectedValue(gitError);

      await expect(gitManager.deleteBranch('feature-1', false)).rejects.toThrow(
        "Branch 'feature-1' is not fully merged. Use Shift+Delete to force delete."
      );
    });

    it('should throw generic error for force delete failures', async () => {
      mockGit.deleteLocalBranch.mockRejectedValue(new Error('Some other error'));

      await expect(gitManager.deleteBranch('feature-1', true)).rejects.toThrow(
        "Failed to delete branch 'feature-1'"
      );
    });

    it('should throw generic error for other delete failures', async () => {
      mockGit.deleteLocalBranch.mockRejectedValue(new Error('Permission denied'));

      await expect(gitManager.deleteBranch('feature-1', false)).rejects.toThrow(
        "Failed to delete branch 'feature-1'"
      );
    });
  });

  describe('createBranch', () => {
    it('should create a new branch', async () => {
      mockGit.branch.mockResolvedValue(undefined);

      await gitManager.createBranch('new-feature');

      expect(mockGit.branch).toHaveBeenCalledWith(['new-feature']);
      expect(mockGit.branch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when branch already exists', async () => {
      const gitError = new Error("fatal: A branch named 'new-feature' already exists.");
      mockGit.branch.mockRejectedValue(gitError);

      await expect(gitManager.createBranch('new-feature')).rejects.toThrow(
        "Branch 'new-feature' already exists"
      );
    });

    it('should throw generic error for other create failures', async () => {
      mockGit.branch.mockRejectedValue(new Error('Some other error'));

      await expect(gitManager.createBranch('new-feature')).rejects.toThrow(
        "Failed to create branch 'new-feature'"
      );
    });
  });
});

describe('validateBranchName', () => {
  it('should accept valid branch names', () => {
    expect(validateBranchName('feature-1').valid).toBe(true);
    expect(validateBranchName('fix/bug-123').valid).toBe(true);
    expect(validateBranchName('dev').valid).toBe(true);
    expect(validateBranchName('feature_branch').valid).toBe(true);
  });

  it('should reject empty branch names', () => {
    const result = validateBranchName('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Branch name cannot be empty');
  });

  it('should reject branch names with spaces', () => {
    const result = validateBranchName('feature branch');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Branch name cannot contain spaces');
  });

  it('should reject branch names starting with -', () => {
    const result = validateBranchName('-feature');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Branch name cannot start with - or .');
  });

  it('should reject branch names starting with .', () => {
    const result = validateBranchName('.feature');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Branch name cannot start with - or .');
  });

  it('should reject branch names ending with .lock', () => {
    const result = validateBranchName('feature.lock');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Branch name cannot end with .lock');
  });

  it('should reject branch names with invalid characters', () => {
    expect(validateBranchName('feature~1').valid).toBe(false);
    expect(validateBranchName('feature^1').valid).toBe(false);
    expect(validateBranchName('feature:fix').valid).toBe(false);
    expect(validateBranchName('feature?').valid).toBe(false);
    expect(validateBranchName('feature*').valid).toBe(false);
    expect(validateBranchName('feature[1]').valid).toBe(false);
    expect(validateBranchName('feature..bad').valid).toBe(false);
    expect(validateBranchName('feature@{bad}').valid).toBe(false);
    expect(validateBranchName('feature//bad').valid).toBe(false);
  });
});
