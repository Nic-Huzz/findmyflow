# Claude Code Development Guide

This document contains best practices and guidelines for working with Claude Code on this project.

## Git Worktree Workflow (Recommended)

### What are Git Worktrees?

Git worktrees allow you to have multiple working directories for the same repository, each checked out to a different branch. This is perfect for running multiple Claude Code sessions in parallel without them interfering with each other.

**Benefits:**
- Run multiple Claude sessions simultaneously
- Each session has its own isolated file state
- No need to switch branches or stash changes
- Maintain context for long-running AI conversations
- Avoid branch conflicts and divergence

### Setting Up Worktrees

#### 1. Directory Structure

Organize your worktrees in a clean structure:

```
findmyflow-workspace/
├── main/                    # Your main worktree (current directory)
├── feature-profile/         # Worktree for profile feature
├── bugfix-swipe/           # Worktree for swipe bug
└── experiment-ui/          # Worktree for UI experiments
```

#### 2. Creating Worktrees

**From your main directory** (`/home/user/findmyflow`):

```bash
# Create a new worktree with a new branch
git worktree add ../findmyflow-feature-profile -b feature/profile-redesign

# Create a worktree from an existing branch
git worktree add ../findmyflow-bugfix bugfix/swipe-animation

# Create a worktree from an existing remote branch
git worktree add ../findmyflow-challenge claude/build-7day-challenge
```

#### 3. Using Worktrees with Claude Code

**Workflow:**

1. **Create a worktree** for each major task/feature
2. **Open Claude Code** in that worktree directory
3. **Work on the task** - Claude has full isolated context
4. **Commit and push** when done
5. **Merge** the branch into `dev` or `main`
6. **Remove the worktree** when complete

**Example:**

```bash
# Create worktree for new feature
cd /home/user/findmyflow
git worktree add ../findmyflow-leaderboard -b feature/leaderboard

# Open Claude Code in that worktree
cd ../findmyflow-leaderboard
# Start Claude Code here

# When done, merge the work
cd /home/user/findmyflow
git checkout dev
git merge feature/leaderboard
git push

# Remove the worktree
git worktree remove ../findmyflow-leaderboard
```

#### 4. Managing Worktrees

```bash
# List all worktrees
git worktree list

# Remove a worktree (must be clean - no uncommitted changes)
git worktree remove <path>

# Force remove (if worktree has uncommitted changes)
git worktree remove <path> --force

# Prune stale worktree references
git worktree prune
```

### Example Multi-Session Workflow

**Scenario:** You want Claude to work on 3 things simultaneously

```bash
# Session 1: Profile redesign
git worktree add ../findmyflow-profile -b feature/profile-redesign
# Open Claude Code session 1 in ../findmyflow-profile

# Session 2: Bug fixes
git worktree add ../findmyflow-bugfix -b bugfix/image-paths
# Open Claude Code session 2 in ../findmyflow-bugfix

# Session 3: New feature
git worktree add ../findmyflow-challenge -b feature/daily-challenges
# Open Claude Code session 3 in ../findmyflow-challenge

# Each Claude session works independently!
# No conflicts, no branch switching, full context preservation
```

---

## Branch Management

### Branch Naming Conventions

- **Features:** `feature/description` (e.g., `feature/7day-challenge`)
- **Bug fixes:** `bugfix/description` (e.g., `bugfix/swipe-animation`)
- **Experiments:** `experiment/description` (e.g., `experiment/new-ui`)
- **Claude branches:** `claude/task-description-sessionID` (auto-generated)

### Main Branches

- **`main`** - Production-ready code (currently at v1 baseline)
- **`dev`** - Active development branch (merge Claude work here)

### Merge Strategy

**Preferred:** Merge commits (not rebase) to preserve history

```bash
git checkout dev
git merge feature/your-feature --no-ff
```

**For Claude branches:**
- Merge into `dev` when work is complete and tested
- Delete Claude branches after merging
- Use descriptive merge commit messages

---

## Claude Code Best Practices

### 1. One Task = One Branch/Worktree

Keep Claude sessions focused on specific tasks:
- ✅ "Add 7-day challenge feature"
- ✅ "Fix swipe animation bugs"
- ❌ "Fix everything" (too broad)

### 2. Regular Commits

Ask Claude to commit work regularly with clear messages:
- After completing a feature
- Before major refactoring
- When switching tasks

### 3. Testing Before Merging

Always test Claude's changes before merging:
```bash
npm run dev          # Test locally
npm run build        # Ensure no build errors
npm run lint         # Check code quality
```

### 4. Cleanup After Merging

Delete branches and worktrees after merging to keep things organized.

---

## Project-Specific Guidelines

### Technology Stack

- **Framework:** React + Vite
- **Styling:** CSS (vanilla)
- **Backend:** Supabase
- **Database:** PostgreSQL (via Supabase)

### Code Quality

- **ESLint:** Enabled (see `.eslintrc.cjs`)
- **Formatting:** Follow existing code style
- **No console logs:** Remove debug logs before committing

### File Organization

```
src/
├── components/       # Reusable components (future)
├── archive/         # Old/deprecated code
├── lib/             # Utilities and configs
├── *.jsx            # Page components
└── *.css            # Component styles

public/
├── images/          # Static images
└── *.json          # Configuration files
```

### Supabase Conventions

- **Migrations:** Add SQL files to root with descriptive names
- **Env vars:** Use `.env.local` (never commit secrets!)
- **RLS:** Enable Row Level Security on all tables

### Common Tasks

**Run development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Run linting:**
```bash
npm run lint
```

**Fix lint errors:**
```bash
npm run lint -- --fix
```

---

## Current Branch Deletion Commands

When ready to clean up merged Claude branches:

```bash
# Delete local branches
git branch -d claude/build-7day-challenge-011CUmEpHUPSFgF1GHJdCuni
git branch -d claude/review-github-project-011CUmDsgM2X47N14fvArYeP
git branch -d claude/me-page-design-mockup-011CUmy7J6TM4Ke3WhwDk7F8
git branch -d claude/review-lead-magnet-swipe-011CUmxSds1gUXANhR3myVzB

# Delete remote branches
git push origin --delete claude/build-7day-challenge-011CUmEpHUPSFgF1GHJdCuni
git push origin --delete claude/review-github-project-011CUmDsgM2X47N14fvArYeP
git push origin --delete claude/me-page-design-mockup-011CUmy7J6TM4Ke3WhwDk7F8
git push origin --delete claude/review-lead-magnet-swipe-011CUmxSds1gUXANhR3myVzB
git push origin --delete claude/debug-archetype-profile-images-011CUmHZdkin6YYoHPDEk5MU
```

---

## Quick Reference

**Create worktree:**
```bash
git worktree add ../findmyflow-<name> -b <branch-name>
```

**List worktrees:**
```bash
git worktree list
```

**Remove worktree:**
```bash
git worktree remove ../findmyflow-<name>
```

**Merge branch into dev:**
```bash
git checkout dev
git merge <branch-name> --no-ff
git push
```

**Delete merged branch:**
```bash
git branch -d <branch-name>
git push origin --delete <branch-name>
```

---

## Resources

- [Git Worktree Documentation](https://git-scm.com/docs/git-worktree)
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Project README](./README.md)

---

*Last updated: 2025-11-04*
*This file is version-controlled - update it as the project evolves!*
