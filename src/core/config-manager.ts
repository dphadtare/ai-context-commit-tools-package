import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

interface AIDevToolsConfig {
  cursorPath?: string;
  model?: string;
  timeout?: number;
  debugMode?: boolean;
}

/**
 * Manages configuration for AI Development Tools
 */
export class ConfigManager {
  private configPath: string;
  private config: AIDevToolsConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), '.ai-context-commit-tools', 'config.json');
    this.config = {};
  }

  /**
   * Load configuration
   */
  async load(): Promise<AIDevToolsConfig> {
    try {
      if (await fs.pathExists(this.configPath)) {
        this.config = await fs.readJson(this.configPath);
      }
    } catch (error) {
      // Use default config
    }

    return this.config;
  }

  /**
   * Save configuration
   */
  async save(config: Partial<AIDevToolsConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJson(this.configPath, this.config, { spaces: 2 });
  }

  /**
   * Get configuration value
   */
  get<K extends keyof AIDevToolsConfig>(key: K): AIDevToolsConfig[K] {
    return this.config[key];
  }

  /**
   * Set configuration value
   */
  async set<K extends keyof AIDevToolsConfig>(key: K, value: AIDevToolsConfig[K]): Promise<void> {
    await this.save({ [key]: value });
  }

  /**
   * Reset to default configuration
   */
  async reset(): Promise<void> {
    this.config = {};
    await fs.remove(this.configPath);
  }
}
