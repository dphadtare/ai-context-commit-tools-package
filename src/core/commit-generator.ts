import { execSync } from 'child_process';
import {
  CommitAnalysis,
  FileCategories,
  CommitType,
  ProjectConfig,
  AIGeneratorOptions,
} from '../types';
import { CursorClient } from './cursor-client';

/**
 * AI-powered commit message generator
 */
export class AICommitGenerator {
  private projectRoot: string;
  private options: AIGeneratorOptions;
  private cursorClient: CursorClient;

  constructor(projectRoot: string = process.cwd(), options: AIGeneratorOptions = {}) {
    this.projectRoot = projectRoot;
    this.options = {
      debugMode: false,
      silentMode: false,
      timeout: 30000,
      model: 'sonnet-4',
      ...options,
    };
    this.cursorClient = new CursorClient(this.options);
  }

  /**
   * Generate AI commit message for staged changes
   */
  async generateCommitMessage(
    userMessage?: string,
    projectConfig?: ProjectConfig
  ): Promise<string> {
    try {
      this.log('🔍 Analyzing staged changes...');
      const analysis = this.analyzeStagedChanges();

      this.log(`📁 Found ${analysis.fileCount} staged files`);

      let commitMessage: string;

      try {
        this.log('🤖 Generating AI commit message...');
        const prompt = this.generatePrompt(analysis, userMessage, projectConfig);
        const response = await this.cursorClient.generateResponse(prompt);

        if (response.success && response.message) {
          commitMessage = this.extractCommitMessage(response.message);
          this.log('✅ AI message generated successfully');
        } else {
          throw new Error(response.error || 'AI generation failed');
        }
      } catch (aiError) {
        this.log(`⚠️  AI generation failed: ${aiError}`);
        commitMessage = this.generateFallbackMessage(analysis, userMessage);
      }

      // Validate the message
      if (!this.validateMessage(commitMessage)) {
        this.log('⚠️  Generated message does not follow conventional format');
      }

      return commitMessage;
    } catch (error) {
      throw new Error(`Failed to generate commit message: ${error}`);
    }
  }

