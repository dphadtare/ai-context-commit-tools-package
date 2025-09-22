# AI Context Commit Tools Documentation

## Overview

AI Context Commit Tools is a comprehensive package that builds rich project context through AI-powered commit message generation and automated changelog creation. It integrates seamlessly with your development workflow to enhance AI-assisted development and maintain consistent project documentation.

## Features

- 🤖 **AI-Powered Commit Messages**: Generate meaningful commit messages based on code changes
- 📝 **Automated Changelog**: Create and maintain CHANGELOG.md files automatically
- 🔗 **Git Hooks Integration**: Automatic commit message generation via Husky hooks
- 🚀 **CI/CD Ready**: GitHub Actions workflow for automated changelog updates
- 🎯 **Project-Aware**: Detects project type and adapts to your tech stack
- ⚙️ **Configurable**: Customize AI behavior and output format
- 🔗 **Package References**: Uses package commands directly (no copied templates)

## Package Reference Approach

This tool uses a **package reference approach** instead of copying template files to your project:

### Benefits
- ✅ **Always up-to-date**: No stale copied templates
- ✅ **Smaller footprint**: No duplicated code in your project  
- ✅ **Automatic updates**: Get improvements when the package updates
- ✅ **Centralized logic**: All AI logic stays in the package

### How it Works
- **Git hooks** call `npx ai-commit` directly
- **Scripts** reference package commands via `npx`
- **Workflows** use package commands in CI/CD
- **No local copies** of template files needed

## Installation

### Global Installation (Recommended)

```bash
npm install -g ai-context-commit-tools
```

### Local Installation

```bash
npm install --save-dev ai-context-commit-tools
```

## Quick Start

1. **Initialize in your project:**
   ```bash
   ai-context-commit-tools init
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit  # AI will generate the message automatically
   ```

3. **Or use interactive mode:**
   ```bash
   npm run commit:ai
   ```

## Commands

### `ai-context-commit-tools init`

Initialize AI development tools in your project.

**Options:**
- `-t, --type <type>` - Project type (nestjs, react, express, nodejs). Default: auto-detect
- `-f, --force` - Force overwrite existing files
- `--no-hooks` - Skip git hooks installation
- `--no-workflow` - Skip GitHub Actions workflow

**Example:**
```bash
ai-context-commit-tools init --type react --force
```

### `ai-context-commit-tools commit`

Generate AI-powered commit messages.

**Options:**
- `-i, --interactive` - Interactive mode with preview
- `-m, --message <message>` - Additional context for AI
- `-d, --debug` - Enable debug output

**Examples:**
```bash
ai-context-commit-tools commit --interactive
ai-context-commit-tools commit --message "Fixed authentication bug"
```

### `ai-context-commit-tools changelog`

Generate or preview changelog.

**Options:**
- `-p, --preview` - Preview changes without writing to file
- `-f, --from <commit>` - Generate from specific commit
- `-d, --debug` - Enable debug output

**Examples:**
```bash
ai-context-commit-tools changelog --preview
ai-context-commit-tools changelog --from HEAD~5
```

### `ai-context-commit-tools config`

Configure AI development tools.

**Options:**
- `-s, --show` - Show current configuration
- `-r, --reset` - Reset to default configuration

### `ai-context-commit-tools status`

Check AI development tools status and configuration.

### `ai-context-commit-tools update`

Update AI development tools to the latest version.

## Configuration

### Project Context

After initialization, customize `.cursor/context.md` to provide project-specific context to the AI. This helps generate more accurate commit messages.

Example context file:
```markdown
# Project Context

## Overview
This is a React e-commerce application built with TypeScript and Next.js.

## Key Components
- User authentication system
- Product catalog with search
- Shopping cart and checkout
- Admin dashboard

## Coding Standards
- Use functional components with hooks
- Follow TypeScript strict mode
- Implement comprehensive error handling
- Write unit tests for all utilities
```

### NPM Scripts

The init command automatically adds these scripts to your `package.json`:

```json
{
  "scripts": {
    "commit:ai": "ai-commit --interactive",
    "changelog:ci": "ai-changelog",
    "changelog:preview": "ai-changelog --preview"
  }
}
```

### Git Hooks

When hooks are enabled, the tool installs a `prepare-commit-msg` hook that automatically generates commit messages when you run `git commit`.

## GitHub Actions Integration

The tool includes a GitHub Actions workflow that automatically updates your changelog when:
- Pull requests are merged to main/master
- New releases are created
- Manual workflow dispatch is triggered

The workflow file is located at `.github/workflows/changelog.yml`.

## Project Types

The tool supports different project types with tailored configurations:

### Node.js
- Generic Node.js projects
- Express.js applications
- CLI tools and utilities

### React
- Create React App projects
- Next.js applications
- React component libraries

### NestJS
- NestJS applications
- Microservices
- API backends

### Express
- Express.js applications
- REST APIs
- Web servers

## Best Practices

### Commit Messages

1. **Stage meaningful changes**: The AI works best with focused, logical changes
2. **Review generated messages**: Always review and edit AI-generated commit messages
3. **Add context when needed**: Use the `-m` flag to provide additional context
4. **Use conventional commits**: The AI follows conventional commit format

### Changelog Management

1. **Regular updates**: Run changelog generation regularly, especially before releases
2. **Manual curation**: Review and edit changelog entries for clarity
3. **Version tagging**: Use semantic versioning for proper changelog organization

### Configuration

1. **Update project context**: Keep `.cursor/context.md` current with project changes
2. **Customize templates**: Modify templates in the `templates/` directory if needed
3. **Review configuration**: Use `ai-context-commit-tools config --show` to verify settings

## Troubleshooting

### Common Issues

**1. AI not generating messages**
- Ensure Cursor CLI is installed and configured
- Check that `.cursor/context.md` exists and has relevant content
- Verify git repository is properly initialized

**2. Hooks not working**
- Ensure Husky is properly installed: `npm run prepare`
- Check that `.husky/prepare-commit-msg` exists and is executable
- Verify git hooks are enabled in your repository

**3. Changelog generation fails**
- Check that you have commits in your repository
- Ensure proper git history exists
- Verify GitHub Actions has necessary permissions

**4. Permission errors**
- Ensure you have write permissions to the project directory
- Check that git repository is not in a detached HEAD state
- Verify npm has permission to install packages

### Debug Mode

Enable debug mode for detailed logging:

```bash
ai-context-commit-tools commit --debug
ai-context-commit-tools changelog --debug
```

### Getting Help

- Check status: `ai-context-commit-tools status`
- View configuration: `ai-context-commit-tools config --show`
- Review logs in debug mode
- Check GitHub repository for issues and updates

## Advanced Usage

### Custom Templates

You can customize the AI behavior by modifying template files:

- `templates/ai-commit-generator.js` - Commit message generation logic
- `templates/changelog-generator.js` - Changelog generation logic
- `templates/context-*.md` - Project-specific context templates

### Integration with Other Tools

The tool integrates well with:

- **Husky**: Git hooks management
- **Conventional Commits**: Standardized commit format
- **Semantic Release**: Automated versioning
- **GitHub Actions**: CI/CD workflows
- **Cursor IDE**: AI-powered development

### API Usage

For programmatic usage, you can import and use the tool's modules:

```javascript
const { CommitGenerator } = require('ai-context-commit-tools');

const generator = new CommitGenerator();
const message = await generator.generateMessage(changes);
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:

- GitHub Issues: Report bugs and request features
- Documentation: Check this guide and inline help
- Community: Join discussions in the repository

---

**Note**: This tool requires Cursor CLI for AI functionality. Ensure it's properly installed and configured in your development environment.
