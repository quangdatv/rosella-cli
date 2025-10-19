# Rosella CLI - Developer Guide

Setup instructions and technical information for developers and contributors.

## Quick Start

```bash
# Install dependencies
yarn install

# Install Yarn SDK for VSCode (required for TypeScript IntelliSense)
yarn dlx @yarnpkg/sdks vscode

# Build the project
yarn build

# Run the CLI locally
yarn rosella
```

## VSCode Configuration

This project uses Yarn PnP, which requires VSCode to use the workspace TypeScript version:

1. Open Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Search for: **TypeScript: Select TypeScript Version**
3. Select: **Use Workspace Version**

This step is required for proper module resolution and TypeScript IntelliSense.

## Project Structure

```
rosella-cli/
├── src/
│   ├── components/      # React UI components (Ink-based)
│   ├── __tests__/       # Test files
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions and helpers
│   └── index.tsx       # Application entry point
├── dist/               # Compiled JavaScript output
└── .yarn/sdks/         # Yarn SDK for IDE support
```

## Technologies

- **TypeScript**: Type-safe development
- **Ink**: React-based terminal UI framework
- **simple-git**: Git operations library
- **Vitest**: Fast unit testing framework
- **Yarn**: Package manager with Plug'n'Play

## Development Workflow

### Build & Test Commands

```bash
yarn build                 # Compile TypeScript to JavaScript
yarn dev                   # Watch mode for development
yarn test                  # Run test suite with Vitest
yarn lint                  # Check code style with ESLint
```

### Code Standards

- **TypeScript**: Write all new code in TypeScript with proper type definitions
- **Testing**: Write tests for new features and bug fixes
- **Code Style**: Follow existing patterns and run `yarn lint` before committing
- **Commits**: Use conventional commit format (enforced by commitlint)

### Before Submitting Changes

1. Run `yarn test` to ensure all tests pass
2. Run `yarn build` to verify the build succeeds
3. Run `yarn lint` to check for code style issues
4. Ensure your changes follow existing code patterns

### Commit Message Format

Use conventional commits format:

```
type(scope): description

Examples:
feat(search): add regex search mode
fix(branch): handle deleted branch edge case
chore(deps): update dependencies
docs(readme): improve installation instructions
```

**Common types**: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`
