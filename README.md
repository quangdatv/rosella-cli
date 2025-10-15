# Rosella CLI

An interactive git branch management CLI tool inspired by `git branch` and JetBrains IDE git tools.

## Features

- 🎯 Interactive branch selection with keyboard navigation
- 🔍 Vim-like search functionality (normal and regex modes)
- ⚡ Fast branch switching
- 🎨 Beautiful terminal UI with syntax highlighting
- ⌨️ Intuitive keyboard shortcuts

## Installation

### Development Setup

```bash
# Clone the repository
git clone <repository-url>
cd rosella-cli

# Install dependencies
yarn install

# Install Yarn SDK for VSCode (required for proper TypeScript support)
yarn dlx @yarnpkg/sdks vscode

# Build the project
yarn build

# Run the CLI
yarn rosella
```

### VSCode Setup

After running `yarn dlx @yarnpkg/sdks vscode`, you need to configure VSCode to use the workspace TypeScript version:

1. Open Command Palette: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: `TypeScript: Select TypeScript Version`
3. Select: `Use Workspace Version`

This ensures VSCode properly resolves modules with Yarn PnP.

## Usage

Simply run `rosella` in any git repository:

```bash
rosella
```

### Keyboard Shortcuts

- **↑/↓** or **j/k**: Navigate through branches
- **Enter**: Checkout selected branch
- **/**: Enter search mode (normal string matching)
- **:**: Enter regex search mode
- **Esc** or **q**: Quit the application
- **Backspace**: Delete character in search mode

### Search Modes

#### Normal Search (`/`)
Type `/` followed by your search query to filter branches by name (case-insensitive):
```
/feature
```

#### Regex Search (`:`)
Type `:` followed by a regex pattern for advanced filtering:
```
:^feature/.*-\d+$
```

## Development

### Build

```bash
yarn build
```

### Watch Mode

```bash
yarn dev
```

### Project Structure

```
rosella-cli/
├── src/
│   ├── components/      # React components (Ink UI)
│   │   └── BranchSelector.tsx
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/          # Utility functions
│   │   └── git.ts      # Git operations
│   └── index.tsx       # Entry point
├── dist/               # Compiled JavaScript
├── .yarn/
│   └── sdks/           # Yarn SDK for IDE support
├── package.json
├── tsconfig.json
└── README.md
```

## Technologies

- **TypeScript**: Type-safe development
- **Ink**: React-based terminal UI framework
- **simple-git**: Git operations
- **Yarn**: Package manager with Plug'n'Play

## License

Apache License 2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
