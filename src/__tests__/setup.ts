import '@testing-library/jest-dom/vitest';

// Mock process.stdout for Ink components
global.process.stdout.isTTY = true;
global.process.stdout.columns = 80;
global.process.stdout.rows = 24;
