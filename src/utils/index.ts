/**
 * Utility functions for AI Development Tools
 */

export function validateCommitMessage(message: string): boolean {
  const conventionalRegex =
    /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|security)(\(.+\))?: .{1,72}/;
  return conventionalRegex.test(message);
}

export function extractCommitType(message: string): string | null {
  const match = message.match(/^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|security)/);
  return match ? match[1] || null : null;
}

export function extractCommitScope(message: string): string | null {
  const match = message.match(/^[a-z]+\(([^)]+)\):/);
  return match ? match[1] || null : null;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
