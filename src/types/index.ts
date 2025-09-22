/**
 * Type definitions for AI Development Tools
 */

export interface ProjectConfig {
  type: ProjectType;
  name: string;
  description?: string;
  techStack: string[];
  architecture?: string;
  context?: string;
  // Enhanced context like entrata implementation
  dependencies?: string[];
  scripts?: string[];
  projectStructure?: string[];
}

export type ProjectType = 'nestjs' | 'react' | 'express' | 'nodejs' | 'auto';

export interface CommitAnalysis {
  files: string[];
  diff: string;
  categories: FileCategories;
  fileCount: number;
  suggestedType: CommitType;
  suggestedScope?: string;
}

export interface FileCategories {
  controllers: string[];
  services: string[];
  modules: string[];
  components: string[];
  tests: string[];
  config: string[];
  docs: string[];
  database: string[];
  styles: string[];
  other: string[];
}

export type CommitType =
  | 'feat'
  | 'fix'
  | 'docs'
  | 'style'
  | 'refactor'
  | 'perf'
  | 'test'
  | 'chore'
  | 'ci'
  | 'build'
  | 'security';

export interface CommitMessage {
  type: CommitType;
  scope?: string;
  description: string;
  body?: string;
  footer?: string;
  isConventional: boolean;
}

export interface ChangelogEntry {
  type: CommitType;
  scope?: string;
  description: string;
  hash: string;
  author?: string;
  date?: Date;
}

export interface ChangelogSection {
  title: string;
  entries: ChangelogEntry[];
}

export interface AIGeneratorOptions {
  debugMode?: boolean;
  silentMode?: boolean;
  timeout?: number;
  model?: string;
  cursorPath?: string;
}

export interface InitOptions {
  type?: ProjectType;
  force?: boolean;
  hooks?: boolean;
  workflow?: boolean;
  interactive?: boolean;
}

export interface CursorResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author?: string;
  date?: Date;
}
