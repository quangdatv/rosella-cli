import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { PromptBar } from '../../components/PromptBar.js';

describe('PromptBar', () => {
  describe('Key Listen Mode', () => {
    it('should display delete confirmation prompt', () => {
      const { lastFrame } = render(
        <PromptBar
          text="Delete branch 'feature-1'? (y=normal, f=force, other=cancel)"
          mode="keyListen"
        />
      );

      const output = lastFrame();
      expect(output).toContain("Delete branch 'feature-1'?");
      expect(output).toContain('(y=normal, f=force, other=cancel)');
    });

    it('should display checkout prompt', () => {
      const { lastFrame } = render(
        <PromptBar
          text="Branch 'new-feature' created. Checkout now? (y/n)"
          mode="keyListen"
        />
      );

      const output = lastFrame();
      expect(output).toContain("Branch 'new-feature' created");
      expect(output).toContain('Checkout now?');
      expect(output).toContain('(y/n)');
    });
  });

  describe('Input Mode', () => {
    it('should display normal search input with cursor', () => {
      const { lastFrame } = render(
        <PromptBar text="Fuzzy search: feature" mode="input" />
      );

      const output = lastFrame();
      expect(output).toContain('Fuzzy search: feature');
    });

    it('should display regex search input with cursor', () => {
      const { lastFrame } = render(
        <PromptBar text="Regex search: feat.*" mode="input" />
      );

      const output = lastFrame();
      expect(output).toContain('Regex search: feat.*');
    });

    it('should display empty search prompt with cursor', () => {
      const { lastFrame } = render(
        <PromptBar text="Fuzzy search: " mode="input" />
      );

      const output = lastFrame();
      expect(output).toContain('Fuzzy search:');
    });

    it('should display branch creation input with cursor', () => {
      const { lastFrame } = render(
        <PromptBar text="New branch: new-branch" mode="input" />
      );

      const output = lastFrame();
      expect(output).toContain('New branch:');
      expect(output).toContain('new-branch');
    });

    it('should display empty creation prompt with cursor', () => {
      const { lastFrame } = render(
        <PromptBar text="New branch: " mode="input" />
      );

      const output = lastFrame();
      expect(output).toContain('New branch:');
    });
  });

  describe('Empty State', () => {
    it('should render empty prompt bar in input mode', () => {
      const { lastFrame } = render(<PromptBar text="" mode="input" />);

      const output = lastFrame();
      expect(output).toBeDefined();
    });

    it('should render empty prompt bar in keyListen mode', () => {
      const { lastFrame } = render(<PromptBar text="" mode="keyListen" />);

      const output = lastFrame();
      expect(output).toBeDefined();
    });
  });
});
