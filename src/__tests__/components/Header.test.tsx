import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { Header } from '../../components/Header.js';

describe('Header', () => {
  const mockProps = {
    version: '1.0.0',
    cwd: '/Users/test/project',
  };

  describe('Title Section', () => {
    it('should display "Rosella" text', () => {
      const { lastFrame } = render(<Header {...mockProps} />);

      const output = lastFrame();
      expect(output).toContain('Rosella');
    });

    it('should display version number', () => {
      const { lastFrame } = render(<Header version="1.2.3" cwd="/test" />);

      const output = lastFrame();
      expect(output).toContain('1.2.3');
    });

    it('should display version with space after Rosella', () => {
      const { lastFrame } = render(<Header {...mockProps} />);

      const output = lastFrame();
      expect(output).toContain('Rosella 1.0.0');
    });
  });

  describe('Directory Section', () => {
    it('should display current working directory', () => {
      const { lastFrame } = render(<Header {...mockProps} />);

      const output = lastFrame();
      expect(output).toContain('/Users/test/project');
    });

    it('should display different cwd when provided', () => {
      const { lastFrame } = render(
        <Header version="1.0.0" cwd="/different/path" />
      );

      const output = lastFrame();
      expect(output).toContain('/different/path');
    });
  });

  describe('Layout', () => {
    it('should render without errors', () => {
      expect(() => {
        render(<Header {...mockProps} />);
      }).not.toThrow();
    });

    it('should display all required information', () => {
      const { lastFrame } = render(<Header {...mockProps} />);

      const output = lastFrame();
      expect(output).toContain('Rosella');
      expect(output).toContain('1.0.0');
      expect(output).toContain('/Users/test/project');
    });
  });

  describe('Props Handling', () => {
    it('should handle empty version string', () => {
      const { lastFrame } = render(<Header version="" cwd="/test" />);

      const output = lastFrame();
      expect(output).toContain('Rosella');
    });

    it('should handle empty cwd string', () => {
      const { lastFrame } = render(<Header version="1.0.0" cwd="" />);

      expect(() => lastFrame()).not.toThrow();
    });
  });
});
