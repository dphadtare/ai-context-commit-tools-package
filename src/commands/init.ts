import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { ProjectDetector } from '../core/project-detector';
import { InitOptions, ProjectType } from '../types';

/**
 * Initialize AI development tools in a project
 */
export async function initCommand(options: InitOptions): Promise<void> {
  const projectRoot = process.cwd();
  const detector = new ProjectDetector(projectRoot);

  console.log(chalk.blue.bold('\n🚀 Initializing AI Development Tools...\n'));

  try {
    // Check prerequisites
    await checkPrerequisites(detector);

    // Detect or confirm project type
    const projectType = await determineProjectType(detector, options.type);

    // Gather project configuration
    const spinner = ora('Gathering project configuration...').start();
    const projectConfig = await detector.gatherProjectConfig();
    projectConfig.type = projectType;
    spinner.succeed('Project configuration gathered');

    // Interactive confirmation if not forced
    if (!options.force && options.interactive !== false) {
      const confirmed = await confirmInstallation(projectConfig, options);
      if (!confirmed) {
        console.log(chalk.yellow('Installation cancelled.'));
        return;
      }
    }

    // Install components
    await installComponents(projectRoot, projectConfig, options);

    // Show completion message
    showCompletionMessage(projectConfig);
  } catch (error) {
    console.error(chalk.red(`\n❌ Installation failed: ${error}`));
    process.exit(1);
  }
}

/**
 * Check prerequisites
 */
async function checkPrerequisites(detector: ProjectDetector): Promise<void> {
  const spinner = ora('Checking prerequisites...').start();

  // Check if in git repository
  if (!(await detector.isGitRepository())) {
    spinner.fail('Not in a git repository');
    throw new Error('Please run this command from the root of a git repository');
  }

  // Check if package.json exists
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!(await fs.pathExists(packageJsonPath))) {
    spinner.fail('package.json not found');
    throw new Error('package.json not found. Please run this command from a Node.js project root');
  }

  spinner.succeed('Prerequisites checked');
}

/**
 * Determine project type
 */
async function determineProjectType(
  detector: ProjectDetector,
  typeOption?: ProjectType
): Promise<ProjectType> {
  if (typeOption && typeOption !== 'auto') {
    return typeOption;
  }

  const spinner = ora('Detecting project type...').start();
  const detectedType = await detector.detectProjectType();
  spinner.succeed(`Detected project type: ${chalk.cyan(detectedType)}`);

  return detectedType;
}

/**
 * Confirm installation with user
 */
async function confirmInstallation(projectConfig: any, options: InitOptions): Promise<boolean> {
  console.log(chalk.cyan('\n📋 Installation Summary:'));
  console.log(`  Project: ${chalk.white(projectConfig.name)}`);
  console.log(`  Type: ${chalk.white(projectConfig.type)}`);
  console.log(
    `  Tech Stack: ${chalk.white(projectConfig.techStack.join(', ') || 'None detected')}`
  );

  console.log(chalk.cyan('\n🔧 Components to install:'));
  console.log('  ✅ AI Commit Message Generator');
  console.log('  ✅ Automated Changelog Generator');
  if (options.hooks !== false) {
    console.log('  ✅ Git Hooks (Husky)');
  }
  if (options.workflow !== false) {
    console.log('  ✅ GitHub Actions Workflow');
  }
  console.log('  ✅ Project Context Configuration');
  console.log('  ✅ Documentation');

  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: 'Proceed with installation?',
      default: true,
    },
  ]);

  return confirmed;
}

/**
 * Install all components
 */
async function installComponents(
  projectRoot: string,
  projectConfig: any,
  options: InitOptions
): Promise<void> {
  // Create directories
  await createDirectories(projectRoot);

  // Install git hooks
  if (options.hooks !== false) {
    await installGitHooks(projectRoot);
  }

  // Install GitHub workflow
  if (options.workflow !== false) {
    await installGitHubWorkflow(projectRoot, options);
  }

  // Install documentation
  await installDocumentation(projectRoot);

  // Update package.json
  await updatePackageJson(projectRoot, options);

  // Install dependencies
  await installDependencies(projectRoot);

  // Create initial changelog
  await createInitialChangelog(projectRoot);
}

/**
 * Create necessary directories
 */
async function createDirectories(projectRoot: string): Promise<void> {
  const spinner = ora('Creating directories...').start();

  const dirs = ['scripts', '.husky', '.github/workflows', 'docs', '.cursor'];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectRoot, dir));
  }

  spinner.succeed('Directories created');
}

/**
 * Install git hooks (using package references instead of copying)
 */
async function installGitHooks(projectRoot: string): Promise<void> {
  const spinner = ora('Installing git hooks...').start();

  // Read the hook template from the templates directory
  const templatePath = path.join(__dirname, '../../templates/prepare-commit-msg.sh');
  const hookContent = await fs.readFile(templatePath, 'utf8');

  const hookPath = path.join(projectRoot, '.husky/prepare-commit-msg');
  await fs.writeFile(hookPath, hookContent);

  try {
    execSync(`chmod +x "${hookPath}"`, { cwd: projectRoot });
  } catch (error) {
    // Ignore chmod errors on Windows
  }

  spinner.succeed('Git hooks installed (using package references)');
}

/**
 * Install GitHub workflow (smart PR with auto-merge)
 */
