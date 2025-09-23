import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectType, ProjectConfig } from '../types';

/**
 * Detects project type and gathers configuration information
 */
export class ProjectDetector {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Detect project type based on dependencies and file structure
   */
  async detectProjectType(): Promise<ProjectType> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');

    if (!(await fs.pathExists(packageJsonPath))) {
      return 'nodejs';
    }

    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Check for NestJS
      if (allDeps['@nestjs/core'] || allDeps['@nestjs/common']) {
        return 'nestjs';
      }

      // Check for React
      if (allDeps['react'] || allDeps['@types/react']) {
        return 'react';
      }

      // Check for Express
      if (allDeps['express'] || allDeps['@types/express']) {
        return 'express';
      }

      return 'nodejs';
    } catch (error) {
      return 'nodejs';
    }
  }

  /**
   * Gather comprehensive project configuration (enhanced like entrata)
   */
  async gatherProjectConfig(): Promise<ProjectConfig> {
    const type = await this.detectProjectType();
    const packageJson = await this.getPackageJson();
    const architecture = await this.getArchitecture();
    const techStack = await this.getTechStack();

    return {
      type,
      name: packageJson.name || 'unknown-project',
      description: packageJson.description,
      techStack,
      architecture,
      dependencies: await this.getKeyDependencies(),
      scripts: await this.getKeyScripts(),
      projectStructure: await this.getProjectStructure(),
    };
  }

  /**
   * Get package.json information
   */
  private async getPackageJson(): Promise<any> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');

    if (await fs.pathExists(packageJsonPath)) {
      return await fs.readJson(packageJsonPath);
    }

    return {};
  }

  /**
   * Extract technology stack information (enhanced like entrata)
   */
  private async getTechStack(): Promise<string[]> {
    const packageJson = await this.getPackageJson();
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const techStack: string[] = [];

    // Framework detection with friendly names
    if (allDeps['@nestjs/core'] || allDeps['@nestjs/common']) techStack.push('NestJS');
    if (allDeps['react']) techStack.push('React');
    if (allDeps['vue']) techStack.push('Vue');
    if (allDeps['angular']) techStack.push('Angular');
    if (allDeps['next']) techStack.push('Next.js');
    if (allDeps['express']) techStack.push('Express');
    if (allDeps['fastify']) techStack.push('Fastify');

    // Language and build tools
    if (allDeps['typescript']) techStack.push('TypeScript');
    if (allDeps['vite']) techStack.push('Vite');
    if (allDeps['webpack']) techStack.push('Webpack');

    // Database and ORM
    if (allDeps['prisma']) techStack.push('Prisma');
    if (allDeps['typeorm']) techStack.push('TypeORM');
    if (allDeps['mongoose']) techStack.push('MongoDB');

    // Authentication
    if (allDeps['@okta/okta-auth-js']) techStack.push('Okta Auth');
    if (allDeps['passport']) techStack.push('Passport');
    if (allDeps['passport-jwt']) techStack.push('JWT');

    // Styling
    if (allDeps['tailwindcss']) techStack.push('Tailwind CSS');
    if (allDeps['styled-components']) techStack.push('Styled Components');

    // Testing
    if (allDeps['jest']) techStack.push('Jest');
    if (allDeps['vitest']) techStack.push('Vitest');
    if (allDeps['cypress']) techStack.push('Cypress');

    return techStack;
  }

  /**
   * Extract key dependencies for context (like entrata)
   */
  private async getKeyDependencies(): Promise<string[]> {
    const packageJson = await this.getPackageJson();
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    return Object.keys(allDeps).slice(0, 10); // Top 10 dependencies
  }

  /**
   * Extract key scripts for context (like entrata)
   */
  private async getKeyScripts(): Promise<string[]> {
    const packageJson = await this.getPackageJson();
    const scripts = packageJson.scripts || {};

    return Object.keys(scripts).filter(script =>
      ['build', 'dev', 'start', 'test', 'lint'].includes(script)
    );
  }

  /**
   * Read architecture documentation
   */
  private async getArchitecture(): Promise<string | undefined> {
    const architectureFiles = [
      'ARCHITECTURE.md',
      'architecture.md',
      'docs/architecture.md',
      'docs/ARCHITECTURE.md',
    ];

    for (const file of architectureFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        return content.substring(0, 1000); // Limit size
      }
    }

    return undefined;
  }

  /**
   * Check if project is a git repository
   */
  async isGitRepository(): Promise<boolean> {
    const gitPath = path.join(this.projectRoot, '.git');
    return await fs.pathExists(gitPath);
  }

  /**
   * Check if Husky is already installed
   */
  async hasHusky(): Promise<boolean> {
    const huskyPath = path.join(this.projectRoot, '.husky');
    const packageJson = await this.getPackageJson();
    const hasDependency = packageJson.devDependencies?.husky || packageJson.dependencies?.husky;

    return (await fs.pathExists(huskyPath)) || !!hasDependency;
  }

  /**
   * Check if GitHub Actions workflow exists
   */
  async hasGitHubWorkflow(): Promise<boolean> {
    const workflowsPath = path.join(this.projectRoot, '.github', 'workflows');
    return await fs.pathExists(workflowsPath);
  }

  /**
   * Get project structure information
   */
  async getProjectStructure(): Promise<string[]> {
    const srcPaths = ['src/', 'lib/', 'app/', 'components/', 'pages/'];
    const existingPaths: string[] = [];

    for (const srcPath of srcPaths) {
      const fullPath = path.join(this.projectRoot, srcPath);
      if (await fs.pathExists(fullPath)) {
        existingPaths.push(srcPath);
      }
    }

    return existingPaths;
  }
}
