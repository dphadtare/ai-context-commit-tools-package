import chalk from 'chalk';
import { ChangelogGenerator } from '../core/changelog-generator';

interface ChangelogOptions {
  preview?: boolean;
  from?: string;
  debug?: boolean;
}

export async function changelogCommand(options: ChangelogOptions): Promise<void> {
  try {
    const generator = new ChangelogGenerator(process.cwd(), options.debug);

    const result = await generator.generateChangelog(options.preview);

    if (!result) {
      console.log(chalk.yellow('ℹ️  No new commits to process'));
      return;
    }

    if (options.preview) {
      console.log('\n💡 This is a preview. Run without --preview to update CHANGELOG.md');
    } else {
      console.log(chalk.green('📋 Changelog updated in CHANGELOG.md'));
    }
  } catch (error) {
    console.error(chalk.red(`❌ Failed to generate changelog: ${error}`));
    process.exit(1);
  }
}
