---
name: research-reset
description: Archive legacy research project artifacts to a git branch and clean main for a fresh round of spec-driven execution. Use this skill whenever the user wants to reset the project for a new round, archive old code and results, clean up legacy files, start fresh, or says "research reset", "archive rounds", "clean up for next round", "start fresh round". Also use when legacy scripts, old plan files, or past execution artifacts are cluttering the project and wasting agent context tokens.
---

# Research Reset

Archive legacy artifacts from completed research rounds to a git branch, then remove them from main so future Claude Code sessions start clean with only the research spec and operational instructions.

The goal: future sessions see `CLAUDE.md` + `Plan/research_spec.md` + empty code directories — not hundreds of lines of legacy scripts with known bugs. This is a "clarify and restart" operation, not a "delete everything" operation. The data sources are the same, the research question is the same — we're just clearing out buggy code so fresh scripts can be written from the spec.

## Prerequisites

Before running this skill, verify:
1. The project has a `Plan/research_spec.md` (the new source of truth)
2. `CLAUDE.md` has been updated to point to the spec
3. The user has committed all work they want to preserve
4. The working tree is clean (`git status` shows no uncommitted changes)

If any prerequisite is missing, tell the user what needs to happen first and stop.

## Arguments

The skill accepts an optional argument for the archive branch name:
- Default: `archive/legacy` 
- Example: `archive/rounds-1-7`

If no argument is given, ask the user what to name the archive branch.

## Execution Steps

### Step 1: Confirm scope with the user

Before doing anything destructive, scan the project and show the user what will be archived vs kept. Present a summary like:

```
WILL BE ARCHIVED (removed from main, preserved on branch):
- codes/build/: [N] files (list them)
- codes/analysis/: [N] files (list them)
- results/: [N] files
- Plan/: [N] plan/execution files (NOT research_spec.md)
- writeup/progress_report/: old reports [list which]

WILL BE DELETED (gitignored, not in git, stale outputs from legacy scripts):
- data/processed/: [N] files
- data/temp/: [N] files

WILL STAY ON MAIN:
- CLAUDE.md
- Plan/research_spec.md
- research_log.md (with agent guard — kept as human journal)
- data/raw/ (untouched — source data)
- writeup/progress_report/[most recent report]
- literature/
- .gitignore
```

Ask the user to confirm before proceeding. If they want to adjust (e.g., keep a specific script or processed dataset), accommodate that.

### Step 2: Create the archive branch

```bash
git branch <archive-branch-name>
```

This creates the branch at the current HEAD without switching to it. All current files are preserved on that branch. Verify with `git branch -v`.

Do NOT use `git checkout` — stay on main throughout.

### Step 3: Remove legacy artifacts on main

Remove files in this order, using `git rm` (not plain `rm`) so git tracks the deletion:

1. **Legacy code files:**
   ```bash
   git rm codes/build/*
   git rm codes/analysis/*
   ```

2. **Legacy results:**
   ```bash
   git rm -r results/
   ```

3. **Old plan files** (keep only `research_spec.md` and any file the user explicitly asked to keep):
   ```bash
   git rm Plan/*_plan.md Plan/*_execution.md Plan/*_requirements.md
   ```

4. **Old progress reports** (keep the most recent one — ask the user which):
   ```bash
   git rm writeup/progress_report/progress_report_0[1-6]*
   git rm writeup/progress_report/*_clean.tex
   ```

If any `git rm` fails because a file doesn't exist, that's fine — continue.

### Step 3b: Clear stale processed data

The legacy scripts produced intermediate and analysis-ready datasets in `data/processed/` and `data/temp/`. These are gitignored but still on disk. If left in place, a future agent might find them, skip the build step, and use stale data built by buggy code — silently producing wrong results. This is the most dangerous failure mode of a partial reset.

```bash
rm -rf data/processed/*
rm -rf data/temp/*
```

This is safe because:
- These directories are gitignored (nothing to `git rm`)
- The new build scripts (written from the spec) will regenerate them from `data/raw/`
- Stale data from buggy legacy scripts is worse than no data

Tell the user: "Cleared N files from data/processed/ and data/temp/. Fresh build scripts will regenerate these from raw data."

### Step 3c: Move gitignored personal files outside the project

Some user files (e.g., annotated PDFs like `*_jiang.pdf`) are gitignored and therefore cannot be preserved on a git branch. Anything left inside the project directory — even gitignored — can still be found by agents via `ls` or glob, wasting tokens.

The solution: move them to a **sibling archive directory** outside the project tree. Derive the archive path from the project directory name:

