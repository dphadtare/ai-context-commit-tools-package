import chalk from 'chalk';
import { CursorClient } from '../core/cursor-client';
import { ProjectDetector } from '../core/project-detector';

export async function statusCommand(): Promise<void> {
  console.log(chalk.blue.bold('🔍 AI Development Tools Status\n'));

  const detector = new ProjectDetector();
  const cursorClient = new CursorClient();

  // Check Cursor CLI
  const cursorAvailable = cursorClient.isAvailable();
  console.log(
    `Cursor CLI: ${cursorAvailable ? chalk.green('✅ Available') : chalk.red('❌ Not found')}`
  );

  if (cursorAvailable) {
    const version = await cursorClient.getVersion();
    if (version) {
      console.log(`  Version: ${chalk.cyan(version)}`);
    }
  }

  // Check Git repository
  const isGitRepo = await detector.isGitRepository();
  console.log(`Git Repository: ${isGitRepo ? chalk.green('✅ Yes') : chalk.red('❌ No')}`);

  // Check Husky
  const hasHusky = await detector.hasHusky();
  console.log(
    `Git Hooks (Husky): ${hasHusky ? chalk.green('✅ Installed') : chalk.yellow('⚠️  Not installed')}`
  );

  // Check GitHub Actions
  const hasWorkflow = await detector.hasGitHubWorkflow();
  console.log(
    `GitHub Workflow: ${hasWorkflow ? chalk.green('✅ Present') : chalk.yellow('⚠️  Not found')}`
  );

  // Project type
  const projectType = await detector.detectProjectType();
  console.log(`Project Type: ${chalk.cyan(projectType)}`);

  console.log(`\n${chalk.cyan('📚 Available Commands:')}`);
  console.log('  ai-context-commit-tools init     - Initialize in project');
  console.log('  ai-context-commit-tools commit   - Generate commit message');
  console.log('  ai-context-commit-tools changelog - Generate changelog');
}
