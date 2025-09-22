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

  // Install core scripts
  await installCoreScripts(projectRoot, projectConfig);

  // Install git hooks
  if (options.hooks !== false) {
    await installGitHooks(projectRoot);
  }

  // Install GitHub workflow
  if (options.workflow !== false) {
    await installGitHubWorkflow(projectRoot, options);
  }

  // Create project context
  await createProjectContext(projectRoot, projectConfig);

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
 * Install core scripts (using direct package commands - no wrapper files needed)
 */
async function installCoreScripts(projectRoot: string, _projectConfig: any): Promise<void> {
  const spinner = ora('Setting up AI development commands...').start();

  // No need to create wrapper scripts - we'll use direct npx commands in package.json
  // This eliminates ESLint issues with require() statements in generated files

  // Create a simple README for the scripts directory explaining the approach
  const readmeContent = `# AI Context Commit Tools

This project uses ai-context-commit-tools for AI-powered development workflow.

## Available Commands

Instead of local script files, use these NPM commands:

\`\`\`bash
# AI Commit Generation
npm run commit:ai           # Interactive mode
npx ai-commit --interactive # Direct command
npx ai-commit --silent      # For git hooks

# Changelog Generation  
npm run changelog:preview   # Preview changes
npm run changelog:ci        # Generate changelog
npx ai-changelog           # Direct command
\`\`\`

## Benefits

- ✅ Builds rich AI context through intelligent commits
- ✅ Always up-to-date (no copied files)
- ✅ No ESLint issues with require() statements
- ✅ Smaller project footprint
- ✅ Enhanced AI-assisted development

## Advanced Usage

\`\`\`bash
# With context
npx ai-commit --message "fixing auth bug"

# Debug mode
npx ai-commit --debug

# From specific commit
npx ai-changelog --from HEAD~10
\`\`\`
`;

  await fs.writeFile(path.join(projectRoot, 'scripts/README.md'), readmeContent);

  spinner.succeed('AI development commands configured (no wrapper scripts needed)');
}

/**
 * Install git hooks (using package references instead of copying)
 */
async function installGitHooks(projectRoot: string): Promise<void> {
  const spinner = ora('Installing git hooks...').start();

  // Create hook that references the package directly
  const hookContent = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# AI Commit Message Hook (Package Reference Approach)
# Uses the installed AI development tools package directly

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Skip for merges, amends, etc. - only for normal commits
if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ]; then

    echo "🤖 Auto-generating AI commit message..."

    # Check if user provided a message to use as context
    USER_MESSAGE=""
    if [ -s "$COMMIT_MSG_FILE" ]; then
        USER_MESSAGE=$(head -n 1 "$COMMIT_MSG_FILE" | grep -v '^#' | head -c 200)
        if [ -n "$USER_MESSAGE" ]; then
            echo "💡 Using user message as context: '$USER_MESSAGE'"
        fi
    fi

    # Generate AI message using the package directly (no local scripts needed)
    if [ -n "$USER_MESSAGE" ]; then
        AI_MESSAGE=$(npx ai-commit --silent --message "$USER_MESSAGE" 2>/dev/null)
    else
        AI_MESSAGE=$(npx ai-commit --silent 2>/dev/null)
    fi

    if [ $? -eq 0 ] && [ -n "$AI_MESSAGE" ]; then
        echo "✨ Generated: $AI_MESSAGE"

        # Use generated AI message
        echo "$AI_MESSAGE" > "$COMMIT_MSG_FILE"
        echo "" >> "$COMMIT_MSG_FILE"
        echo "##### AI-generated commit message above, Edit if needed, or keep as-is" >> "$COMMIT_MSG_FILE"
        echo "#" >> "$COMMIT_MSG_FILE"
        echo "##### Staged files:" >> "$COMMIT_MSG_FILE"
        git diff --cached --name-status >> "$COMMIT_MSG_FILE"

    else
        echo "⚠️  AI generation failed, using template"

        # Fallback template
        cat > "$COMMIT_MSG_FILE" << EOF
# Write your commit message here
#
##### Format: type(scope): description
##### Example: feat(auth): add OAuth login
#
##### Staged files:
$(git diff --cached --name-status)
EOF
    fi
fi
`;

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

  // Use smart PR workflow that handles existing PRs intelligently
  const workflowContent = createSmartPRWorkflowContent();

  await fs.ensureDir(path.join(projectRoot, '.github/workflows'));
  await fs.writeFile(path.join(projectRoot, '.github/workflows/changelog.yml'), workflowContent);

  spinner.succeed('GitHub Actions workflow installed (smart PR with auto-merge)');
  console.log('\n🚀 Note: This workflow intelligently manages changelog PRs:');
  console.log('   • Skips if existing PR has no new changes');
  console.log('   • Updates existing PR if new commits are available');
  console.log('   • Auto-merges when all checks pass');
}

/**
 * Create smart PR workflow that handles existing PRs intelligently
 */
function createSmartPRWorkflowContent(): string {
  return `name: Changelog Update

