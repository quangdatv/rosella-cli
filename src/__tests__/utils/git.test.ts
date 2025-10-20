import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { BranchSummary, StatusResult } from 'simple-git';

// Mock the simple-git module
const mockGit = {
  branch: vi.fn<(args?: string[]) => Promise<BranchSummary | void>>(),
  branchLocal: vi.fn<() => Promise<BranchSummary>>(),
  checkout: vi.fn<(branchName: string) => Promise<void>>(),
  status: vi.fn<() => Promise<StatusResult>>(),
  deleteLocalBranch: vi.fn<(branchName: string, force?: boolean) => Promise<void>>(),
  raw: vi.fn<(args: string[]) => Promise<string>>(),
};

const mockSimpleGit = vi.fn(() => mockGit);

vi.mock('simple-git', () => ({
  simpleGit: mockSimpleGit,
}));

const { GitManager } = await import('../../utils/git.js');

describe('GitManager', () => {
  let gitManager: InstanceType<typeof GitManager>;

  beforeEach(() => {
    vi.clearAllMocks();
    gitManager = new GitManager();
  });

  describe('getBranches', () => {
    it('should return list of local branches', async () => {
      const mockStatus: StatusResult = {
        not_added: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        files: [],
        staged: [],
        ahead: 0,
        behind: 0,
        current: 'main',
        tracking: null,
        detached: false,
        isClean: () => true,
      } as StatusResult;

      // Mock git for-each-ref output: format is "refname|commit|HEAD|tracking"
      const mockForEachRefOutput = 'main|abc123|*|\nfeature-1|def456||\nfeature-2|ghi789||';

      mockGit.status.mockResolvedValue(mockStatus);
      mockGit.raw.mockResolvedValue(mockForEachRefOutput);

      const branches = await gitManager.getBranches();

      expect(branches).toHaveLength(3);
      expect(branches[0].name).toBe('main');
      expect(branches[0].current).toBe(true);
      expect(branches[0].hasUncommittedChanges).toBe(false);
      expect(mockGit.status).toHaveBeenCalledTimes(1);
      expect(mockGit.raw).toHaveBeenCalledWith([
        'for-each-ref',
        '--format=%(refname:short)|%(objectname:short)|%(HEAD)|%(upstream:track)',
        'refs/heads/',
      ]);
    });

    it('should sort branches with current first, then main/master, then alphabetically', async () => {
      const mockStatus: StatusResult = {
        not_added: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        files: [],
        staged: [],
        ahead: 0,
        behind: 0,
        current: 'dev',
        tracking: null,
        detached: false,
        isClean: () => true,
      } as StatusResult;

      // Mock git for-each-ref output: format is "refname|commit|HEAD|tracking"
      const mockForEachRefOutput = 'feature-b|def456||\nmain|abc123||\nfeature-a|ghi789||\ndev|jkl012|*|';

      mockGit.status.mockResolvedValue(mockStatus);
      mockGit.raw.mockResolvedValue(mockForEachRefOutput);

      const branches = await gitManager.getBranches();

      expect(branches[0].name).toBe('dev'); // current branch first
      expect(branches[1].name).toBe('main'); // main second
      expect(branches[2].name).toBe('feature-a'); // alphabetically
      expect(branches[3].name).toBe('feature-b');
    });

    it('should detect branches behind remote', async () => {
      const mockStatus: StatusResult = {
        not_added: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        files: [],
        staged: [],
        ahead: 0,
        behind: 0,
        current: 'main',
        tracking: null,
        detached: false,
        isClean: () => true,
      } as StatusResult;

      // Mock git for-each-ref output with tracking info
      // Format is "refname|commit|HEAD|tracking"
      // Tracking shows "[behind 3]" for main
      const mockForEachRefOutput = 'main|abc123|*|[behind 3]\nfeature-1|def456||';

      mockGit.status.mockResolvedValue(mockStatus);
      mockGit.raw.mockResolvedValue(mockForEachRefOutput);

      const branches = await gitManager.getBranches();

      expect(branches[0].name).toBe('main');
      expect(branches[0].behindRemote).toBe(3);
      expect(branches[1].name).toBe('feature-1');
      expect(branches[1].behindRemote).toBeUndefined();
    });

    it('should detect uncommitted changes on current branch', async () => {
      const mockStatus: StatusResult = {
        not_added: ['new-file.txt'],
        conflicted: [],
        created: ['another-file.txt'],
        deleted: [],
        modified: ['existing-file.txt'],
        renamed: [],
        files: [],
        staged: [],
        ahead: 0,
        behind: 0,
        current: 'main',
        tracking: null,
        detached: false,
        isClean: () => false,
      } as StatusResult;

      // Mock git for-each-ref output
      const mockForEachRefOutput = 'main|abc123|*|';

      mockGit.status.mockResolvedValue(mockStatus);
      mockGit.raw.mockResolvedValue(mockForEachRefOutput);

      const branches = await gitManager.getBranches();

      expect(branches[0].name).toBe('main');
      expect(branches[0].current).toBe(true);
      expect(branches[0].hasUncommittedChanges).toBe(true);
    });

    it('should throw error when git operation fails', async () => {
      mockGit.status.mockRejectedValue(new Error('Git error'));
      mockGit.raw.mockResolvedValue('');

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
      mockGit.status.mockResolvedValue({
        not_added: [],
        conflicted: [],
        created: [],
        deleted: [],
        modified: [],
        renamed: [],
        files: [],
        staged: [],
        ahead: 0,
        behind: 0,
        current: 'main',
        tracking: null,
        detached: false,
        isClean: () => true,
      } as StatusResult);

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
});
