import { simpleGit, SimpleGit } from 'simple-git';
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
  const invalidChars = /[~^:?*[\\\s]|\.\.|@\{|\/\//;
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
      // Run git status and git for-each-ref in parallel for better performance
      const [status, branchInfo] = await Promise.all([
        this.git.status(),
        this.git.raw([
          'for-each-ref',
          '--format=%(refname:short)|%(objectname:short)|%(HEAD)|%(upstream:track)',
          'refs/heads/',
        ]),
      ]);

      const hasUncommittedChanges =
        status.modified.length > 0 ||
        status.created.length > 0 ||
        status.deleted.length > 0 ||
        status.renamed.length > 0 ||
        status.staged.length > 0 ||
        status.not_added.length > 0;

      const branches: BranchInfo[] = [];
      const branchLines = branchInfo.trim().split('\n').filter(line => line.length > 0);

      for (const line of branchLines) {
        // Parse format: "branch-name|commit-hash|*|[behind X]"
        const parts = line.split('|');
        if (parts.length >= 3) {
          const name = parts[0];
          const commit = parts[1];
          const isCurrent = parts[2] === '*';
          const trackingInfo = parts[3] || '';

          // Extract behind count from tracking info like "[behind 3]"
          let behindRemote: number | undefined;
          const behindMatch = trackingInfo.match(/behind (\d+)/);
          if (behindMatch) {
            behindRemote = parseInt(behindMatch[1], 10);
          }

          branches.push({
            name,
            current: isCurrent,
            commit,
            label: name,
            behindRemote,
            hasUncommittedChanges: isCurrent ? hasUncommittedChanges : undefined,
          });
        }
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

  async createBranch(branchName: string, fromBranch?: string): Promise<void> {
    try {
      if (fromBranch) {
        // Create branch from specified base branch
        await this.git.branch([branchName, fromBranch]);
      } else {
        // Create branch from current HEAD
        await this.git.branch([branchName]);
      }
    } catch (error) {
      const errorMessage = String(error);
      // Check if branch already exists
      if (errorMessage.includes('already exists')) {
        throw new Error(`Branch '${branchName}' already exists`);
      }
      throw new Error(`Failed to create branch '${branchName}': ${error}`);
    }
  }

  async fetch(): Promise<void> {
    try {
      await this.git.fetch();
    } catch (error) {
      throw new Error(`Failed to fetch: ${error}`);
    }
  }

  async pull(): Promise<void> {
    try {
      await this.git.pull();
    } catch (error) {
      throw new Error(`Failed to pull: ${error}`);
    }
  }

  async push(setUpstream: boolean = false): Promise<void> {
    try {
      if (setUpstream) {
        // Get current branch name
        const status = await this.git.status();
        const currentBranch = status.current;
        if (!currentBranch) {
          throw new Error('No current branch found');
        }
        // Push with --set-upstream
        await this.git.push(['-u', 'origin', currentBranch]);
      } else {
        await this.git.push();
      }
    } catch (error) {
      const errorMessage = String(error);
      // Check if upstream is not set
      if (errorMessage.includes('no upstream') || errorMessage.includes('has no upstream branch')) {
        throw new Error('NO_UPSTREAM');
      }
      throw new Error(`Failed to push: ${error}`);
    }
  }

  async merge(branchName: string): Promise<void> {
    try {
      await this.git.merge([branchName]);
    } catch (error) {
      const errorMessage = String(error);
      // Check for merge conflicts
      if (errorMessage.includes('CONFLICT') || errorMessage.includes('conflict')) {
        throw new Error(`Merge conflict detected. Please resolve conflicts manually.`);
      }
      throw new Error(`Failed to merge '${branchName}': ${error}`);
    }
  }

  async rebase(branchName: string): Promise<void> {
    try {
      await this.git.rebase([branchName]);
    } catch (error) {
      const errorMessage = String(error);
      // Check for rebase conflicts
      if (errorMessage.includes('CONFLICT') || errorMessage.includes('conflict')) {
        throw new Error(`Rebase conflict detected. Please resolve conflicts manually.`);
      }
      throw new Error(`Failed to rebase onto '${branchName}': ${error}`);
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

  async getGitVersion(): Promise<string> {
    try {
      const result = await this.git.raw(['--version']);
      // Extract version from output like "git version 2.39.2"
      return result.trim();
    } catch {
      // Return a fallback if git version can't be determined
      return 'git version unknown';
    }
  }
}