on:
  schedule:
    - cron: '30 17 * * *' # 11:00 PM IST (5:30 PM UTC) daily
  workflow_dispatch: # Manual trigger option

jobs:
  changelog:
    runs-on: ubuntu-latest
    permissions:
      contents: write # Needed to create branches and PRs
      pull-requests: write # Needed to create and manage PRs

    steps:
      - name: 📥 Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Need full history for incremental generation
          token: \${{ secrets.GITHUB_TOKEN }}

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🔍 Check for existing changelog PR
        id: check_pr
        run: |
          echo "🔍 Checking for existing changelog PRs..."
          
          # Look for open PRs with changelog in title created by github-actions bot
          # Use basic gh pr list without advanced flags for maximum compatibility
          EXISTING_PR_LIST=\$(gh pr list --state open --author "github-actions[bot]" 2>/dev/null || echo "")
          
          # Filter for changelog PRs manually
          EXISTING_PR=""
          EXISTING_BRANCH=""
          
          if [ -n "\$EXISTING_PR_LIST" ]; then
            # Look for PRs with "chore: update changelog" in the title
            CHANGELOG_PR_LINE=\$(echo "\$EXISTING_PR_LIST" | grep "chore: update changelog" | head -n1)
            if [ -n "\$CHANGELOG_PR_LINE" ]; then
              # Extract PR number (first field in tab-separated format)
              EXISTING_PR=\$(echo "\$CHANGELOG_PR_LINE" | cut -f1)
              # Try to get branch name, fallback to pattern if gh view fails
              EXISTING_BRANCH=\$(gh pr view "\$EXISTING_PR" 2>/dev/null | grep "head:" | awk '{print \$2}' || echo "changelog-update-")
            fi
          fi
          
          if [ -n "\$EXISTING_PR" ]; then
            echo "Found existing changelog PR #\$EXISTING_PR on branch \$EXISTING_BRANCH"
            echo "existing_pr=\$EXISTING_PR" >> \$GITHUB_OUTPUT
            echo "existing_branch=\$EXISTING_BRANCH" >> \$GITHUB_OUTPUT
            echo "has_existing_pr=true" >> \$GITHUB_OUTPUT
          else
            echo "No existing changelog PR found"
            echo "has_existing_pr=false" >> \$GITHUB_OUTPUT
          fi
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}

      - name: 📋 Generate incremental changelog
        run: |
          echo "🔄 Generating changelog from commits..."
          # Use the package's changelog command directly
          npx ai-changelog

      - name: 📝 Handle changelog updates intelligently
        run: |
          git config --local user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"

          if ! git diff --quiet CHANGELOG.md; then
            echo "📋 Changelog has changes..."
            
            if [ "\${{ steps.check_pr.outputs.has_existing_pr }}" = "true" ]; then
              # Scenario 2: Update existing PR with new changes
              echo "🔄 Updating existing PR #\${{ steps.check_pr.outputs.existing_pr }}"
              
              # Switch to existing branch and update it
              git fetch origin \${{ steps.check_pr.outputs.existing_branch }}
              git checkout \${{ steps.check_pr.outputs.existing_branch }}
              git reset --hard origin/main  # Reset to latest main
              
              # Re-generate changelog to include all new commits
              npx ai-changelog
              
              if ! git diff --quiet CHANGELOG.md; then
                git add CHANGELOG.md
                git commit -m "📋 chore: update changelog

                - Auto-generated from recent commits  
                - Updated on: \$(date -u +"%Y-%m-%d %H:%M:%S UTC")
                - Workflow: changelog-update

                [skip ci]"
                
                git push origin \${{ steps.check_pr.outputs.existing_branch }} --force
                echo "✅ Updated existing PR #\${{ steps.check_pr.outputs.existing_pr }}"
                
                # Update PR description with new timestamp
                gh pr edit \${{ steps.check_pr.outputs.existing_pr }} --body "## Automated Changelog Update

                This PR contains an automated update to the CHANGELOG.md file based on recent commits.

                ### Changes
                - Updated CHANGELOG.md with recent commits
                - Last updated: \$(date -u +"%Y-%m-%d %H:%M:%S UTC")
                - Workflow: changelog-update

                ### Auto-Merge
                This PR will be automatically merged when all status checks pass and required approvals are received.

                ---
                *This PR was automatically created and updated by the changelog workflow.*"
              else
                echo "ℹ️ No new changes after updating to latest main"
              fi
            else
              # Scenario: Create new PR
              echo "🆕 Creating new changelog PR..."
              
              # Create a new branch for the changelog update
              BRANCH_NAME="changelog-update-\$(date +%Y%m%d-%H%M%S)"
              git checkout -b "\$BRANCH_NAME"
              
              # Add and commit changes
              git add CHANGELOG.md
              git commit -m "📋 chore: update changelog

              - Auto-generated from recent commits
              - Generated on: \$(date -u +"%Y-%m-%d %H:%M:%S UTC")
              - Workflow: changelog-update

              [skip ci]"
              
              # Push the branch
              git push origin "\$BRANCH_NAME"
              
              # Create pull request using GitHub CLI
              gh pr create \\
                --title "📋 chore: update changelog" \\
                --body "## Automated Changelog Update

              This PR contains an automated update to the CHANGELOG.md file based on recent commits.

              ### Changes
              - Updated CHANGELOG.md with recent commits
              - Generated on: \$(date -u +"%Y-%m-%d %H:%M:%S UTC")
              - Workflow: changelog-update

              ### Auto-Merge
              This PR will be automatically merged when all status checks pass and required approvals are received.

              ---
              *This PR was automatically created by the changelog workflow.*" \\
                --head "\$BRANCH_NAME" \\
                --base main
              
              echo "✅ Created new changelog PR"
              
              # Try to enable auto-merge for the just-created PR
              echo "🔄 Attempting to enable auto-merge..."
              sleep 3  # Give GitHub a moment to process the PR creation
              
              # Try multiple approaches for auto-merge
              if gh pr merge "\$BRANCH_NAME" --auto --squash --delete-branch 2>/dev/null; then
                echo "🚀 Auto-merge enabled successfully"
              elif gh pr merge "\$BRANCH_NAME" --auto --merge --delete-branch 2>/dev/null; then
                echo "🚀 Auto-merge enabled with merge strategy"
              else
                echo "⚠️ Auto-merge could not be enabled automatically"
                echo "💡 The PR has been created and is ready for review"
                echo "💡 Enable auto-merge manually via GitHub UI or run:"
                echo "   gh pr merge \$BRANCH_NAME --auto --squash --delete-branch"
              fi
            fi
          else
            if [ "\${{ steps.check_pr.outputs.has_existing_pr }}" = "true" ]; then
              # Scenario 1: Existing PR with no new changes - do nothing
              echo "ℹ️ Existing PR #\${{ steps.check_pr.outputs.existing_pr }} found, but no new changes to add"
              echo "⏭️ Skipping workflow - existing PR will be merged when approved"
            else
              echo "ℹ️ No changelog changes to commit and no existing PR"
            fi
          fi
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
}

