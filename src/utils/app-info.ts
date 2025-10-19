import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json at build time
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

export const APP_NAME = packageJson.name;
export const APP_VERSION = packageJson.version;

/**
 * Display name for the application (capitalized)
 * Converts 'rosella-cli' to 'Rosella'
 */
const baseName = APP_NAME.split('-')[0];
export const APP_DISPLAY_NAME = baseName.charAt(0).toUpperCase() + baseName.slice(1);
