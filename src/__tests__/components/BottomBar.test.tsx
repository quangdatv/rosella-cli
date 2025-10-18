import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { BottomBar } from '../../components/BottomBar.js';
import type { SearchState } from '../../types/index.js';

describe('BottomBar', () => {
  const defaultSearch: SearchState = {
    active: false,
    query: '',
    mode: 'normal',
  };

  const defaultCreation = {
    active: false,
    branchName: '',
  };

  describe('Confirmation Prompts', () => {
    it('should display delete confirmation prompt', () => {
      const { lastFrame } = render(
        <BottomBar
          confirmation={{ active: true, branchName: 'feature-1' }}
          search={defaultSearch}
          creation={defaultCreation}
        />
      );

      const output = lastFrame();
      expect(output).toContain("Delete branch 'feature-1'?");
      expect(output).toContain('(y=normal, f=force, other=cancel)');
    });
  });

  describe('Checkout Prompt', () => {
    it('should display checkout prompt after branch creation', () => {
      const { lastFrame } = render(
        <BottomBar
          checkoutPrompt={{ active: true, branchName: 'new-feature' }}
          search={defaultSearch}
          creation={defaultCreation}
        />
      );

      const output = lastFrame();
      expect(output).toContain("Branch 'new-feature' created");
      expect(output).toContain('Checkout now?');
      expect(output).toContain('(y/n)');
    });
  });

  describe('Search Mode', () => {
    it('should display normal search input', () => {
      const { lastFrame } = render(
        <BottomBar
          search={{ active: true, query: 'feature', mode: 'normal' }}
          creation={defaultCreation}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Fuzzy search: feature');
    });

    it('should display regex search input', () => {
      const { lastFrame } = render(
        <BottomBar
          search={{ active: true, query: 'feat.*', mode: 'regex' }}
          creation={defaultCreation}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Regex search: feat.*');
    });

    it('should display empty search prompt', () => {
      const { lastFrame } = render(
        <BottomBar
          search={{ active: true, query: '', mode: 'normal' }}
          creation={defaultCreation}
        />
      );

      const output = lastFrame();
      expect(output).toContain('Fuzzy search:');
    });
  });

  describe('Creation Mode', () => {
    it('should display branch creation input', () => {
      const { lastFrame } = render(
        <BottomBar
          search={defaultSearch}
          creation={{ active: true, branchName: 'new-branch' }}
        />
      );

      const output = lastFrame();
      expect(output).toContain('New branch:');
      expect(output).toContain('new-branch');
    });

    it('should display empty creation prompt', () => {
      const { lastFrame } = render(
        <BottomBar
          search={defaultSearch}
          creation={{ active: true, branchName: '' }}
        />
      );

      const output = lastFrame();
      expect(output).toContain('New branch:');
    });
  });

  describe('Message Display', () => {
    it('should display success message', () => {
      const { lastFrame } = render(
        <BottomBar
          search={defaultSearch}
          creation={defaultCreation}
          message="Branch switched successfully"
        />
      );

      const output = lastFrame();
      expect(output).toContain('Branch switched successfully');
    });

    it('should display any message text', () => {
      const { lastFrame } = render(
        <BottomBar
          search={defaultSearch}
          creation={defaultCreation}
          message="Already on this branch"
        />
      );

      const output = lastFrame();
      expect(output).toContain('Already on this branch');
    });
  });

  describe('Priority Order', () => {
    it('should prioritize confirmation over other states', () => {
      const { lastFrame } = render(
        <BottomBar
          confirmation={{ active: true, branchName: 'test' }}
          search={{ active: true, query: 'search', mode: 'normal' }}
          creation={{ active: true, branchName: 'new' }}
          message="Some message"
        />
      );

      const output = lastFrame();
      expect(output).toContain("Delete branch 'test'?");
      expect(output).not.toContain('/search');
      expect(output).not.toContain('New branch:');
      expect(output).not.toContain('Some message');
    });

    it('should prioritize checkout prompt over search and message', () => {
      const { lastFrame } = render(
        <BottomBar
          checkoutPrompt={{ active: true, branchName: 'test' }}
          search={{ active: true, query: 'search', mode: 'normal' }}
          creation={{ active: true, branchName: 'new' }}
          message="Some message"
        />
      );

      const output = lastFrame();
      expect(output).toContain("Branch 'test' created");
      expect(output).not.toContain('/search');
      expect(output).not.toContain('New branch:');
      expect(output).not.toContain('Some message');
    });

    it('should prioritize search over creation and message', () => {
      const { lastFrame } = render(
        <BottomBar
          search={{ active: true, query: 'search', mode: 'normal' }}
          creation={{ active: true, branchName: 'new' }}
          message="Some message"
        />
      );

      const output = lastFrame();
      expect(output).toContain('Fuzzy search: search');
      expect(output).not.toContain('New branch:');
      expect(output).not.toContain('Some message');
    });

    it('should prioritize creation over message', () => {
      const { lastFrame } = render(
        <BottomBar
          search={defaultSearch}
          creation={{ active: true, branchName: 'new' }}
          message="Some message"
        />
      );

      const output = lastFrame();
      expect(output).toContain('New branch:');
      expect(output).not.toContain('Some message');
    });
  });

  describe('Empty State', () => {
    it('should render nothing when no active state', () => {
      const { lastFrame } = render(
        <BottomBar
          search={defaultSearch}
          creation={defaultCreation}
        />
      );

      const output = lastFrame();
      expect(output).toBe('');
    });

    it('should render nothing when all states are inactive and no message', () => {
      const { lastFrame } = render(
        <BottomBar
          confirmation={null}
          checkoutPrompt={null}
          search={defaultSearch}
          creation={defaultCreation}
          message={null}
        />
      );

      const output = lastFrame();
      expect(output).toBe('');
    });
  });
});
