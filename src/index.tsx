#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { GitBranchUI } from './components/GitBranchUI.js';
import { GitManager } from './utils/git.js';

const gitManager = new GitManager();

// Cleanup function to restore terminal
const cleanup = () => {
  process.stdout.write('\x1b[?1049l'); // Exit alternate screen
};

// Handle exit signals
process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

// Enable alternate screen buffer (like vim)
process.stdout.write('\x1b[?1049h'); // Enter alternate screen
process.stdout.write('\x1b[2J');     // Clear screen
process.stdout.write('\x1b[H');      // Move cursor to home

const { waitUntilExit } = render(<GitBranchUI gitManager={gitManager} />);

// Restore original screen on normal exit
waitUntilExit().then(() => {
  cleanup();
});
