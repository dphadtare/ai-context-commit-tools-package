# ai-context-commit-tools

🤖 **AI context builder with automated commit message generation and changelog maintenance for enhanced AI-assisted development**

A comprehensive toolkit that leverages Cursor AI to build rich project context through intelligent commit messages and automated changelogs, enhancing AI-assisted development workflows for any Node.js/TypeScript project.

## ✨ Features

- **🧠 AI Context Building**: Builds rich project context through intelligent analysis of code changes
- **📝 Smart Commit Messages**: AI generates conventional commit messages that enhance project understanding
- **📋 Automated Changelog**: Incremental changelog generation that maintains project evolution context
- **🔧 Universal Compatibility**: Works with NestJS, React, Express, and any Node.js project
- **⚡ Easy Installation**: One-command setup with automatic project detection
- **🎯 Context-Aware**: Understands your project structure and technology stack for better AI assistance
- **🔄 CI/CD Integration**: GitHub Actions workflow for automated changelog updates
- **🪝 Git Hooks**: Automatic commit message generation that builds context on every commit

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g ai-context-commit-tools

# Or install as dev dependency
npm install --save-dev ai-context-commit-tools
```

### Initialize in Your Project

```bash
# Auto-detect project type and initialize
npx ai-dev-tools init

# Or specify project type
npx ai-dev-tools init --type nestjs
```

### Prerequisites

1. **Cursor CLI**: Install [Cursor](https://cursor.sh) and ensure CLI is available
2. **Git Repository**: Your project must be a git repository
3. **Node.js 16+**: Required for the package to run

## 📖 Usage

### AI Commit Message Generation

```bash
# Stage your changes
git add .

# Commit with AI-generated message (automatic via git hooks)
git commit

# Or use interactive mode
npx ai-dev-tools commit --interactive

# Add context for better AI generation
git commit -m "add user authentication feature"
```

### Changelog Generation

```bash
# Preview changelog changes
npx ai-dev-tools changelog --preview

# Generate changelog (CI mode)
npx ai-dev-tools changelog

# Check status
npx ai-dev-tools status
```

## 🎯 Supported Project Types

### NestJS Backend
- Understands controllers, services, modules, guards
- Recognizes Prisma/TypeORM database changes
- Categories: auth, api, db, health, shared modules

### React Frontend
- Detects components, hooks, pages, utilities
- Understands styling and state management changes
- Categories: ui, components, hooks, styles, utils

### Express.js Backend
- Recognizes routes, controllers, middleware
- Database models and authentication patterns
- Categories: api, auth, middleware, models, config

### Generic Node.js
- Works with any Node.js/TypeScript project
- Adapts to project structure and dependencies
- Flexible categorization based on file patterns

## 📝 Generated Commit Examples

### NestJS Backend
```bash
feat(auth): add Okta SSO integration with JWT validation
fix(api): resolve timeout issues in rewards service endpoint
perf(db): optimize Prisma queries with connection pooling
docs(api): add Swagger documentation for user endpoints
```

### React Frontend
```bash
feat(ui): add responsive navigation component
fix(hooks): resolve state synchronization in useAuth
style(components): update button variants with Tailwind
test(utils): add comprehensive validation test suite
```

## 🔧 Configuration

### Project Context

The AI understands your project through:

- **package.json**: Technology stack detection
- **Architecture files**: ARCHITECTURE.md, docs/architecture.md
- **Cursor context**: .cursor/context.md (auto-generated)

### Customization

```bash
# Show current configuration
npx ai-dev-tools config --show

# Reset to defaults
npx ai-dev-tools config --reset
```

## 🤖 AI Integration

### Cursor CLI Setup

1. Install [Cursor](https://cursor.sh)
2. Ensure CLI is accessible:
   ```bash
   cursor --help
   ```
3. Login to Cursor:
   ```bash
   cursor login
   ```

### AI Models

- **Default**: Claude Sonnet 4
- **Fallback**: Automatic fallback when AI unavailable
- **Timeout**: 30 seconds with graceful degradation

## 📋 Changelog Format

Generated changelogs follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [Unreleased]

### Added
- **auth**: OAuth integration with JWT tokens
- **ui**: responsive dashboard component

### Fixed
- **api**: timeout handling in service calls
- **db**: connection pool configuration

### Performance
- **queries**: optimize database indexing
- **bundle**: reduce JavaScript bundle size

### Security
- **auth**: enhance token validation
- **api**: add rate limiting protection
```

## 🔄 CI/CD Integration

### GitHub Actions

Automatic daily changelog updates:

