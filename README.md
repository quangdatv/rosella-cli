# Rosella CLI

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
- **Delete** - Safe delete branch (git branch -d)
- **Shift+Del** - Force delete branch (git branch -D)

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
