import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ChangelogEntry, ChangelogSection, CommitType, GitCommit } from '../types';

/**
 * Generates and manages changelog files based on conventional commits
 */
export class ChangelogGenerator {
  private projectRoot: string;
  private changelogPath: string;
  private debugMode: boolean;

  // Mapping of commit types to changelog section titles
  private typeTitles: Record<CommitType, string> = {
    feat: 'Added',
    fix: 'Fixed',
    perf: 'Performance',
    security: 'Security',
    refactor: 'Changed',
    docs: 'Documentation',
    test: 'Testing',
    chore: 'Maintenance',
    ci: 'CI/CD',
    build: 'Build',
    style: 'Code Style',
  };

  constructor(projectRoot: string = process.cwd(), debugMode: boolean = false) {
    this.projectRoot = projectRoot;
    this.changelogPath = path.join(projectRoot, 'CHANGELOG.md');
    this.debugMode = debugMode;
  }

  /**
   * Generate changelog from commits since last CI run
   */
  async generateChangelog(previewMode: boolean = false): Promise<string | null> {
    try {
      this.log('🔍 Analyzing commits since last CI run...');

      const commits = await this.getCommitsSinceLastCI();

      if (commits.length === 0) {
        this.log('ℹ️  No new commits to process');
        return null;
      }

      this.log(`📝 Processing ${commits.length} commits...`);

      const entries = this.parseCommits(commits);
      const sections = this.groupEntriesByType(entries);
      const newContent = this.generateSectionContent(sections);

      if (!newContent.trim()) {
        this.log('ℹ️  No significant changes to document');
        return null;
      }

      if (previewMode) {
        this.log('📋 Changelog Preview:');
        console.log('─'.repeat(50));
        console.log(newContent);
        console.log('─'.repeat(50));
        return newContent;
      }

      const existingContent = await this.readExistingChangelog();
      const updatedContent = this.mergeWithExistingChangelog(existingContent, newContent);
      const latestCommit = await this.getLatestCommitHash();
      const finalContent = this.addMetadata(updatedContent, latestCommit);

      await fs.writeFile(this.changelogPath, finalContent);
      this.log('✅ Changelog updated successfully');

      return finalContent;
    } catch (error) {
      throw new Error(`Failed to generate changelog: ${error}`);
    }
  }

  /**
   * Get commits since last CI run
   */
  private async getCommitsSinceLastCI(): Promise<GitCommit[]> {
    try {
      let lastProcessedCommit: string | null = null;

      // Try to find last processed commit from changelog
      if (await fs.pathExists(this.changelogPath)) {
        const changelogContent = await fs.readFile(this.changelogPath, 'utf8');
        const match = changelogContent.match(/<!-- CI-LAST-PROCESSED: ([a-f0-9]+) -->/);
        if (match && match[1]) {
          lastProcessedCommit = match[1];
          this.log(`Found last processed commit: ${lastProcessedCommit}`);
        }
      }

      let gitLogCmd: string;

      if (lastProcessedCommit) {
        gitLogCmd = `git log ${lastProcessedCommit}..HEAD --oneline --no-merges --reverse`;
      } else {
        this.log('No previous run found, getting recent commits');
        try {
          gitLogCmd = 'git log HEAD~50..HEAD --oneline --no-merges --reverse';
          execSync(gitLogCmd, { encoding: 'utf8', stdio: 'ignore' });
        } catch (error) {
          this.log('Repository has fewer than 50 commits, getting all commits');
          gitLogCmd = 'git log --oneline --no-merges --reverse';
        }
      }

      const gitLog = execSync(gitLogCmd, { encoding: 'utf8' }).trim();

      if (!gitLog) {
        return [];
      }

      const commits = gitLog
        .split('\n')
        .map(line => {
          const [hash, ...messageParts] = line.split(' ');
          return {
            hash: hash || '',
            message: messageParts.join(' '),
          };
        })
        .filter(commit => commit.hash && commit.message);

      this.log(`Found ${commits.length} new commits`);
      return commits;
    } catch (error) {
      throw new Error(`Failed to get commits: ${error}`);
    }
  }

