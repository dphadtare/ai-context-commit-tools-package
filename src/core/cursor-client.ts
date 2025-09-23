import { exec } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { AIGeneratorOptions, CursorResponse } from '../types';

/**
 * Client for interacting with Cursor AI CLI
 */
export class CursorClient {
  private options: AIGeneratorOptions;
  private cursorPath?: string;

  constructor(options: AIGeneratorOptions = {}) {
    this.options = {
      debugMode: false,
      timeout: 30000,
      model: 'sonnet-4',
      maxRetries: 2,
      retryDelay: 2000,
      retryMultiplier: 2,
      ...options,
    };
    this.cursorPath = this.findCursorPath();
  }

  /**
   * Generate AI response using Cursor CLI with retry logic
   */
  async generateResponse(prompt: string): Promise<CursorResponse> {
    if (!this.cursorPath) {
      return {
        success: false,
        error: 'Cursor CLI not found. Please install Cursor CLI for AI features.',
      };
    }

    // Implement retry logic with exponential backoff
    const maxRetries = this.options.maxRetries || 2;
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      if (attempt > 1) {
        const retryMessage = this.options.debugMode
          ? `🔄 Retry attempt ${attempt - 1}/${maxRetries}`
          : `🔄 Retrying AI generation (${attempt - 1}/${maxRetries})...`;
        console.log(retryMessage);
      }

      const result = await this.attemptGeneration(prompt, attempt);

      if (result.success) {
        if (this.options.debugMode && attempt > 1) {
          console.log(`✅ Success on attempt ${attempt}`);
        }
        return result;
      }

      lastError = result.error || 'Unknown error';

      // Check if this is a retryable error
      if (!this.isRetryableError(lastError) || attempt === maxRetries + 1) {
        return result;
      }

      // Calculate delay with exponential backoff
      const baseDelay = this.options.retryDelay || 2000;
      const multiplier = this.options.retryMultiplier || 2;
      const delay = Math.min(baseDelay * Math.pow(multiplier, attempt - 1), 10000);

      if (this.options.debugMode) {
        console.log(`⏳ Waiting ${delay}ms before retry...`);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    return {
      success: false,
      error: lastError,
    };
  }

  /**
   * Attempt to generate response (single attempt)
   */
  private async attemptGeneration(prompt: string, attempt: number): Promise<CursorResponse> {
    return new Promise(resolve => {
      try {
        // Write prompt to temp file to avoid shell escaping issues
        const fs = require('fs');
        const tempFile = `/tmp/cursor-prompt-ai-${Date.now()}-${attempt}.txt`;
        fs.writeFileSync(tempFile, prompt, 'utf8');

        // Use fallback models for retries
        // const models = ['sonnet-4', 'gpt-4', 'claude-3-sonnet'];
        const currentModel = 'sonnet-4';

        // Build command with proper path handling
        const command =
          this.cursorPath === 'cursor-agent'
            ? `cursor-agent --print --model ${currentModel} --output-format text < "${tempFile}"`
            : `"${this.cursorPath}" --print --model ${currentModel} --output-format text < "${tempFile}"`;

        if (this.options.debugMode) {
          console.log('=== CURSOR COMMAND ===');
          console.log(command);
          if (attempt > 1) {
            console.log(`🔄 Trying model: ${currentModel} (attempt ${attempt})`);
          }
          console.log('=== PROMPT ===');
          console.log(`${prompt.substring(0, 500)}...`);
          console.log('=== END DEBUG ===\n');
        }

        // Use longer timeout for first attempt to account for service warmup
        const timeout = attempt === 1 ? this.options.timeout! * 1.5 : this.options.timeout;

        exec(
          command,
          {
            timeout,
            shell: '/bin/bash',
            maxBuffer: 1024 * 1024,
          },
          (error, stdout, _stderr) => {
            // Clean up temp file
            try {
              if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
              }
            } catch (cleanupError) {
              // Ignore cleanup errors
            }

            if (error) {
              let errorMessage = `Cursor CLI execution failed: ${error.message}`;

              // Check if it's a model availability issue and suggest alternatives
              if (error.message.includes('Cannot use this model')) {
                errorMessage += '\n\nAvailable models: auto, sonnet-4, gpt-5, opus-4.1, grok';
                errorMessage += '\nTry using --model auto or --model sonnet-4';
              }

              resolve({
                success: false,
                error: errorMessage,
              });
              return;
            }

            try {
              // Clean response and extract commit message
              // eslint-disable-next-line no-control-regex
              const cleanResponse = stdout.replace(/\x1b\[[0-9;]*m/g, '').trim();

              if (!cleanResponse) {
                resolve({
                  success: false,
                  error: 'Cursor CLI returned empty response',
                });
                return;
              }

              // Extract commit message using improved strategies
              const extractedMessage = this.extractCommitMessageFromResponse(cleanResponse);

              resolve({
                success: true,
                message: extractedMessage,
              });
            } catch (parseError) {
              resolve({
                success: false,
                error: `Failed to parse Cursor response: ${parseError}`,
              });
            }
          }
        );
      } catch (setupError) {
        resolve({
          success: false,
          error: `Failed to setup Cursor CLI call: ${setupError instanceof Error ? setupError.message : String(setupError)}`,
        });
      }
    });
  }

  /**
   * Check if an error is retryable
   */
  public isRetryableError(errorMessage: string): boolean {
    const retryablePatterns = [
      'timeout',
      'etimedout',
      'econnreset',
      'econnrefused',
      'enotfound',
      'network',
      'connection',
      'temporarily unavailable',
      'service unavailable',
      'internal server error',
      'gateway timeout',
      'bad gateway',
      'command failed',
      'cursor cli execution failed',
      'execution error',
      'spawn',
      'no such file',
    ];

    const lowerErrorMessage = errorMessage.toLowerCase();
    return retryablePatterns.some(pattern => lowerErrorMessage.includes(pattern));
  }

  /**
   * Check if Cursor CLI is available
   */
  isAvailable(): boolean {
    return !!this.cursorPath;
  }

  /**
   * Get Cursor CLI version
   */
  async getVersion(): Promise<string | null> {
    if (!this.cursorPath) {
      return null;
    }

    return new Promise(resolve => {
      exec(`${this.cursorPath} --version`, (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        resolve(stdout.trim());
      });
    });
  }

  /**
   * Find Cursor CLI path
   */
  private findCursorPath(): string | undefined {
    const possiblePaths = [
      path.join(os.homedir(), '.local/bin/cursor-agent'),
      '/usr/local/bin/cursor',
      '/opt/homebrew/bin/cursor',
      'cursor',
      'cursor-agent',
    ];

    for (const cursorPath of possiblePaths) {
      try {
        require('child_process').execSync(`${cursorPath} --help`, { stdio: 'ignore' });
        return cursorPath;
      } catch (error) {
        continue;
      }
    }

    return undefined;
  }

  /**
   * Extract commit message from response using multiple strategies (enhanced for verbose responses)
   */
  private extractCommitMessageFromResponse(response: string): string {
    // Strategy 1: Look for delimiter-wrapped content (@@@ ... @@@)
    const delimiterMatch = response.match(/@@@\s*(.*?)\s*@@@/s);
    if (delimiterMatch && delimiterMatch[1]) {
      const delimiterMessage = delimiterMatch[1].trim();
      if (delimiterMessage && delimiterMessage.length > 5) {
        return delimiterMessage;
      }
    }

    // Strategy 2: Look for content in code blocks (```...```)
    const codeBlockMatch = response.match(/```(?:bash|git|text)?\s*\n(.*?)\n```/s);
    if (codeBlockMatch && codeBlockMatch[1]) {
      const blockContent = codeBlockMatch[1].trim();
      const commitLine = blockContent
        .split('\n')
        .find(line =>
          line.match(/^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?:\s*.+/)
        );
      if (commitLine) {
        return commitLine.trim();
      }
    }

    const lines = response.split('\n').filter(line => line.trim());

    // Strategy 3: Look for conventional commit format anywhere in response
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (
        trimmedLine.match(/^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)(\(.+\))?:\s*.+/)
      ) {
        return trimmedLine;
      }
    }

