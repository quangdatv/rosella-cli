import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { Help } from '../../components/Help.js';

describe('Help', () => {
  describe('Title', () => {
    it('should display help title', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('Rosella - Help');
    });
  });

  describe('Navigation Section', () => {
    it('should display navigation header', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('Navigation');
    });

    it('should list arrow key navigation', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('↑/↓');
      expect(output).toContain('Navigate branch list up/down');
    });

    it('should list vim key navigation', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('j/k');
    });

    it('should list Enter key for checkout', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('Enter');
      expect(output).toContain('Execute selected action');
    });
  });

  describe('Branch Actions Section', () => {
    it('should display branch actions header', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('Actions (Current Branch)');
    });

    it('should list create branch command', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('1');
      expect(output).toContain('Create new branch');
    });

    it('should list delete branch command', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('3');
      expect(output).toContain('Delete branch');
    });
  });

  describe('Search Section', () => {
    it('should display search header', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('Search');
    });

    it('should list fuzzy search command', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('/');
      expect(output).toContain('Start search');
      expect(output).toContain('fuzzy match');
    });

    it('should list regex search command', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('*');
      expect(output).toContain('Start regex search');
    });

    it('should list clear search command', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('Esc');
      expect(output).toContain('Clear search');
    });
  });

  describe('Other Commands Section', () => {
    it('should display other commands header', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('Other');
    });

    it('should list help toggle command', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('h');
      expect(output).toContain('Toggle this help');
    });

    it('should list quit command', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('q');
      expect(output).toContain('Quit');
    });
  });

  describe('Status Bar', () => {
    it('should display close help instructions', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      expect(output).toContain('Press h, q, or Esc to close help');
    });
  });

  describe('Layout', () => {
    it('should be a complete help page', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      // Verify all major sections are present
      expect(output).toContain('Navigation');
      expect(output).toContain('Actions (Current Branch)');
      expect(output).toContain('Actions (Other Branch)');
      expect(output).toContain('Search');
      expect(output).toContain('Other');
    });

    it('should render without errors', () => {
      expect(() => {
        render(<Help />);
      }).not.toThrow();
    });
  });

  describe('Key Bindings Documentation', () => {
    it('should document all keyboard shortcuts', () => {
      const { lastFrame } = render(<Help />);

      const output = lastFrame();
      const shortcuts = [
        '↑/↓', '←/→', 'j/k', 'Enter', '1', '2', '3', '4', '5', '6',
        '/', '*', 'Esc', 'h', 'q'
      ];

      shortcuts.forEach(shortcut => {
        expect(output).toContain(shortcut);
      });
    });
  });
});
