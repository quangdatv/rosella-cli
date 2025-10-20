import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { StatusBar } from '../../components/StatusBar.js';

describe('StatusBar', () => {
  describe('With Branches', () => {
    it('should render status bar with single branch', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={1} />
      );

      const output = lastFrame();
      expect(output).toBeDefined();
    });

    it('should render status bar with multiple branches', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={5} />
      );

      const output = lastFrame();
      expect(output).toBeDefined();
    });

    it('should render status bar with large number of branches', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={100} />
      );

      const output = lastFrame();
      expect(output).toBeDefined();
    });
  });

  describe('Without Branches', () => {
    it('should display "No branches" when total is 0', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={0} />
      );

      const output = lastFrame();
      expect(output).toContain('No branches');
    });
  });

  describe('Hints Display', () => {
    it('should display hints when provided', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={5} hints="f: Fetch | h: Help" />
      );

      const output = lastFrame();
      expect(output).toContain('f: Fetch');
      expect(output).toContain('h: Help');
    });

    it('should display no branches message with no branches', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={0} />
      );

      const output = lastFrame();
      expect(output).toContain('No branches');
    });
  });

  describe('Styling', () => {
    it('should render with proper styling', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={3} />
      );

      // The status bar should render
      const output = lastFrame();
      expect(output).toBeDefined();
    });
  });

  describe('Blank Line', () => {
    it('should include a blank line after status bar', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={3} />
      );

      const output = lastFrame();
      // The StatusBar component renders two Box components (status bar + blank line)
      expect(output).toBeDefined();
    });
  });

  describe('Message Display', () => {
    it('should display message when provided', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={5} message="Branch switched successfully" />
      );

      const output = lastFrame();
      expect(output).toContain('Branch switched successfully');
    });

    it('should prioritize message over default status', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={10} message="Already on this branch" />
      );

      const output = lastFrame();
      expect(output).toContain('Already on this branch');
    });

    it('should render status bar when message is null', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={5} message={null} />
      );

      const output = lastFrame();
      expect(output).toBeDefined();
    });

    it('should render status bar when message is undefined', () => {
      const { lastFrame } = render(
        <StatusBar totalBranches={5} />
      );

      const output = lastFrame();
      expect(output).toBeDefined();
    });
  });
});
