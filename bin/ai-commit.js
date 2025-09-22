#!/usr/bin/env node

/**
 * Standalone AI commit command for direct usage
 */

const { program } = require('commander');
const { commitCommand } = require('../lib/commands/commit');

program
  .description('Generate AI-powered commit message')
  .option('-i, --interactive', 'Interactive mode with preview')
  .option('-m, --message <message>', 'Additional context for AI')
  .option('-d, --debug', 'Enable debug output')
  .option('-s, --silent', 'Silent mode for git hooks')
  .option('--model <model>', 'AI model to use (auto, sonnet-4, gpt-5, opus-4.1, grok)')
  .action(commitCommand);

program.parse(process.argv);
