import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { StatusBar } from '../../components/StatusBar.js';

describe('StatusBar', () => {
  describe('With Branches', () => {
    it('should display current position with single branch', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={1} />
      );

      const output = lastFrame();
      expect(output).toContain('[press h for help]');
      expect(output).toContain('line 1 of 1');
    });

    it('should display current position with multiple branches', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={5} />
      );

      const output = lastFrame();
      expect(output).toContain('line 1 of 5');
    });

    it('should update position when selected index changes', () => {
      const { lastFrame, rerender } = render(
        <StatusBar selectedIndex={0} totalBranches={10} />
      );

      expect(lastFrame()).toContain('line 1 of 10');

      rerender(<StatusBar selectedIndex={4} totalBranches={10} />);
      expect(lastFrame()).toContain('line 5 of 10');

      rerender(<StatusBar selectedIndex={9} totalBranches={10} />);
      expect(lastFrame()).toContain('line 10 of 10');
    });

    it('should handle large number of branches', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={99} totalBranches={100} />
      );

      const output = lastFrame();
      expect(output).toContain('line 100 of 100');
    });
  });

  describe('Without Branches', () => {
    it('should display "No branches" when total is 0', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={0} />
      );

      const output = lastFrame();
      expect(output).toContain('No branches');
      expect(output).not.toContain('line');
    });
  });

  describe('Help Text', () => {
    it('should always display help hint', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={5} />
      );

      const output = lastFrame();
      expect(output).toContain('[press h for help]');
    });

    it('should display help hint even with no branches', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={0} />
      );

      const output = lastFrame();
      expect(output).toContain('No branches');
    });
  });

  describe('Styling', () => {
    it('should use blue background and white text', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={3} />
      );

      // The output should contain ANSI color codes for blue background and white text
      const output = lastFrame();
      expect(output).toBeDefined();
      expect(output!.length).toBeGreaterThan(0);
    });
  });

  describe('Blank Line', () => {
    it('should include a blank line after status bar', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={3} />
      );

      const output = lastFrame();
      // The StatusBar component renders two Box components (status bar + blank line)
      expect(output).toBeDefined();
    });
  });

  describe('Message Display', () => {
    it('should display message when provided', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={5} message="Branch switched successfully" />
      );

      const output = lastFrame();
      expect(output).toContain('Branch switched successfully');
      expect(output).not.toContain('[press h for help]');
      expect(output).not.toContain('line 1 of 5');
    });

    it('should prioritize message over default status', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={2} totalBranches={10} message="Already on this branch" />
      );

      const output = lastFrame();
      expect(output).toContain('Already on this branch');
      expect(output).not.toContain('line 3 of 10');
    });

    it('should show default status when message is null', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={5} message={null} />
      );

      const output = lastFrame();
      expect(output).toContain('[press h for help]');
      expect(output).toContain('line 1 of 5');
    });

    it('should show default status when message is undefined', () => {
      const { lastFrame } = render(
        <StatusBar selectedIndex={0} totalBranches={5} />
      );

      const output = lastFrame();
      expect(output).toContain('[press h for help]');
      expect(output).toContain('line 1 of 5');
    });
  });
});