```bash
# If project is at /path/to/AI-research, archive goes to /path/to/AI-research-archive
PROJECT_DIR=$(basename $(pwd))
ARCHIVE_DIR="../${PROJECT_DIR}-archive"
```

Then find and move gitignored personal files, preserving directory structure:

```bash
for f in $(find writeup/ results/ codes/ -name "*_jiang*" -o -name "*_annotated*" -o -name "*.local.*" 2>/dev/null); do
  mkdir -p "$ARCHIVE_DIR/$(dirname $f)"
  mv "$f" "$ARCHIVE_DIR/$f"
done
```

This is the right approach because:
- Files outside the project tree are completely invisible to future Claude Code sessions
- The sibling directory stays in the same parent (e.g., Dropbox), so it syncs across machines
- The naming convention (`<project>-archive`) makes the files easy to find manually

Tell the user: "Moved N personal files to `$ARCHIVE_DIR/`. They are outside the project directory and invisible to future agents. To find them: `ls $ARCHIVE_DIR/`"

### Step 4: Add .gitkeep to empty directories

Git doesn't track empty directories. Add placeholder files so the directory structure survives:

```bash
touch codes/build/.gitkeep
touch codes/analysis/.gitkeep
touch results/.gitkeep
```

Then `git add` them.

### Step 5: Update CLAUDE.md

Make three changes to CLAUDE.md:

#### 5a: Add agent guard for research_log.md

Check if CLAUDE.md already has a guard for `research_log.md`. If not, add this to the existing Research Log section or create a new Agent Context Rules section:

```markdown
## Agent Context Rules

- **`research_log.md`** is a human-facing research journal. Do NOT read it unless the user explicitly asks for historical context. It documents the iterative journey (rounds 1-7) but contains outdated decisions that have been superseded by `Plan/research_spec.md`. Reading it will waste tokens and may introduce confusion. When writing code, use only `Plan/research_spec.md`.
```

The guard needs to be explicit about WHY not to read it (outdated decisions, token waste), not just that it shouldn't be read — this helps agents make the right judgment call in ambiguous situations.

#### 5b: Remove references to deleted files

Scan CLAUDE.md for any references to specific legacy script paths (e.g., `codes/build/08c_process_ipums_endogenous.py`, `codes/analysis/05_annual_iv_regressions.do`) and remove them, since those files no longer exist on main.

#### 5c: Verify the Legacy Code Warning still makes sense

After the reset, the Legacy Code Warning section in CLAUDE.md (if present) should be updated. The scripts are now gone from main, so the warning changes from "don't extend legacy scripts" to noting that `codes/build/` and `codes/analysis/` are empty and should be populated fresh from the research spec:

```markdown
## Build Pipeline Status

`codes/build/` and `codes/analysis/` are empty. All scripts must be written fresh from `Plan/research_spec.md`. Previous scripts from rounds 1-7 are archived on the `<archive-branch>` branch but should NOT be copied back — they contained known bugs.
```

### Step 6: Commit

Stage everything and commit with a descriptive message:

```bash
git add -A
git commit -m "Archive rounds N-M and reset main for spec-driven execution

Legacy code, results, and plan files archived to <branch-name>.
Stale processed data cleared from disk (gitignored, not in git).
Main now contains only research_spec.md, CLAUDE.md, and empty
code directories ready for fresh implementation from the spec.

Co-Authored-By: Claude <model> <noreply@anthropic.com>"
```

### Step 7: Verify

Run these checks and report results:

1. `git status` — should be clean
2. `git branch -v` — should show the archive branch
3. `ls codes/build/` — should show only `.gitkeep`
4. `ls codes/analysis/` — should show only `.gitkeep`
5. `ls Plan/` — should show only `research_spec.md`
6. Confirm `research_log.md` still exists on main
7. `ls data/processed/` — should be empty (or only contain the directory)
8. `git log <archive-branch> --oneline -1` — confirm archive branch points to the pre-reset commit
9. Verify CLAUDE.md has no references to deleted script paths

Report: "Reset complete. Archive branch `<name>` preserves all legacy files. Main is clean for the next round. To recover any archived file: `git show <archive-branch>:path/to/file`"

## What NOT to do

- Do NOT delete `research_log.md` — it's the user's journey record
- Do NOT delete `data/raw/` — raw data is precious and read-only
- Do NOT modify `Plan/research_spec.md` — it's the source of truth
- Do NOT push to remote without asking — this is a local operation
- Do NOT switch branches — stay on main the entire time
- Do NOT use `git rm -r` on the entire project — be surgical about what gets removed
- Do NOT copy scripts back from the archive branch — they had bugs, write fresh ones from the spec
