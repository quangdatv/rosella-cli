export interface BranchInfo {
  name: string;
  current: boolean;
  commit: string;
  label?: string;
}

export interface SearchState {
  active: boolean;
  query: string;
  mode: 'normal' | 'regex';
}