  /**
   * Parse commits into changelog entries
   */
  private parseCommits(commits: GitCommit[]): ChangelogEntry[] {
    const entries = commits.map(commit => {
      const parsed = this.parseConventionalCommit(commit.message);
      return {
        type: parsed.type,
        scope: parsed.scope,
        description: parsed.description,
        hash: commit.hash,
        author: commit.author,
        date: commit.date,
      };
    });

    // Only filter out obvious noise, keep most content
    const filtered = entries.filter(entry => this.isChangelogWorthy(entry));

    // Deduplicate similar entries
    return this.deduplicateEntries(filtered);
  }

  /**
   * Parse conventional commit message
   */
  private parseConventionalCommit(message: string): {
    type: CommitType;
    scope?: string;
    description: string;
  } {
    const conventionalRegex =
      /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|security)(?:\(([^)]+)\))?: (.+)$/;
    const match = message.match(conventionalRegex);

    if (match) {
      return {
        type: match[1] as CommitType,
        scope: match[2] || undefined,
        description: match[3] || '',
      };
    }

    // Infer type from message content
    const inferredType = this.inferCommitType(message);
    return {
      type: inferredType,
      scope: undefined,
      description: message,
    };
  }

  /**
   * Infer commit type from message content
   */
  private inferCommitType(message: string): CommitType {
    const lower = message.toLowerCase();

    if (lower.includes('fix') || lower.includes('bug') || lower.includes('error')) {
      return 'fix';
    }
    if (lower.includes('test') || lower.includes('spec')) {
      return 'test';
    }
    if (lower.includes('doc') || lower.includes('readme')) {
      return 'docs';
    }
    if (lower.includes('refactor') || lower.includes('cleanup')) {
      return 'refactor';
    }
    if (lower.includes('performance') || lower.includes('optimize')) {
      return 'perf';
    }
    if (lower.includes('security') || lower.includes('vulnerability')) {
      return 'security';
    }
    if (lower.includes('ci') || lower.includes('pipeline') || lower.includes('workflow')) {
      return 'ci';
    }
    if (lower.includes('dependency') || lower.includes('deps') || lower.includes('version')) {
      return 'chore';
    }

    return 'feat';
  }

  /**
   * Check if a commit entry is worthy of being in the changelog
   * Uses a positive approach: what makes a good changelog entry?
   */
  private isChangelogWorthy(entry: ChangelogEntry): boolean {
    const description = entry.description.toLowerCase().trim();

    // Only exclude the most obvious noise - be extremely permissive
    // NEVER filter task IDs - they're important for traceability
    const excludePatterns = [
      /^merge /,
      /found \d+ staged files/,
      /generating ai commit message/,
      /ai message generated/,
      /^wip$/,
      /^temp$/,
      /^tmp$/,
      /^\w+\.\w+$/, // Files with extensions like "file.js", "test.py", etc.
      /^(update|fix|add|remove|change|delete|create|test|debug)$/, // Only specific meaningless single words
    ];

    for (const pattern of excludePatterns) {
      if (pattern.test(description)) {
        return false;
      }
    }

    // Include everything else - let users curate manually if needed
    return true;
  }

  /**
   * Deduplicate similar entries to prevent repetitive changelog content
   */
  private deduplicateEntries(entries: ChangelogEntry[]): ChangelogEntry[] {
    const seen = new Map<string, ChangelogEntry>();

    for (const entry of entries) {
      // Create a normalized key for comparison
      const normalizedDesc = this.normalizeDescription(entry.description);
      const key = `${entry.type}:${entry.scope || ''}:${normalizedDesc}`;

      if (!seen.has(key)) {
        seen.set(key, entry);
      } else {
        // If we've seen this before, check if the new entry has more detail
        const existing = seen.get(key)!;
        if (entry.description.length > existing.description.length) {
          seen.set(key, entry);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Normalize description for deduplication comparison
   */
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/\s+/g, ' ') // Normalize whitespace only
      .trim();
  }

  /**
   * Group entries by commit type
   */
  private groupEntriesByType(entries: ChangelogEntry[]): ChangelogSection[] {
    const grouped: Record<string, ChangelogEntry[]> = {};

    entries.forEach(entry => {
      const title = this.typeTitles[entry.type];
      if (!grouped[title]) {
        grouped[title] = [];
      }
      grouped[title].push(entry);
    });

    // Convert to sections with defined order
    const sectionOrder = Object.values(this.typeTitles);
    return sectionOrder
      .filter(title => grouped[title] && grouped[title].length > 0)
      .map(title => ({
        title,
        entries: grouped[title] || [],
      }));
  }

  /**
   * Generate markdown content for sections
   */
  private generateSectionContent(sections: ChangelogSection[]): string {
    return sections
      .map(section => {
        const entries = section.entries
          .map(entry => {
            const scopeDisplay = entry.scope ? `**${entry.scope}**` : '';
            const prefix = scopeDisplay ? `${scopeDisplay}: ` : '';

            // Clean up description
            let description = entry.description;

            // Light cleanup - only remove truly redundant prefixes
            description = description.replace(/^(add|fix|update|remove)\s+/i, '');

            // Remove file extensions only if they're standalone (not part of meaningful context)
            description = description.replace(
              /\b[\w-]+\.(ts|js|tsx|jsx|json|yaml|yml|md|txt)\b(?!\s+\w)/gi,
              ''
            );

            // Keep task IDs in the final output - only clean up in deduplication
            // Users want to see task IDs for traceability

            // Clean up extra whitespace and punctuation
            description = description.replace(/\s+/g, ' ').trim();
            description = description.replace(/^[,\-\s]+|[,\-\s]+$/g, '');

            // Ensure proper capitalization for user-facing content
            if (description.length > 0 && !/^[A-Z]{2,}/.test(description)) {
              description = description.charAt(0).toLowerCase() + description.slice(1);
            }

            // Final validation - if description is too short after cleaning, skip it
            if (description.length < 10) {
              return null;
            }

            // Use different formatting for scoped vs unscoped entries
            if (entry.scope) {
              return `${prefix}${description}`;
            } else {
              return `- ${description}`;
            }
          })
          .filter(entry => entry !== null); // Remove null entries

        // Only return sections that have entries after filtering
        if (entries.length === 0) {
          return null;
        }

        return `### ${section.title}\n\n${entries.join('\n')}`;
      })
      .filter(section => section !== null) // Remove empty sections
      .join('\n\n');
  }

  /**
   * Read existing changelog
   */
  private async readExistingChangelog(): Promise<string> {
    if (await fs.pathExists(this.changelogPath)) {
      return await fs.readFile(this.changelogPath, 'utf8');
    }

    return this.createInitialChangelog();
  }

  /**
   * Create initial changelog content
   */
  private createInitialChangelog(): string {
    return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

`;
  }

  /**
   * Merge new content with existing changelog
   */
  private mergeWithExistingChangelog(existingContent: string, newSection: string): string {
    const unreleasedRegex = /## \[Unreleased\]\s*([\s\S]*?)(?=\n## |\n<!-- Generated:|$)/;
    const match = existingContent.match(unreleasedRegex);

    if (match && match[1]) {
      const existingUnreleased = match[1].trim();

      if (existingUnreleased && !existingUnreleased.includes('<!-- Generated:')) {
        this.log('Merging with existing unreleased content');
        const mergedSection = this.intelligentMerge(existingUnreleased, newSection);
        return existingContent.replace(unreleasedRegex, `## [Unreleased]\n\n${mergedSection}\n\n`);
      } else {
        return existingContent.replace(unreleasedRegex, `## [Unreleased]\n\n${newSection}\n\n`);
      }
    } else {
      const headerEndIndex = existingContent.indexOf('\n## ');
      if (headerEndIndex !== -1) {
        return `${existingContent.substring(
          0,
          headerEndIndex
        )}\n## [Unreleased]\n\n${newSection}\n\n${existingContent.substring(headerEndIndex)}`;
      } else {
        return `${existingContent}\n## [Unreleased]\n\n${newSection}\n\n`;
      }
    }
  }

  /**
   * Intelligently merge existing and new sections
   */
  private intelligentMerge(existingSection: string, newSection: string): string {
    // Parse existing content into entries
    const existingEntries = this.parseExistingChangelogEntries(existingSection);
    const newEntries = this.parseExistingChangelogEntries(newSection);

    // Combine and deduplicate
    const allEntries = [...existingEntries, ...newEntries];
    const deduplicatedEntries = this.deduplicateChangelogEntries(allEntries);

    // Group by section
    const grouped: Record<string, string[]> = {};

    deduplicatedEntries.forEach(entry => {
      if (!grouped[entry.section]) {
        grouped[entry.section] = [];
      }
      grouped[entry.section]!.push(entry.content);
    });

    // Rebuild sections in proper order
    const sectionOrder = Object.values(this.typeTitles);
    const sections = sectionOrder
      .filter(section => grouped[section] && grouped[section].length > 0)
      .map(section => `### ${section}\n\n${grouped[section]!.join('\n')}`)
      .join('\n\n');

    return sections;
  }

  /**
   * Parse existing changelog entries from content
   */
  private parseExistingChangelogEntries(
    content: string
  ): Array<{ section: string; content: string }> {
    const entries: Array<{ section: string; content: string }> = [];
    const sections = content.split(/###\s+(.+)/);

    for (let i = 1; i < sections.length; i += 2) {
      const sectionTitle = sections[i]?.trim();
      if (!sectionTitle) continue;
      const sectionContent = sections[i + 1] || '';

      const entryLines = sectionContent
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.trim());

      entryLines.forEach(line => {
        entries.push({
          section: sectionTitle,
          content: line,
        });
      });
    }

    return entries;
  }

  /**
   * Deduplicate changelog entries by content similarity
   */
  private deduplicateChangelogEntries(
    entries: Array<{ section: string; content: string }>
  ): Array<{ section: string; content: string }> {
    const seen = new Map<string, { section: string; content: string }>();

    for (const entry of entries) {
      // Normalize content for comparison
      const normalized = this.normalizeChangelogEntry(entry.content);
      const key = `${entry.section}:${normalized}`;

      if (!seen.has(key)) {
        seen.set(key, entry);
      } else {
        // Keep the longer/more detailed entry
        const existing = seen.get(key)!;
        if (entry.content.length > existing.content.length) {
          seen.set(key, entry);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Normalize changelog entry for deduplication
   */
  private normalizeChangelogEntry(content: string): string {
    return content
      .toLowerCase()
      .replace(/^-\s*/, '') // Remove bullet point
      .replace(/\*\*[^*]+\*\*:\s*/, '') // Remove scope markers
      .replace(/task\s*(id|Id)?\s*:\s*/, '') // Remove "task ID:" prefixes
      .replace(/dev-\d+[,\s]*/, '') // Remove DEV-xxx task numbers
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Add metadata to changelog
   */
  private addMetadata(content: string, latestCommit: string): string {
    const timestamp = new Date().toISOString();
    const metadata = `<!-- Generated: ${timestamp} Commit: ${latestCommit} -->
<!-- CI-LAST-PROCESSED: ${latestCommit} -->`;

    // First, remove any existing metadata blocks
    const cleanedContent = this.removeExistingMetadata(content);

    const unreleasedEndRegex = /(## \[Unreleased\][\s\S]*?)(\n## |$)/;
    const match = cleanedContent.match(unreleasedEndRegex);

    if (match) {
      return cleanedContent.replace(
        unreleasedEndRegex,
        `${match[1]}\n${metadata}\n${match[2] || ''}`
      );
    } else {
      return `${cleanedContent}\n${metadata}\n`;
    }
  }

  /**
   * Remove existing metadata blocks from changelog content
   */
  private removeExistingMetadata(content: string): string {
    // Remove all existing Generated and CI-LAST-PROCESSED comments
    return (
      content
        .replace(/<!-- Generated:.*?-->\n?/g, '')
        .replace(/<!-- CI-LAST-PROCESSED:.*?-->\n?/g, '')
        // Clean up any extra blank lines that might result
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  }

  /**
   * Get latest commit hash
   */
  private async getLatestCommitHash(): Promise<string> {
    try {
      return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Logging utility
   */
  private log(message: string): void {
    if (this.debugMode || process.env.NODE_ENV !== 'test') {
      console.log(message);
    }
  }
}
