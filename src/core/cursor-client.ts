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
        this.log(retryMessage);
      }

      const result = await this.attemptGeneration(prompt, attempt);

      if (result.success) {
        if (this.options.debugMode && attempt > 1) {
          this.log(`✅ Success on attempt ${attempt}`);
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
        this.log(`⏳ Waiting ${delay}ms before retry...`);
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

        // Use fallback models for retries based on availability
        const models = ['sonnet-4', 'auto', 'gpt-5', 'opus-4.1'];
        const currentModel = this.getModelForAttempt(attempt, models);

        // Build command with proper path handling
        const command =
          this.cursorPath === 'cursor-agent'
            ? `cursor-agent --print --model ${currentModel} --output-format text < "${tempFile}"`
            : `"${this.cursorPath}" --print --model ${currentModel} --output-format text < "${tempFile}"`;

        if (this.options.debugMode) {
          this.log('=== CURSOR COMMAND ===');
          this.log(command);
          if (attempt > 1) {
            this.log(`🔄 Trying model: ${currentModel} (attempt ${attempt})`);
          }
          this.log('=== PROMPT ===');
          this.log(`${prompt.substring(0, 500)}...`);
          this.log('=== END DEBUG ===\n');
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
                errorMessage += `\n\nTried model: ${currentModel}`;
                errorMessage += '\nAvailable models: auto, sonnet-4, gpt-5, opus-4.1, grok';
                errorMessage += '\nTip: Use --model auto for automatic model selection';

                // If this is not the last attempt, mention retries
                const maxRetriesConfig = this.options.maxRetries || 2;
                if (attempt < maxRetriesConfig + 1) {
                  errorMessage += `\nRetrying with different model...`;
                }
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

              // Return the raw response - extraction will be handled by commit-generator
              resolve({
                success: true,
                message: cleanResponse,
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
   * Get the appropriate model for the current attempt
   */
  private getModelForAttempt(attempt: number, models: string[]): string {
    // Use the user's preferred model first, then fallback through the list
    const preferredModel = this.options.model || 'sonnet-4';

    if (attempt === 1) {
      return preferredModel;
    }

    // For retry attempts, use models in order, skipping the preferred model
    const fallbackModels = models.filter(model => model !== preferredModel);
    if (fallbackModels.length === 0) {
      return 'auto'; // Ultimate fallback
    }

    const modelIndex = (attempt - 2) % fallbackModels.length;
    return fallbackModels[modelIndex] || 'auto';
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
      'cannot use this model',
      'model not available',
      'model unavailable',
      'segmentation fault',
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
   * Logging utility that respects silentMode
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