```yaml
# .github/workflows/changelog.yml
name: Changelog Update
on:
  schedule:
    - cron: '30 17 * * *' # 11:00 PM IST daily
  workflow_dispatch:

jobs:
  changelog:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate changelog
        run: npx ai-dev-tools changelog
```

### Git Hooks

Automatic commit message generation via Husky:

```bash
# .husky/prepare-commit-msg
npx ai-dev-tools commit
```

## 📦 NPM Scripts

After initialization, these scripts are available:

```json
{
  "scripts": {
    "commit:ai": "ai-dev-tools commit --interactive",
    "changelog:ci": "ai-dev-tools changelog",
    "changelog:preview": "ai-dev-tools changelog --preview"
  }
}
```

## 🛠️ CLI Commands

### Main Commands

```bash
ai-dev-tools init [options]          # Initialize in project
ai-dev-tools commit [options]        # Generate commit message
ai-dev-tools changelog [options]     # Generate changelog
ai-dev-tools status                  # Check status
ai-dev-tools config [options]        # Manage configuration
```

### Options

```bash
# Init command
--type <type>     # Project type: nestjs, react, express, nodejs
--force           # Force overwrite existing files
--no-hooks        # Skip git hooks installation
--no-workflow     # Skip GitHub Actions workflow

# Commit command
--interactive     # Interactive mode with preview
--message <msg>   # Additional context for AI
--debug           # Enable debug output

# Changelog command
--preview         # Preview without writing file
--debug           # Enable debug output
```

## 🏗️ Project Structure

```
your-project/
├── .cursor/
│   └── context.md              # AI project context
├── .github/workflows/
│   └── changelog.yml           # Automated changelog workflow
├── .husky/
│   └── prepare-commit-msg      # Git hook for AI commits
├── docs/
│   └── ai-development-tools.md # Documentation
├── scripts/
│   ├── ai-commit-generator.js  # Local AI commit script
│   └── changelog-generator.js  # Local changelog script
└── CHANGELOG.md                # Project changelog
```

## 🔒 Security & Privacy

### What Data is Processed

This tool processes the following data to build AI context:

- **Git commits and diffs**: Analyzed locally to understand code changes
- **Project files**: Package.json, file structure for project type detection
- **Code changes**: Staged git changes sent to Cursor AI for commit message generation
- **Generated content**: Commit messages and changelog entries

### Security Considerations

✅ **Local Processing**: Most operations happen locally on your machine  
✅ **Cursor AI Integration**: Uses your existing Cursor CLI (same as your IDE)  
✅ **No Data Storage**: Tool doesn't store or transmit data to third parties  
✅ **Open Source**: All code is publicly available for security review  
✅ **Minimal Permissions**: Only accesses git repository and project files  

### Privacy Controls

```bash
# Disable AI features if needed
ai-context-commit-tools init --no-ai

# Debug mode to see what data is being processed
ai-context-commit-tools commit --debug

# Local-only mode (no AI calls)
git commit -m "manual message"
```

### Data Flow

1. **Local Analysis**: Tool reads your staged git changes
2. **AI Request**: Sends code diff to Cursor AI (same as your IDE)
3. **Response**: Receives generated commit message
4. **Local Storage**: Saves commit and updates local changelog

**Note**: This tool uses the same AI integration as Cursor IDE - if you trust Cursor with your code, this tool follows the same security model.

## 🔍 Troubleshooting

### Common Issues

#### Cursor CLI Not Found
```bash
# Check installation
cursor --help

# Install Cursor
# Visit https://cursor.sh for installation
```

#### AI Generation Fails
```bash
# Check Cursor login
cursor status

# Enable debug mode
npx ai-dev-tools commit --debug
```

#### Git Hooks Not Working
```bash
# Reinstall hooks
npm run prepare

# Check permissions (Unix)
chmod +x .husky/prepare-commit-msg
```

### Debug Mode

Enable detailed logging:

```bash
DEBUG=1 npx ai-dev-tools commit
DEBUG=1 npx ai-dev-tools changelog --preview
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

### Development

```bash
git clone https://github.com/ai-context-commit-tools/core
cd core
npm install
npm run build
npm link
```

### Testing

```bash
npm test
npm run test:integration
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Cursor](https://cursor.sh) for the amazing AI capabilities
- [Conventional Commits](https://conventionalcommits.org/) for the specification
- [Keep a Changelog](https://keepachangelog.com/) for the format

## 📞 Support

- 🐛 Issues: [GitHub Issues](https://github.com/ai-context-commit-tools/core/issues)
- 📖 Docs: [Documentation](https://github.com/ai-context-commit-tools/core#readme)

---

Made with ❤️ by the AI Development Tools Community
