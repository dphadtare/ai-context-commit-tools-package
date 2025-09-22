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
    return commits.map(commit => {
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
        const entries = section.entries.map(entry => {
          const scopeDisplay = entry.scope ? `**${entry.scope}**` : '';
          const prefix = scopeDisplay ? `${scopeDisplay}: ` : '';

          // Clean up description
          let description = entry.description;
          description = description.replace(/^(add|fix|update|remove|implement|create)\s+/i, '');
          if (description.length > 0 && !/^[A-Z]{2,}/.test(description)) {
            description = description.charAt(0).toLowerCase() + description.slice(1);
          }

          return `- ${prefix}${description}`;
        });

        return `### ${section.title}\n\n${entries.join('\n')}`;
      })
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
    // For now, simply append new content to existing
    // In the future, this could be more sophisticated
    return `${existingSection}\n\n${newSection}`;
  }

  /**
   * Add metadata to changelog
   */
  private addMetadata(content: string, latestCommit: string): string {
    const timestamp = new Date().toISOString();
    const metadata = `<!-- Generated: ${timestamp} Commit: ${latestCommit} -->
<!-- CI-LAST-PROCESSED: ${latestCommit} -->`;

    const unreleasedEndRegex = /(## \[Unreleased\][\s\S]*?)(\n## |$)/;
    const match = content.match(unreleasedEndRegex);

    if (match) {
      return content.replace(unreleasedEndRegex, `${match[1]}\n${metadata}\n${match[2] || ''}`);
    } else {
      return `${content}\n${metadata}\n`;
    }
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