/**
 * Create project context
 */
async function createProjectContext(projectRoot: string, projectConfig: any): Promise<void> {
  const spinner = ora('Creating project context...').start();

  const templatesDir = path.join(__dirname, '../../templates');
  const contextPath = path.join(projectRoot, '.cursor/context.md');

  // Check if context.md already exists
  if (await fs.pathExists(contextPath)) {
    spinner.succeed('Project context already exists');
    return;
  }

  let contextContent: string;

  try {
    // Try to read the specific template for this project type
    const templatePath = path.join(templatesDir, `context-${projectConfig.type}.md`);
    contextContent = await fs.readFile(templatePath, 'utf8');

    // Replace placeholders
    contextContent = contextContent
      .replace(/\{\{PROJECT_NAME\}\}/g, projectConfig.name)
      .replace(/\{\{PROJECT_DESCRIPTION\}\}/g, projectConfig.description || '')
      .replace(/\{\{TECH_STACK\}\}/g, projectConfig.techStack.join(', '));

    spinner.succeed('Project context created');
  } catch (error) {
    // If template doesn't exist, create a generic context file
    contextContent = createGenericContextTemplate(projectConfig);
    spinner.succeed(
      'Generic project context created (customize .cursor/context.md for better AI suggestions)'
    );
  }

  await fs.writeFile(contextPath, contextContent);
}

/**
 * Create generic context template when specific template is not available
 */
function createGenericContextTemplate(projectConfig: any): string {
  return `# ${projectConfig.name} - Project Context

## Architecture Overview

This is a **${projectConfig.type.charAt(0).toUpperCase() + projectConfig.type.slice(1)} Application** with the following characteristics:

### Technology Stack
${projectConfig.techStack.length > 0 ? projectConfig.techStack.map((tech: string) => `- ${tech}`).join('\n') : '- Add your technology stack here'}

### Project Details
- **Name**: ${projectConfig.name}
- **Description**: ${projectConfig.description || 'Add your project description here'}
- **Type**: ${projectConfig.type.charAt(0).toUpperCase() + projectConfig.type.slice(1)} Application

### Key Features
- Add your key features here
- Describe main functionality
- List important components

### Development Patterns
- Add your coding patterns here
- Describe architectural decisions
- List important conventions

### Project Structure
\`\`\`
Add your project structure here
\`\`\`

## Instructions for AI

Please customize this file with:
1. Detailed project description
2. Key architectural decisions
3. Important business logic
4. Coding standards and patterns
5. Common file locations and purposes

This context helps the AI generate better commit messages and understand your codebase.
`;
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
  console.log('  - Customize .cursor/context.md for your project');
  console.log('  - Review and edit generated commit messages as needed');
  console.log('');
  console.log(chalk.cyan('🔗 Direct Package Command Approach:'));
  console.log('  ✅ No wrapper scripts (eliminates ESLint issues)');
  console.log('  ✅ Always up-to-date (direct package usage)');
  console.log('  ✅ Minimal project footprint');
  console.log('  ✅ Use npm scripts or npx commands directly');
}