    // Strategy 4: Look for lines that start with common commit patterns
    const commitPatterns = [
      /^(add|fix|update|implement|remove|refactor|improve):/i,
      /^(feat|fix|docs|style|refactor|perf|test|chore|ci|build)[\s(:]/i,
    ];

    for (const pattern of commitPatterns) {
      const matchingLine = lines.find(line => pattern.test(line.trim()));
      if (matchingLine) {
        return matchingLine.trim();
      }
    }

    // Strategy 5: Look for any structured message with colon
    const structuredLine = lines.find(line => {
      const trimmed = line.trim();
      return (
        trimmed.length > 10 &&
        trimmed.length < 80 &&
        trimmed.includes(':') &&
        !trimmed.includes('http') &&
        !trimmed.startsWith('#') &&
        !trimmed.startsWith('$') &&
        !trimmed.includes('git ') &&
        !trimmed.includes('Listed ')
      );
    });

    if (structuredLine) {
      return structuredLine.trim();
    }

    // Strategy 6: Generate a basic commit message based on content analysis
    if (response.toLowerCase().includes('feature') || response.toLowerCase().includes('add')) {
      return 'feat: add new functionality';
    } else if (response.toLowerCase().includes('fix') || response.toLowerCase().includes('bug')) {
      return 'fix: resolve issue';
    } else if (
      response.toLowerCase().includes('update') ||
      response.toLowerCase().includes('change')
    ) {
      return 'chore: update implementation';
    }

    // Last resort: basic commit message
    return 'chore: update code';
  }

  /**
   * Parse Cursor CLI JSON streaming response (kept for backward compatibility)
   */
  private parseResponse(stdout: string): string {
    // For text format, we use the new extraction method
    return this.extractCommitMessageFromResponse(stdout);
  }
}
