#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# AI Commit Message Hook
# Auto-generates intelligent commit messages using ai-context-commit-tools

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2

# Skip hook for merges, amends, and commits that already have messages
if [ -z "$COMMIT_SOURCE" ] || [ "$COMMIT_SOURCE" = "message" ] || [ "$COMMIT_SOURCE" = "template" ]; then

    echo "🤖 Auto-generating AI commit message..."

    # Check if user provided a message to use as context
    USER_MESSAGE=""
    if [ -s "$COMMIT_MSG_FILE" ]; then
        USER_MESSAGE=$(head -n 1 "$COMMIT_MSG_FILE" | grep -v '^#' | head -c 200)
        if [ -n "$USER_MESSAGE" ]; then
            echo "💡 Using user message as context: '$USER_MESSAGE'"
        fi
    fi

    # Generate AI message using the ai-context-commit-tools package
    if [ -n "$USER_MESSAGE" ]; then
        AI_MESSAGE=$(npx ai-commit --silent --message "$USER_MESSAGE" 2>/dev/null)
    else
        AI_MESSAGE=$(npx ai-commit --silent 2>/dev/null)
    fi

    # Check if AI generation was successful
    if [ $? -eq 0 ] && [ -n "$AI_MESSAGE" ]; then
        echo "✨ Generated: $AI_MESSAGE"

        # Write the AI-generated message to the commit file
        echo "$AI_MESSAGE" > "$COMMIT_MSG_FILE"
        echo "" >> "$COMMIT_MSG_FILE"
        echo "##### AI-generated commit message above. Edit if needed, or keep as-is" >> "$COMMIT_MSG_FILE"
        echo "#" >> "$COMMIT_MSG_FILE"
        echo "##### Staged files:" >> "$COMMIT_MSG_FILE"
        git diff --cached --name-status >> "$COMMIT_MSG_FILE"

    else
        echo "⚠️  AI generation failed, using template"

        # Fallback to manual template if AI generation fails
        cat > "$COMMIT_MSG_FILE" << EOF
# Write your commit message here
#
##### Conventional Commit Format: type(scope): description
##### Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, security
##### Example: feat(auth): add OAuth login functionality
#
##### Staged files:
$(git diff --cached --name-status)
EOF
    fi
else
    echo "⏭️ Skipping AI generation (commit source: $COMMIT_SOURCE)"
fi
