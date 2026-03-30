---
name: reflection
description: End-of-session reflection for Claude Code. Use this skill whenever the user says "reflect", "reflection", "session review", "session recap", "what should we improve", "end of session", "review this session", "reflect and push", "push reflection", or any request to review what happened in a Claude Code session and identify improvements. Also trigger when the user asks what went well or poorly, what to change in CLAUDE.md, whether skills need updating, or how to make future sessions smoother. Even if the user just says "we're done, let's wrap up" or "let's close out", consider triggering this skill. This skill analyzes the full session history, identifies skills to create, memories to save, and CLAUDE.md updates to make, then pushes changes to GitHub.
---

# Session Reflection

Analyze the entire session history and produce a reflection. Do not ask questions during the analysis. Print findings directly in the terminal, propose concrete changes, ask for permission once, then execute everything and push to GitHub.

## How It Works

1. **Analyze** the full session silently.
2. **Print** findings and proposed actions to the terminal (see categories below).
3. **Ask once**: "Can I go ahead and apply these changes and push?"
4. **On confirmation**: apply all changes, commit, and push.

Do not save the reflection as a file. Do not create a reflections folder. The terminal output is the reflection.

---

## Reflection Categories

Work through all 5 categories. For each, print:
- What you found (reference actual session events — commands, files, errors).
- What you propose to do about it.

Skip any category with nothing to report. Don't pad.

### 1. Skill Creation

- Did this session reveal a repeated workflow or pain point that could become a new skill?
- Did an existing skill underperform, fail to trigger, or need updated triggers/instructions?
- Were there manual multi-step sequences that should be automated into a skill?
- For each: name the skill, describe what it would do, and explain why it's worth creating. If updating an existing skill, show what to change.

### 2. Memories

- Did the session surface information that future sessions should know?
- Walk through the 4 memory types (user, feedback, project, reference) and check if anything qualifies.
- For each memory: state the type, a proposed filename, and the content (including frontmatter).
- Actually save the memories during the apply step — don't just suggest them.

### 3. CLAUDE.md Updates

- Anything missing from user-level (`~/.claude/CLAUDE.md`) or project-level CLAUDE.md based on what happened?
- Any existing entries that are unnecessary, outdated, or too specific? Suggest removing them.
- Show the exact lines to add, remove, or modify. Always specify which file (project vs user level).

### 4. Hooks Evaluation

- Did this session reveal repetitive actions triggered by specific events (e.g., always running a linter after edits, always adding preambles to new files) that could be automated with a hook?
- For each candidate: describe the trigger event, the command, and **critically evaluate whether a hook is the right mechanism**. Hooks run automatically on every matching event — they add friction and complexity. Consider alternatives:
  - Could a skill handle this on-demand instead?
  - Could a CLAUDE.md instruction achieve the same result without automation?
  - Is the pattern frequent and mechanical enough to justify automatic execution?
- Only propose a hook if: (a) the action is purely mechanical, (b) forgetting it causes real problems, and (c) it should happen every single time without exception.
- If the session involved existing hooks that caused friction (slow, noisy, blocking), flag those for removal or adjustment.

### 5. Permission Friction

- Note: for detailed permission auditing, use the `reflect-permissions` skill instead.
- Only flag here if a permission issue was a major session blocker and the user should run `reflect-permissions` next.

---

## After Printing

Print a short summary list of everything you propose to change:

```
Proposed changes:
  1. [skill: new] create "xyz" skill for ...
  2. [memory: feedback] save feedback about ...
  3. [user CLAUDE.md] add preference: ...
  4. [project CLAUDE.md] remove outdated entry: ...
  ...
```

Then ask: **"Can I apply these changes and push?"**

On confirmation:
1. Apply all proposed edits (CLAUDE.md, skills, memories, etc.).
2. Commit with message: `chore: session reflection updates`
3. Push to the current branch.
4. If anything requires manual follow-up (running `reflect-permissions`, installing a tool, etc.), print those items last under "Manual follow-up needed."

---

## Constraints

- Every finding must reference something that actually happened this session. No generic advice.
- Do not save the reflection as a file. Print to terminal only.
- Do not ask clarifying questions during analysis. Analyze, print, propose, then ask once to proceed.
- Always specify project-level vs user-level for any CLAUDE.md change.