async function installGitHubWorkflow(projectRoot: string, _options: InitOptions): Promise<void> {
  const spinner = ora('Installing GitHub Actions workflow...').start();

  // Read the workflow template from the templates directory
  const templatePath = path.join(__dirname, '../../templates/changelog.yml');
  const workflowContent = await fs.readFile(templatePath, 'utf8');

  await fs.ensureDir(path.join(projectRoot, '.github/workflows'));
  await fs.writeFile(path.join(projectRoot, '.github/workflows/changelog.yml'), workflowContent);

  spinner.succeed('GitHub Actions workflow installed (smart PR with auto-merge)');
  console.log('\n🚀 Note: This workflow intelligently manages changelog PRs:');
  console.log('   • Skips if existing PR has no new changes');
  console.log('   • Updates existing PR if new commits are available');
  console.log('   • Auto-merges when all checks pass');
}

/**
 * Install documentation
 */
async function installDocumentation(projectRoot: string): Promise<void> {
  const spinner = ora('Installing documentation...').start();

  try {
    // Copy the main documentation file
    const docsDir = path.join(__dirname, '../../docs');
    const sourcePath = path.join(docsDir, 'ai-development-tools.md');
    const targetPath = path.join(projectRoot, 'docs/ai-development-tools.md');

    // Check if source documentation exists
    if (await fs.pathExists(sourcePath)) {
      await fs.copy(sourcePath, targetPath);
      spinner.succeed('Documentation installed');
    } else {
      spinner.warn('Documentation source not found, skipping documentation installation');
    }
  } catch (error) {
    spinner.warn('Could not install documentation, please refer to package documentation');
  }
}

/**
 * Update package.json
 */
async function updatePackageJson(projectRoot: string, options: InitOptions): Promise<void> {
  const spinner = ora('Updating package.json...').start();

  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = await fs.readJson(packageJsonPath);

  // Add scripts (using package commands directly)
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['commit:ai'] = 'npx ai-commit --interactive';
  packageJson.scripts['changelog:ci'] = 'npx ai-changelog';
  packageJson.scripts['changelog:preview'] = 'npx ai-changelog --preview';

  if (options.hooks !== false) {
    packageJson.scripts['prepare'] = 'husky install';
  }

  // Add dev dependencies
  packageJson.devDependencies = packageJson.devDependencies || {};
  if (options.hooks !== false) {
    packageJson.devDependencies['husky'] = '^8.0.3';
  }

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });

  spinner.succeed('package.json updated');
}

/**
 * Install dependencies
 */
async function installDependencies(projectRoot: string): Promise<void> {
  const spinner = ora('Installing dependencies...').start();

  try {
    execSync('npm install', { cwd: projectRoot, stdio: 'ignore' });

    // Initialize Husky
    try {
      execSync('npm run prepare', { cwd: projectRoot, stdio: 'ignore' });
    } catch (error) {
      // Ignore if prepare script doesn't exist
    }

    spinner.succeed('Dependencies installed');
  } catch (error) {
    spinner.warn('Could not install dependencies automatically. Please run: npm install');
  }
}

/**
 * Create initial changelog
 */
async function createInitialChangelog(projectRoot: string): Promise<void> {
  const spinner = ora('Creating initial changelog...').start();

  const changelogPath = path.join(projectRoot, 'CHANGELOG.md');

  if (!(await fs.pathExists(changelogPath))) {
    const initialChangelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **dev-tools**: AI-powered commit message generation system
- **dev-tools**: automated changelog generation via CI/CD

### Maintenance

- **deps**: added AI development tools integration

<!-- Generated: ${new Date().toISOString()} Commit: initial -->
<!-- CI-LAST-PROCESSED: initial -->
`;

    await fs.writeFile(changelogPath, initialChangelog);
    spinner.succeed('Initial changelog created');
  } else {
    spinner.succeed('Changelog already exists');
  }
}

/**
 * Show completion message
 */
function showCompletionMessage(_projectConfig: any): void {
  console.log(chalk.green.bold('\n🎉 AI Development Tools installed successfully!\n'));

  console.log(chalk.cyan('📋 What was configured:'));
  console.log('  ✅ AI commit message generation (direct package commands)');
  console.log('  ✅ Automated changelog generation (direct package commands)');
  console.log('  ✅ GitHub Actions workflow (package references)');
  console.log('  ✅ Git hooks with Husky (package references)');
  console.log('  ✅ Project documentation\n');

  console.log(chalk.cyan('🚀 Getting started:'));
  console.log('  1. Make some changes to your code');
  console.log('  2. Stage them: git add .');
  console.log('  3. Commit: git commit (AI will generate the message)');
  console.log('  4. Or try: npm run commit:ai\n');

  console.log(chalk.cyan('📖 Commands available:'));
  console.log('  npm run commit:ai         - Interactive AI commit generation');
  console.log('  npm run changelog:preview - Preview changelog changes');
  console.log('  npm run changelog:ci      - Generate changelog (CI mode)\n');

  console.log(chalk.cyan('📚 Documentation:'));
  console.log('  Check docs/ai-development-tools.md for detailed usage\n');

  console.log(chalk.yellow('💡 Next steps:'));
  console.log('  - Ensure Cursor CLI is installed for AI features');
  console.log('  - AI will use live project analysis for context');
  console.log('  - Review and edit generated commit messages as needed');
  console.log('');
  console.log(chalk.cyan('🔗 Direct Package Command Approach:'));
  console.log('  ✅ No wrapper scripts (eliminates ESLint issues)');
  console.log('  ✅ Always up-to-date (direct package usage)');
  console.log('  ✅ Minimal project footprint');
  console.log('  ✅ Use npm scripts or npx commands directly');
}
