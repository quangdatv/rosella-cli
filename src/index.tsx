#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { BranchSelector } from './components/BranchSelector.js';
import { GitManager } from './utils/git.js';

const gitManager = new GitManager();

render(<BranchSelector gitManager={gitManager} />);
