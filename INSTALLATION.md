# Installation Guide - ai-context-commit-tools

## 🚀 Quick Installation

### Option 1: Global Installation (Recommended)

```bash
npm install -g ai-context-commit-tools
```

Then in any project:

```bash
cd your-project
ai-context-commit-tools init
```

### Option 2: Project-Specific Installation

```bash
cd your-project
npm install --save-dev ai-context-commit-tools
npx ai-context-commit-tools init
```

### Option 3: One-Time Usage

```bash
cd your-project
npx ai-context-commit-tools init
```

## 📋 Usage Examples

### For Different Project Types

#### NestJS Backend Project
```bash
# Auto-detect NestJS and configure
ai-context-commit-tools init

# Or explicitly specify
ai-context-commit-tools init --type nestjs
```

#### React Frontend Project
```bash
ai-context-commit-tools init --type react
```

#### Express.js Backend
```bash
ai-context-commit-tools init --type express
```

#### Generic Node.js Project
```bash
ai-context-commit-tools init --type nodejs
```

## 🔧 Using in Existing Project (homebody-admin)

Since you already have the scripts in place, you can:

### Option 1: Replace Existing Implementation
```bash
# Remove existing scripts
rm -rf scripts/ai-commit-generator.js scripts/changelog-generator.js

# Install package
npm install --save-dev ai-context-commit-tools

# Initialize (will detect existing config)
npx ai-context-commit-tools init --force
```

### Option 2: Use Package Commands Alongside Existing Scripts
```bash
# Install package
npm install --save-dev ai-context-commit-tools

# Use package commands
npx ai-context-commit-tools commit --interactive
npx ai-context-commit-tools changelog --preview
npx ai-context-commit-tools status
```

### Option 3: Update package.json Scripts
```json
{
  "scripts": {
    "commit:ai": "ai-context-commit-tools commit --interactive",
    "changelog:ci": "ai-context-commit-tools changelog",
    "changelog:preview": "ai-context-commit-tools changelog --preview"
  }
}
```

## 🔄 Migration from Existing Setup

If you have the manual scripts already installed:

```bash
# 1. Install the package
npm install --save-dev ai-context-commit-tools

# 2. Backup existing files (optional)
mkdir backup
cp scripts/ai-commit-generator.js backup/
cp scripts/changelog-generator.js backup/
cp .husky/prepare-commit-msg backup/

# 3. Initialize with force to replace files
npx ai-context-commit-tools init --force

# 4. Test the new setup
npx ai-context-commit-tools status
git add . && git commit  # Test AI commit generation
```

## 📦 Package Contents

After installation, your project will have:

```
your-project/
├── node_modules/ai-context-commit-tools/  # Package files
├── .cursor/
│   └── context.md                        # AI project context
├── .github/workflows/
│   └── changelog.yml                     # CI changelog workflow
├── .husky/
│   └── prepare-commit-msg                # Git hook
├── docs/
│   └── ai-development-tools.md           # Documentation
└── package.json                          # Updated scripts
```

## 🎯 Available Commands

```bash
# Initialization
ai-context-commit-tools init [options]          # Setup in project
ai-context-commit-tools init --type nestjs      # NestJS project
ai-context-commit-tools init --force            # Overwrite existing

# Daily Usage
ai-context-commit-tools commit                  # Generate commit message
ai-context-commit-tools commit --interactive    # Interactive mode
ai-context-commit-tools changelog --preview     # Preview changelog
ai-context-commit-tools changelog               # Generate changelog

# Management
ai-context-commit-tools status                  # Check setup status
ai-context-commit-tools config --show           # Show configuration
ai-context-commit-tools update                  # Update package
```

## ✅ Verification

After installation, verify everything works:

```bash
# Check status
ai-context-commit-tools status

# Test commit generation
echo "test" > test.txt
git add test.txt
git commit  # Should trigger AI generation

# Test changelog
ai-context-commit-tools changelog --preview

# Clean up test
git reset HEAD~1 && rm test.txt
```

## 🔧 Troubleshooting

### Common Issues

1. **Command not found**
   ```bash
   # Global installation
   npm install -g ai-context-commit-tools

   # Or use npx
   npx ai-context-commit-tools --help
   ```

2. **Permission errors (macOS/Linux)**
   ```bash
   chmod +x .husky/prepare-commit-msg
   npm run prepare
   ```

3. **Cursor CLI not found**
   ```bash
   # Install Cursor from https://cursor.sh
   cursor --help
   ```

4. **Git hooks not working**
   ```bash
   npm run prepare
   ls -la .husky/
   ```

## 📚 Next Steps

1. **Customize Project Context**
   - Edit `.cursor/context.md` for better AI understanding

2. **Configure Git Workflow**
   - Ensure GitHub Actions has write permissions
   - Test the changelog workflow

3. **Team Onboarding**
   - Share installation instructions with team
   - Document project-specific conventions

4. **Monitor and Improve**
   - Review AI-generated messages
   - Adjust context as needed
   - Provide feedback for improvements
