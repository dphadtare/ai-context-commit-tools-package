import chalk from 'chalk';
import { AICommitGenerator } from '../core/commit-generator';
import { ProjectDetector } from '../core/project-detector';

interface CommitOptions {
  interactive?: boolean;
  message?: string;
  debug?: boolean;
  silent?: boolean;
}

export async function commitCommand(options: CommitOptions): Promise<void> {
  try {
    // Silent mode for git hooks (like entrata implementation)
    if (options.silent) {
      const detector = new ProjectDetector();
      const projectConfig = await detector.gatherProjectConfig();

      const generator = new AICommitGenerator(process.cwd(), {
        debugMode: false,
        silentMode: true,
      });

      const message = await generator.generateCommitMessage(options.message, projectConfig);

      // Only output the message for git hook consumption
      console.log(message);
      return;
    }

    // Interactive mode
    if (options.interactive) {
      console.log(chalk.blue.bold('🤖 AI Commit Generator'));
      console.log('Please stage your changes first with: git add <files>');
    }

    const detector = new ProjectDetector();
    const projectConfig = await detector.gatherProjectConfig();

    const generator = new AICommitGenerator(process.cwd(), {
      debugMode: options.debug,
    });

    const message = await generator.generateCommitMessage(options.message, projectConfig);

    console.log('\n📝 Generated commit message:');
    console.log('─'.repeat(50));
    console.log(message);
    console.log('─'.repeat(50));

    if (options.interactive) {
      console.log('\n💡 Copy this message and use it with: git commit -m "..."');
      console.log('Or edit your commit message in your git editor.');
    }
  } catch (error) {
    if (!options.silent) {
      console.error(chalk.red(`❌ Failed to generate commit message: ${error}`));
    }
    process.exit(1);
  }
}
