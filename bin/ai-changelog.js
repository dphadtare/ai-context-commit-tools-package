#!/usr/bin/env node

/**
 * Standalone AI changelog command for direct usage
 */

const { program } = require('commander');
const { changelogCommand } = require('../lib/commands/changelog');

program
  .description('Generate or preview changelog')
  .option('-p, --preview', 'Preview changes without writing to file')
  .option('-f, --from <commit>', 'Generate from specific commit')
  .option('-d, --debug', 'Enable debug output')
  .action(changelogCommand);

program.parse(process.argv);