  /**
   * Analyze staged changes
   */
  private analyzeStagedChanges(): CommitAnalysis {
    try {
      // Get list of staged files
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean);

      if (stagedFiles.length === 0) {
        throw new Error('No staged changes found. Please stage your changes with `git add`');
      }

      // Get detailed diff
      const diff = execSync('git diff --cached --no-color', { encoding: 'utf8' });

      // Categorize files
      const categories = this.categorizeFiles(stagedFiles);

      // Determine suggested type and scope
      const suggestedType = this.determineSuggestedType(categories, diff);
      const suggestedScope = this.determineSuggestedScope(categories, stagedFiles);

      return {
        files: stagedFiles,
        diff: diff.substring(0, 2000), // Limit diff size
        categories,
        fileCount: stagedFiles.length,
        suggestedType,
        suggestedScope,
      };
    } catch (error) {
      throw new Error(`Failed to analyze staged changes: ${error}`);
    }
  }

  /**
   * Categorize files by type and purpose
   */
  private categorizeFiles(files: string[]): FileCategories {
    const categories: FileCategories = {
      controllers: [],
      services: [],
      modules: [],
      components: [],
      tests: [],
      config: [],
      docs: [],
      database: [],
      styles: [],
      other: [],
    };

    files.forEach(file => {
      const fileLower = file.toLowerCase();

      if (fileLower.includes('.controller.') || fileLower.includes('/controllers/')) {
        categories.controllers.push(file);
      } else if (fileLower.includes('.service.') || fileLower.includes('/services/')) {
        categories.services.push(file);
      } else if (fileLower.includes('.module.') || fileLower.includes('app.module')) {
        categories.modules.push(file);
      } else if (fileLower.includes('.component.') || fileLower.includes('/components/')) {
        categories.components.push(file);
      } else if (
        fileLower.includes('.spec.') ||
        fileLower.includes('.test.') ||
        fileLower.includes('/test/') ||
        fileLower.includes('/__tests__/')
      ) {
        categories.tests.push(file);
      } else if (
        fileLower.includes('docker') ||
        fileLower.includes('.env') ||
        fileLower.includes('.yml') ||
        fileLower.includes('.yaml') ||
        fileLower.includes('helm/') ||
        fileLower.includes('config')
      ) {
        categories.config.push(file);
      } else if (
        fileLower.includes('.md') ||
        fileLower.includes('readme') ||
        fileLower.includes('/docs/')
      ) {
        categories.docs.push(file);
      } else if (
        fileLower.includes('prisma/') ||
        fileLower.includes('migration') ||
        fileLower.includes('schema.prisma') ||
        fileLower.includes('.sql')
      ) {
        categories.database.push(file);
      } else if (
        fileLower.includes('.css') ||
        fileLower.includes('.scss') ||
        fileLower.includes('.less') ||
        fileLower.includes('styled')
      ) {
        categories.styles.push(file);
      } else {
        categories.other.push(file);
      }
    });

    return categories;
  }

  /**
   * Determine suggested commit type
   */
  private determineSuggestedType(categories: FileCategories, diff: string): CommitType {
    // Check for new files (usually features)
    if (diff.includes('new file mode')) {
      return 'feat';
    }

    // Check for deletions
    if (diff.includes('deleted file mode')) {
      return 'refactor';
    }

    // Check for test files
    if (categories.tests.length > 0 && this.isOnlyCategory(categories, 'tests')) {
      return 'test';
    }

    // Check for documentation
    if (categories.docs.length > 0 && this.isOnlyCategory(categories, 'docs')) {
      return 'docs';
    }

    // Check for configuration
    if (categories.config.length > 0 && this.isOnlyCategory(categories, 'config')) {
      return 'chore';
    }

    // Check for database changes
    if (categories.database.length > 0) {
      return 'feat';
    }

    // Check for styling changes
    if (categories.styles.length > 0 && this.isOnlyCategory(categories, 'styles')) {
      return 'style';
    }

    // Check diff content for indicators
    const diffLower = diff.toLowerCase();
    if (diffLower.includes('fix') || diffLower.includes('bug') || diffLower.includes('error')) {
      return 'fix';
    }

    if (diffLower.includes('performance') || diffLower.includes('optimize')) {
      return 'perf';
    }

    return 'feat'; // Default to feature
  }

  /**
   * Check if only specific category has files
   */
  private isOnlyCategory(
    categories: FileCategories,
    targetCategory: keyof FileCategories
  ): boolean {
    const nonEmptyCategories = Object.keys(categories).filter(
      key => categories[key as keyof FileCategories].length > 0
    );
    return nonEmptyCategories.length === 1 && nonEmptyCategories[0] === targetCategory;
  }

  /**
   * Determine suggested scope
   */
  private determineSuggestedScope(categories: FileCategories, files: string[]): string | undefined {
    // Check for specific module patterns
    const modulePatterns = [
      { pattern: /auth|authentication/i, scope: 'auth' },
      { pattern: /health/i, scope: 'health' },
      { pattern: /insurance/i, scope: 'insurance' },
      { pattern: /rewards/i, scope: 'rewards' },
      { pattern: /rent-reporting/i, scope: 'rent-reporting' },
      { pattern: /shared/i, scope: 'shared' },
      { pattern: /middleware/i, scope: 'middleware' },
      { pattern: /prisma|database|migration/i, scope: 'db' },
      { pattern: /docker|helm|terraform/i, scope: 'infra' },
      { pattern: /test|spec/i, scope: 'test' },
      { pattern: /\.md$|readme/i, scope: 'docs' },
      { pattern: /component/i, scope: 'ui' },
      { pattern: /api|endpoint/i, scope: 'api' },
    ];

    for (const { pattern, scope } of modulePatterns) {
      if (files.some(file => pattern.test(file))) {
        return scope;
      }
    }

    return undefined;
  }

  /**
   * Generate AI prompt (enhanced with entrata-inspired strategies)
   */
  private generatePrompt(
    analysis: CommitAnalysis,
    userMessage?: string,
    _projectConfig?: ProjectConfig
  ): string {
    const { suggestedType, suggestedScope } = analysis;

    // Detect ticket ID from branch or user message
    const ticketId = this.detectTicketId(userMessage);

    // Note: Project info could be added here for enhanced context if needed

    const filesList = analysis.files
      .slice(0, 5)
      .map(file => `- ${file}`)
      .join('\n');

    // Enhanced diff context
    const diffContext = this.enhanceDiffContext(analysis.diff);

    // User context handling
    const userContext = userMessage ? `User context: "${userMessage}"\n\n` : '';

    return `You are a commit message generator. Generate ONLY a conventional commit message, nothing else.

CHANGES TO COMMIT:
${filesList}${analysis.files.length > 5 ? '\n- ...' : ''}

DIFF SUMMARY:
${diffContext.substring(0, 800)}

REQUIREMENTS:
- Format: type(scope): description
- Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build
- Suggested: ${suggestedType}${suggestedScope ? `(${suggestedScope})` : ''}
- Under 72 characters
- Imperative mood (add, fix, update)
- Only when changes are big: Include 3-5 key bullet points in the commit body describing what was done
${userContext ? `- Context: ${userMessage}` : ''}
${ticketId ? `- Include: ${ticketId}` : ''}

RESPOND WITH ONLY THE COMMIT MESSAGE IN THIS FORMAT:
@@@type(scope): description
    - Bullet point 1
    - Bullet point 2
    - Bullet point 3
@@@

Examples:
@@@feat(auth): add JWT authentication
    - Bullet point 1
    - Bullet point 2
    - Bullet point 3
@@@
@@@fix(api): resolve timeout in user endpoint@@@
@@@docs: update installation guide@@@`;
  }

  /**
   * Detect ticket ID from various sources (inspired by entrata implementation)
   */
  private detectTicketId(userMessage?: string): string | null {
    // Check current branch name
    try {
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
      }).trim();
      const branchMatch = currentBranch.match(/(?:feature|fix|bugfix)\/([A-Z]+-\d+)/i);
      if (branchMatch && branchMatch[1]) {
        return branchMatch[1];
      }
    } catch (error) {
      // Ignore branch detection errors
    }

    // Check user message
    if (userMessage) {
      const messageMatch = userMessage.match(/(?:DEV-|TASK-|TICKET-)(\d+)/i);
      if (messageMatch) {
        return `DEV-${messageMatch[1]}`;
      }
    }

    return null;
  }

  /**
   * Enhance diff context (like entrata implementation)
   */
  private enhanceDiffContext(diff: string): string {
    if (!diff) return 'No diff available';

    if (diff.length > 1000) {
      // Get key changes (additions and deletions)
      const lines = diff.split('\n');
      const keyChanges = lines
        .filter(line => line.startsWith('+') || line.startsWith('-'))
        .filter(line => !line.startsWith('+++') && !line.startsWith('---'))
        .slice(0, 20)
        .join('\n');

      return `${diff.substring(0, 500)}\n\nKey Changes:\n${keyChanges}\n\n[...diff truncated...]`;
    }

    return diff;
  }

  /**
   * Extract commit message from AI response
   */
  private extractCommitMessage(response: string): string {
    // First, try to find a conventional commit format anywhere in the response
    const conventionalCommitRegex =
      /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|security)(\([^)]+\))?: .{1,72}$/gm;
    const matches = response.match(conventionalCommitRegex);
    if (matches && matches.length > 0) {
      // Return the first valid conventional commit message found
      return matches[0];
    }

    // Look for any line that starts with a valid commit type
    const lines = response.split('\n');
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine) {
        // Check if line starts with a conventional commit type
        const typeMatch = cleanLine.match(
          /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|security)(\([^)]+\))?: /
        );
        if (typeMatch) {
          // Return this line if it's reasonable length
          return cleanLine.length <= 100 ? cleanLine : cleanLine.substring(0, 72);
        }
      }
    }

    // Look for lines in code blocks (often AI puts commit messages in backticks)
    const codeBlockMatch = response.match(/```(?:bash|shell|git)?\n([^\n]+)\n```/);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const commitLine = codeBlockMatch[1].trim();
      if (commitLine.match(/^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|security)/)) {
        return commitLine;
      }
    }

    // Fallback: look for any line that looks like a commit message format
    for (const line of lines) {
      const cleanLine = line.trim();
      if (
        cleanLine &&
        cleanLine.length < 100 &&
        cleanLine.includes(':') &&
        !cleanLine.startsWith('#') &&
        !cleanLine.startsWith('*') &&
        !cleanLine.startsWith('-')
      ) {
        return cleanLine;
      }
    }

    // Last resort: return first non-empty line
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine && cleanLine.length < 100) {
        return cleanLine;
      }
    }

    return response.trim().substring(0, 72);
  }

  /**
   * Generate fallback message when AI fails
   */
  private generateFallbackMessage(analysis: CommitAnalysis, userMessage?: string): string {
    const { suggestedType, suggestedScope } = analysis;

    if (userMessage) {
      return `${suggestedType}${suggestedScope ? `(${suggestedScope})` : ''}: ${userMessage}`;
    }

    // Generate a more specific fallback based on the files changed
    const { categories } = analysis;
    let description = 'update implementation';

    if (categories.docs.length > 0 && this.isOnlyCategory(categories, 'docs')) {
      description = 'update documentation';
    } else if (categories.config.length > 0 && this.isOnlyCategory(categories, 'config')) {
      description = 'update configuration files';
    } else if (categories.tests.length > 0 && this.isOnlyCategory(categories, 'tests')) {
      description = 'update tests';
    } else if (categories.database.length > 0) {
      description = 'update database schema';
    } else if (analysis.files.length === 1) {
      const fileName =
        analysis.files[0]
          ?.split('/')
          .pop()
          ?.replace(/\.(ts|js|tsx|jsx)$/, '') || 'file';
      description = `update ${fileName}`;
    } else if (categories.controllers.length > 0) {
      description = 'update controllers';
    } else if (categories.services.length > 0) {
      description = 'update services';
    }

    return `${suggestedType}${suggestedScope ? `(${suggestedScope})` : ''}: ${description}

⚠️  AI generation failed - please edit this commit message to be more specific
Modified ${analysis.fileCount} file${analysis.fileCount > 1 ? 's' : ''}: ${analysis.files.slice(0, 3).join(', ')}${analysis.files.length > 3 ? '...' : ''}`;
  }

  /**
   * Validate commit message format
   */
  private validateMessage(message: string): boolean {
    const conventionalRegex =
      /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|security)(\(.+\))?: .{1,72}/;
    return conventionalRegex.test(message);
  }

  /**
   * Logging utility
   */
  private log(message: string): void {
    // Don't log anything in silent mode
    if (this.options.silentMode) {
      return;
    }
    // Only log in debug mode, or when not in test environment
    if (this.options.debugMode || process.env.NODE_ENV !== 'test') {
      console.log(message);
    }
  }
}
