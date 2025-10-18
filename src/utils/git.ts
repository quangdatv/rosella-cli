import { simpleGit, SimpleGit, BranchSummary } from 'simple-git';
import type { BranchInfo } from '../types/index.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateBranchName(name: string): ValidationResult {
  // Check if empty
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Branch name cannot be empty' };
  }

  // Check for spaces
  if (name.includes(' ')) {
    return { valid: false, error: 'Branch name cannot contain spaces' };
  }

  // Check if starts with - or .
  if (name.startsWith('-') || name.startsWith('.')) {
    return { valid: false, error: 'Branch name cannot start with - or .' };
  }

  // Check if ends with .lock
  if (name.endsWith('.lock')) {
    return { valid: false, error: 'Branch name cannot end with .lock' };
  }

  // Check for invalid characters: ~, ^, :, ?, *, [, \, @{
  const invalidChars = /[~^:?*[\\\s]|\.\.|\@\{|\/\//;
  if (invalidChars.test(name)) {
    return { valid: false, error: 'Branch name contains invalid characters' };
  }

  return { valid: true };
}

export class GitManager {
  private git: SimpleGit;

  constructor(baseDir: string = process.cwd()) {
    this.git = simpleGit(baseDir);
  }

  async getBranches(): Promise<BranchInfo[]> {
    try {
      const branchSummary: BranchSummary = await this.git.branch();
      const branches: BranchInfo[] = [];

      for (const [name, branch] of Object.entries(branchSummary.branches)) {
        // Filter out remote branches
        if (name.startsWith('remotes/') || name.includes('origin/')) {
          continue;
        }

        branches.push({
          name,
          current: branch.current,
          commit: branch.commit,
          label: branch.label,
        });
      }

      // Sort: current -> main/master -> other
      return branches.sort((a, b) => {
        if (a.current) return -1;
        if (b.current) return 1;
        if (a.name === 'main' || a.name === 'master') return -1;
        if (b.name === 'main' || b.name === 'master') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      throw new Error(`Failed to fetch branches: ${error}`);
    }
  }

  async checkoutBranch(branchName: string): Promise<void> {
    try {
      await this.git.checkout(branchName);
    } catch (error) {
      throw new Error(`Failed to checkout branch '${branchName}': ${error}`);
    }
  }

  async deleteBranch(branchName: string, force: boolean = false): Promise<void> {
    try {
      if (force) {
        await this.git.deleteLocalBranch(branchName, true);
      } else {
        await this.git.deleteLocalBranch(branchName);
      }
    } catch (error) {
      const errorMessage = String(error);
      // Check if error is due to unmerged changes
      if (!force && errorMessage.includes('not fully merged')) {
        throw new Error(`Branch '${branchName}' is not fully merged. Use Shift+Delete to force delete.`);
      }
      throw new Error(`Failed to delete branch '${branchName}': ${error}`);
    }
  }

  async createBranch(branchName: string): Promise<void> {
    try {
      await this.git.branch([branchName]);
    } catch (error) {
      const errorMessage = String(error);
      // Check if branch already exists
      if (errorMessage.includes('already exists')) {
        throw new Error(`Branch '${branchName}' already exists`);
      }
      throw new Error(`Failed to create branch '${branchName}': ${error}`);
    }
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }
}
