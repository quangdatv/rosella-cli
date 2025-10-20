# Rosella CLI

[![npm version](https://img.shields.io/npm/v/rosella-cli.svg)](https://www.npmjs.com/package/rosella-cli)
[![npm license](https://img.shields.io/npm/l/rosella-cli.svg)](https://www.npmjs.com/package/rosella-cli)

An interactive git branch management CLI tool inspired by `git branch` and JetBrains IDE git tools.

## Features

- 🎯 Interactive branch selection with keyboard navigation
- 🔍 Vim-like search functionality (normal and regex modes)
- ⚡ Fast branch switching
- 🎨 Beautiful terminal UI with syntax highlighting
- ⌨️ Intuitive keyboard shortcuts

## Installation

```bash
npm install -g rosella-cli
```

## Usage

Simply run `rosella` in any git repository:

```bash
rosella
```

### Navigation

- **↑/↓** or **j/k** - Navigate up/down
- **Enter** - Checkout selected branch

### Branch Actions

- **n** - Create new branch from current
- **Delete** - Delete branch

### Git Operations

- **f** - Fetch from remote
- **u** - Pull latest changes (on current branch)
- **p** - Push to remote (on current branch)
- **m** - Merge selected branch into current
- **r** - Rebase current branch onto selected


### Search

- **/** - Start search (fuzzy match)
- **:** - Start regex search
- **Esc** - Clear search

### Other

- **h** - Toggle help
- **q** - Quit

## Development

For detailed development setup and build instructions, see [AGENTS.md](AGENTS.md).

## License

Apache License 2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
