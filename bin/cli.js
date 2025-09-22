#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { version } = require('../package.json');

// Import commands
const { initCommand } = require('../lib/commands/init');
const { commitCommand } = require('../lib/commands/commit');
const { changelogCommand } = require('../lib/commands/changelog');
const { configCommand } = require('../lib/commands/config');

console.log(chalk.blue.bold(`🤖 AI Development Tools v${version}`));

program
  .name('ai-dev-tools')
  .description('AI-powered development tools for commit messages and changelog automation')
  .version(version);

// Initialize command
program
  .command('init')
  .description('Initialize AI development tools in your project')
  .option('-t, --type <type>', 'Project type (nestjs, react, express, nodejs)', 'auto')
  .option('-f, --force', 'Force overwrite existing files')
  .option('--no-hooks', 'Skip git hooks installation')
  .option('--no-workflow', 'Skip GitHub Actions workflow')
  .action(initCommand);

// Commit command
program
  .command('commit')
  .alias('c')
  .description('Generate AI-powered commit message')
  .option('-i, --interactive', 'Interactive mode with preview')
  .option('-m, --message <message>', 'Additional context for AI')
  .option('-d, --debug', 'Enable debug output')
  .option('-s, --silent', 'Silent mode for git hooks')
  .option('--model <model>', 'AI model to use (auto, sonnet-4, gpt-5, opus-4.1, grok)')
  .action(commitCommand);

// Changelog command
program
  .command('changelog')
  .alias('cl')
  .description('Generate or preview changelog')
  .option('-p, --preview', 'Preview changes without writing to file')
  .option('-f, --from <commit>', 'Generate from specific commit')
  .option('-d, --debug', 'Enable debug output')
  .action(changelogCommand);

// Config command
program
  .command('config')
  .description('Configure AI development tools')
  .option('-s, --show', 'Show current configuration')
  .option('-r, --reset', 'Reset to default configuration')
  .action(configCommand);

// Status command
program
  .command('status')
  .description('Check AI development tools status')
  .action(require('../lib/commands/status').statusCommand);

// Update command
program
  .command('update')
  .description('Update AI development tools')
  .action(require('../lib/commands/update').updateCommand);

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
