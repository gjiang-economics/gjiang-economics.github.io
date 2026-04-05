---
name: validate-execution
description: Dispatch an independent subagent to validate completed research work against the original plan. Use after finishing execution of a multi-step data analysis, pipeline construction, or empirical research session. Checks that outputs exist and are correct, code logic is sound, nothing was skipped, and replication documentation is complete. Triggers after executing research project plans involving Stata, R, or Python.
---

# Validate Execution — Post-Execution Research Work Review

*v2.0 — Independent subagent validation of completed research work*

> **Philosophy:** For LLM-generated code, output-based testing is more efficient than input-based code review. The subagent should prioritize checking what the code *produced* over reading how it works. Write a massive battery of sanity tests on outputs — if it looks like a duck and quacks like a duck for a large enough set of tests, it's a legit duck.

Dispatch a fresh-context subagent to validate that the executed work is correct, complete, and properly documented. The reviewer compares what was planned against what was actually done.

## When This Skill Triggers

This skill is invoked automatically (via CLAUDE.md instructions) after completing execution of a multi-step research plan. It can also be invoked manually via `/validate-execution`.

## Instructions

### Step 0: Scope Gate

Check whether the completed work warrants formal validation. The work qualifies if **any** of these are true:

1. A multi-step plan (3+ steps) was executed involving data/analysis files
2. Multiple code files (.do, .R, .py) were created or modified
3. Data files were generated or transformed
4. The session involved statistical analysis or empirical research work

**If the work does not qualify**, print:
> "Session is below the complexity threshold for formal execution validation."

Then stop.

**If `$ARGUMENTS` contains `skip`**, print:
> "Execution validation skipped at user request."

Then stop.

### Step 1: Gather Evidence

Collect all of the following before dispatching the subagent:

1. **The original plan** — locate via:
   - Explicit file argument (`file:path`)
   - Plan files in the project's `Plan/` folder (most recent)
   - Plan-mode file in `~/.claude/plans/`
   - Conversation history
   - If no plan exists, note this — the review shifts to diff-based mode

2. **Git diff** — run `git diff` from the session's starting point to HEAD to see all changes made. If no git history is available, list modified files by timestamp.

3. **Output file inventory** — list all files created or modified during the session, especially:
   - Data files in `data/generate/`
   - Figures/tables in `writeup/figures_tables/`
   - Scripts in `codes/build/` and `codes/analysis/`

4. **progress.md state** — check if `progress.md` exists and whether it was updated this session

5. **Replication documentation** — check if a replication file was created/updated in `writeup/replication/`

### Step 2: Dispatch Subagent

Use the **Agent tool** to launch a fresh-context subagent with all evidence from Step 1.

**Subagent prompt template:**

