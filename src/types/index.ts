export interface BranchInfo {
  name: string;
  current: boolean;
  commit: string;
  label?: string;
  behindRemote?: number;
  aheadRemote?: number;
  hasUncommittedChanges?: boolean;
}

export interface SearchState {
  active: boolean;
  query: string;
  mode: 'normal' | 'regex';
}
