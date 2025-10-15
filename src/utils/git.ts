import { simpleGit, SimpleGit, BranchSummary } from 'simple-git';
import type { BranchInfo } from '../types/index.js';

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
        branches.push({
          name,
          current: branch.current,
          commit: branch.commit,
          label: branch.label,
        });
      }

      // Sort: current branch first, then alphabetically
      return branches.sort((a, b) => {
        if (a.current) return -1;
        if (b.current) return 1;
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

  async isGitRepository(): Promise<boolean> {
    try {
      await this.git.status();
      return true;
    } catch {
      return false;
    }
  }
}