```
You are a meticulous research replication auditor. Your job is to verify that
the executed work is correct, complete, and reproducible. You are checking
someone else's work — be thorough and skeptical.

ORIGINAL PLAN:
[full plan text, or "NO FORMAL PLAN — review based on git diff and file changes"]

GIT DIFF (changes made this session):
[git diff output]

OUTPUT FILES CREATED/MODIFIED:
[file list with paths]

PROGRESS.MD STATUS:
[updated / not updated / does not exist]

REPLICATION DOCUMENTATION STATUS:
[created / updated / missing]

PROJECT STANDARDS:
- Raw data lives in data/raw/<source>/ and must NEVER be modified
- Generated data goes in data/generate/
- Build scripts in codes/build/, analysis scripts in codes/analysis/
- Scripts numbered sequentially (01_download.py, 02_filter.py, etc.)
- Each script must be independently re-runnable
- progress.md must be updated each session with: date, what, how, findings,
  limitations, human-AI contributions, replication link, output files
- Replication file in writeup/replication/ for each session

Review across these 7 dimensions:

1. PLAN COMPLIANCE
   - For each planned step: was it completed, skipped, or modified?
   - If modified, is the deviation justified or an oversight?
   - Flag any planned steps that were not executed
   - If no plan exists: infer session intent from the diff and check
     whether the work appears internally consistent and complete

2. OUTPUT VERIFICATION
   - Do the claimed output files actually exist?
   - For data files: are row counts, column counts, and key statistics plausible?
     (Check by reading the code that generates them — do the filters and
     transformations look correct?)
   - For figures/tables: do they match what the plan intended to produce?
   - Are there outputs that should exist but are missing?

3. CODE LOGIC REVIEW
   - Read the code that was written or modified
   - Check for: correct merge keys, proper handling of missing values,
     correct variable construction, appropriate use of statistical commands
   - Verify file paths are correct and use forward slashes
   - Check that code preambles exist (date, author, goal, key steps,
     inputs, outputs)
   - Look for hardcoded values that should be parameters

4. REPLICATION CHECK
   - Was replication documentation created or updated?
   - Does the progress.md entry exist and include all required fields?
   - Could someone reproduce this session's work from the documentation?
   - Are environment requirements documented?

5. DATA INTEGRITY AUDIT
   - Was data/raw/ left untouched? (Check git diff for any changes to raw/)
   - Are generated datasets in data/generate/?
   - Were any files overwritten that should not have been?
   - Are intermediate files properly stored?

6. COMPLETENESS AND LOOSE ENDS
   - Are there TODO comments left in the code?
   - Are there scripts that were started but not finished?
   - Are there error messages in logs that were not addressed?
   - Did the session produce what it set out to produce?
   - Are there any temporary or debug files that should be cleaned up?

7. OUTPUT SANITY TESTS (CRITICAL — prioritize this dimension)
   Design and RUN black-box sanity tests on every major output produced.
   Do not just review the code — actually load/inspect the outputs and test them.

   For datasets (.dta, .csv, .parquet, .rds):
   - Check row count, column count, no all-missing columns
   - Verify value ranges for key variables (e.g., year in [1800, 2025], age > 0)
   - Check for unexpected duplicates on ID variables
   - Verify panel structure (unique ID-time combinations if applicable)
   - Compare N against what the plan or progress report expected

   For regression/estimation outputs:
   - Check coefficient signs match economic intuition or prior literature
   - Verify standard errors are reasonable (not 0, not astronomically large)
   - Check N matches the expected sample size
   - Verify R-squared or fit statistics are plausible

   For figures/tables:
   - Verify the underlying data file exists and has expected structure
   - Check that labels and categories match the data

   For any output:
   - Compare against benchmarks mentioned in the plan or progress.md
   - Run at least 5 sanity tests per major output file
   - Flag any output that cannot be tested as a concern

FORMAT YOUR OUTPUT EXACTLY AS:

EXECUTION VALIDATION — [Session/Plan Name]

PLAN COMPLIANCE
- Plan found: [Yes — source / No — using diff-based review]
- Completed: [N] of [M] planned steps
- Skipped: [list with reasons, or "None"]
- Modified: [list with deviations noted, or "None"]

ISSUES FOUND
[CRITICAL] (must fix before ending session)
[number]. [Issue description] → Fix: [What to do]

[IMPORTANT] (should fix soon)
[number]. [Issue description] → Fix: [What to do]

[MINOR] (note for future)
[number]. [Issue description] → Fix: [What to do]

OUTPUT INVENTORY
| Expected output | Status | Notes |
|-----------------|--------|-------|
| [file/result]   | [exists/missing/different] | [details] |

SANITY TEST BATTERY
| # | Output file | Test description | Expected | Actual | Result |
|---|-------------|------------------|----------|--------|--------|
| 1 | [file]      | [what was tested] | [value]  | [value]| PASS/FAIL |
| 2 | ...         | ...               | ...      | ...    | ...    |

Tests run: [N] | Passed: [N] | Failed: [N]
CRITICAL failures: [list any tests where failure indicates fundamentally wrong output]

REPLICATION STATUS
- progress.md updated: [Yes/No]
- Replication file created: [Yes/No/N/A]
- Missing documentation: [list, or "None"]

VERDICT: COMPLETE / INCOMPLETE — NEEDS FIXES / INCOMPLETE — NEEDS DISCUSSION
[1-2 sentence summary]

Verdict override rules:
- If ANY sanity test flagged as CRITICAL fails → verdict MUST be INCOMPLETE — NEEDS FIXES
- If >50% of all sanity tests fail → verdict MUST be INCOMPLETE — NEEDS FIXES
  regardless of how other dimensions look

RECOMMENDED ACTIONS (if not COMPLETE)
[Numbered list of specific things to do before ending the session]

If everything checks out, say so clearly. Do not invent issues — only flag genuine concerns.
```

### Step 3: Present Results

Display the subagent's output verbatim.

**If verdict is COMPLETE:** Announce that validation passed. The session can end.

**If verdict is INCOMPLETE — NEEDS FIXES:** Present the recommended actions and ask:
> "The reviewer found issues that should be fixed this session. Address these now?"

**If verdict is INCOMPLETE — NEEDS DISCUSSION:** Flag this prominently and wait for user input.

### Step 4: Inline Fallback

If the Agent tool fails or is unavailable, perform the review inline using this stance:

> **AUDITOR STANCE:** You are now the replication auditor, not the implementer. Do not rationalize. Your job is to verify that the work is correct, complete, and reproducible.

Review against the same 7 dimensions and produce the same output format.

## Examples

```
/validate-execution
/validate-execution file:Plan/session05_plan.md
/validate-execution skip
```
