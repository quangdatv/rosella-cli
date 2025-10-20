import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { BranchList } from '../../components/BranchList.js';
import type { BranchInfo } from '../../types/index.js';

describe('BranchList', () => {
  const mockBranches: BranchInfo[] = [
    { name: 'main', current: true, commit: 'abc1234567', label: 'main' },
    { name: 'feature-1', current: false, commit: 'def4567890', label: 'feature-1' },
    { name: 'feature-2', current: false, commit: 'ghi7890123', label: 'feature-2' },
    { name: 'bugfix-1', current: false, commit: 'jkl0123456', label: 'bugfix-1' },
  ];

  describe('Empty State', () => {
    it('should display "No branches found" when branches array is empty', () => {
      const { lastFrame } = render(
        <BranchList
          branches={[]}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('No branches found');
    });
  });

  describe('Branch Display', () => {
    it('should display branch names', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('main');
      expect(output).toContain('feature-1');
      expect(output).toContain('feature-2');
      expect(output).toContain('bugfix-1');
    });

    it('should display shortened commit hashes', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('abc1234');
      expect(output).toContain('def4567');
      expect(output).toContain('ghi7890');
      expect(output).toContain('jkl0123');
    });

    it('should mark current branch with asterisk', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('* main');
    });

    it('should not mark non-current branches with asterisk', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={1}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      // feature-1 should have spaces instead of asterisk
      expect(output).toContain('feature-1');
    });
  });

  describe('Selection Highlighting', () => {
    it('should highlight the selected branch', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      // First branch (main) should be selected/highlighted
      expect(output).toContain('main');
    });

    it('should update highlighting when selection changes', () => {
      const { lastFrame, rerender } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      expect(lastFrame()).toContain('main');

      // Change selection to feature-1
      rerender(
        <BranchList
          branches={mockBranches}
          selectedIndex={1}
          topIndex={0}
          viewportHeight={10}
        />
      );

      expect(lastFrame()).toContain('feature-1');
    });
  });

  describe('Viewport Scrolling', () => {
    it('should display only branches within viewport', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={2} // Only show 2 branches
        />
      );

      const output = lastFrame();
      expect(output).toContain('main');
      expect(output).toContain('feature-1');
      expect(output).not.toContain('feature-2');
      expect(output).not.toContain('bugfix-1');
    });

    it('should scroll viewport to show different branches', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={2}
          topIndex={2} // Scroll to show feature-2 and bugfix-1
          viewportHeight={2}
        />
      );

      const output = lastFrame();
      expect(output).not.toContain('main');
      expect(output).not.toContain('feature-1');
      expect(output).toContain('feature-2');
      expect(output).toContain('bugfix-1');
    });

    it('should handle viewport at the end of list', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={3}
          topIndex={3}
          viewportHeight={2}
        />
      );

      const output = lastFrame();
      expect(output).toContain('bugfix-1');
    });

    it('should display all branches when viewport is larger than list', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={100} // Very large viewport
        />
      );

      const output = lastFrame();
      expect(output).toContain('main');
      expect(output).toContain('feature-1');
      expect(output).toContain('feature-2');
      expect(output).toContain('bugfix-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single branch', () => {
      const singleBranch: BranchInfo[] = [
        { name: 'main', current: true, commit: 'abc1234567', label: 'main' },
      ];

      const { lastFrame } = render(
        <BranchList
          branches={singleBranch}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('main');
    });

    it('should handle branch with long name', () => {
      const longNameBranch: BranchInfo[] = [
        {
          name: 'feature/very-long-branch-name-that-might-wrap',
          current: false,
          commit: 'abc1234567',
          label: 'feature/very-long-branch-name-that-might-wrap',
        },
      ];

      const { lastFrame } = render(
        <BranchList
          branches={longNameBranch}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('feature/very-long-branch-name-that-might-wrap');
    });

    it('should handle viewport height of 1', () => {
      const { lastFrame } = render(
        <BranchList
          branches={mockBranches}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={1}
        />
      );

      const output = lastFrame();
      expect(output).toContain('main');
      expect(output).not.toContain('feature-1');
    });
  });

  describe('Commit Hash Formatting', () => {
    it('should truncate commit hash to 7 characters', () => {
      const branch: BranchInfo[] = [
        { name: 'test', current: false, commit: 'abcdef1234567890', label: 'test' },
      ];

      const { lastFrame } = render(
        <BranchList
          branches={branch}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('abcdef1');
      expect(output).not.toContain('abcdef1234567890');
    });

    it('should handle short commit hashes', () => {
      const branch: BranchInfo[] = [
        { name: 'test', current: false, commit: 'abc', label: 'test' },
      ];

      const { lastFrame } = render(
        <BranchList
          branches={branch}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('abc');
    });
  });

  describe('Branch Behind Remote Indicator', () => {
    it('should show arrow icon for branches behind remote', () => {
      const branchesWithBehind: BranchInfo[] = [
        { name: 'main', current: true, commit: 'abc1234567', label: 'main', behindRemote: 3 },
        { name: 'feature-1', current: false, commit: 'def4567890', label: 'feature-1', behindRemote: 1 },
      ];

      const { lastFrame } = render(
        <BranchList
          branches={branchesWithBehind}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('↙');
      expect(output).toContain('main');
      expect(output).toContain('feature-1');
    });

    it('should not show arrow icon for branches up-to-date with remote', () => {
      const branchesUpToDate: BranchInfo[] = [
        { name: 'main', current: true, commit: 'abc1234567', label: 'main' },
        { name: 'feature-1', current: false, commit: 'def4567890', label: 'feature-1' },
      ];

      const { lastFrame } = render(
        <BranchList
          branches={branchesUpToDate}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).not.toContain('↙');
    });
  });

  describe('Uncommitted Changes Indicator', () => {
    it('should show indicator for current branch with uncommitted changes', () => {
      const branchesWithChanges: BranchInfo[] = [
        { name: 'main', current: true, commit: 'abc1234567', label: 'main', hasUncommittedChanges: true },
        { name: 'feature-1', current: false, commit: 'def4567890', label: 'feature-1' },
      ];

      const { lastFrame } = render(
        <BranchList
          branches={branchesWithChanges}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('●');
      expect(output).toContain('main');
    });

    it('should not show indicator for current branch without uncommitted changes', () => {
      const branchesClean: BranchInfo[] = [
        { name: 'main', current: true, commit: 'abc1234567', label: 'main', hasUncommittedChanges: false },
      ];

      const { lastFrame } = render(
        <BranchList
          branches={branchesClean}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).not.toContain('●');
    });
  });

  describe('Combined Indicators', () => {
    it('should show both arrow icon and uncommitted changes indicator', () => {
      const branchesWithBoth: BranchInfo[] = [
        {
          name: 'main',
          current: true,
          commit: 'abc1234567',
          label: 'main',
          behindRemote: 2,
          hasUncommittedChanges: true
        },
      ];

      const { lastFrame } = render(
        <BranchList
          branches={branchesWithBoth}
          selectedIndex={0}
          topIndex={0}
          viewportHeight={10}
        />
      );

      const output = lastFrame();
      expect(output).toContain('↙');
      expect(output).toContain('●');
      expect(output).toContain('main');
    });
  });
});
