---
name: validate-plan
description: Dispatch an independent subagent to critically review a research project plan before execution. Use after creating or receiving a multi-step plan for data analysis, pipeline construction, or empirical research work involving Stata, R, or Python. Catches methodology errors, data handling risks, missing replication steps, and logical gaps. Triggers on research project plans with 3+ data/analysis steps.
---

# Validate Plan — Pre-Execution Research Plan Review

*v1.0 — Independent subagent review of research plans before execution begins*

Dispatch a fresh-context subagent to critically evaluate a research project plan. The reviewer has no planner bias — it sees the plan cold, like a referee or replication auditor would.

## When This Skill Triggers

This skill is invoked automatically (via CLAUDE.md instructions) after creating a multi-step plan for research project work. It can also be invoked manually via `/validate-plan`.

## Instructions

### Step 0: Scope Gate

Check whether the plan warrants formal validation. The plan qualifies if **all** of these are true:

1. The plan has **3 or more steps** that involve data manipulation, analysis, or multi-file code changes
2. The plan touches **data files** (.dta, .csv, .parquet, .rds, .jsonl) or **analysis scripts** (.do, .R, .py doing data/statistical work)
3. The work is **research-related** (not slides, reimbursement, calendar, or LaTeX formatting)

**If the plan does not qualify**, print:
> "Plan is below the complexity threshold for formal validation. Proceeding to execution."

Then stop — do not dispatch a subagent.

**If `$ARGUMENTS` contains `skip`**, print:
> "Plan validation skipped at user request."

Then stop.

### Step 1: Locate the Plan

Three-tier priority:
1. **Explicit file** — if `$ARGUMENTS` contains `file:path/to/plan.md`, read that file
2. **Plan-mode file** — read the most recent file in `~/.claude/plans/`
3. **Conversation history** — use the plan from the current session

If no plan is found:
> "No plan found. Create a plan first, or specify a file: `/validate-plan file:path/to/plan.md`"

### Step 2: Identify Project Context

Before dispatching the subagent, gather context:
- Read the project's `research-project` skill standards (folder structure, pipeline conventions, documentation requirements)
- Check if `progress.md` exists at the project root — if so, read the last entry for context on prior work
- Note which languages/tools the plan uses (Stata, R, Python)

### Step 3: Dispatch Subagent

Use the **Agent tool** to launch a fresh-context subagent. The subagent must receive:
- The full plan text
- The 7 review dimensions below
- Project context from Step 2

**Subagent prompt template:**

```
You are a meticulous research methodology reviewer — not a software code reviewer.
Your job is to find what's missing, what will break, and what's wishful thinking
in this research plan. You have no loyalty to this plan. Review it cold.

PLAN:
[full plan text]

PROJECT CONTEXT:
[folder structure, prior progress.md entry if any, languages used]

PROJECT STANDARDS:
- Raw data lives in data/raw/<source>/ and must NEVER be modified
- Generated data goes in data/generate/
- Build scripts in codes/build/, analysis scripts in codes/analysis/
- Scripts numbered sequentially (01_download.py, 02_filter.py, etc.)
- Each script must be independently re-runnable
- Long-running scripts must support restart/resume
- Use Parquet for datasets; JSONL for intermediate API results
- Every session must produce replication documentation
- progress.md must be updated with date, what, how, findings, limitations

Review across these 7 dimensions:

1. DATA INTEGRITY
   - Does the plan preserve raw data immutability?
   - Are there steps that could corrupt or overwrite data/raw/?
   - Is there clear separation between raw input and generated output?
   - Are data transformations reversible or documented?

2. STATISTICAL/ANALYTICAL LOGIC
   - Are the planned analyses appropriate for the research question?
   - Are there obvious methodology errors (wrong estimator, incorrect clustering,
     missing controls, ignoring panel structure)?
   - Does the sequence of analyses make logical sense?
   - Are variable constructions well-defined?

3. PIPELINE COMPLETENESS
   - Is every step from raw data to final output accounted for?
   - Are there missing intermediate steps (e.g., "merge datasets" without
     specifying merge keys or handling of non-matches)?
   - Does the plan follow modular pipeline convention (numbered scripts, one per stage)?
   - Are input/output files specified for each step?

4. REPLICATION FEASIBILITY
   - Could someone reproduce this work from the plan alone?
   - Are file paths explicit?
   - Are parameters and thresholds documented?
   - Does the plan account for generating replication documentation?

5. SCOPE AND FEASIBILITY
   - Is the plan attempting too much for one session?
   - Are there dependencies on unavailable data, tools, or API access?
   - Are runtime estimates realistic (especially for API calls or large datasets)?
   - Should an iterative pilot approach be used instead of jumping to full data?

6. ERROR HANDLING AND EDGE CASES
   - Does the plan account for missing data, API failures, or encoding issues?
   - For Stata: string truncation, value label conflicts, merge mismatches?
   - For R/Python: memory limits, type coercion, NA handling?
   - Are there fallback strategies for likely failure points?

7. SEQUENCING AND DEPENDENCIES
   - Are steps in the right order?
   - Could reordering reduce risk (e.g., small pilot before full dataset)?
   - Are there hidden dependencies between steps?
   - Can steps be parallelized?

FORMAT YOUR OUTPUT EXACTLY AS:

PLAN VALIDATION — [Plan Title or Summary]

SCOPE: [Research project / Data pipeline / Analysis session]

RED FLAGS (must address before execution)
[number]. [Dimension] — [Issue] → Fix: [Recommendation]

YELLOW FLAGS (address during or after execution)
[number]. [Dimension] — [Issue] → Fix: [Recommendation]

GREEN (strengths worth noting)
[number]. [What the plan does well]

VERDICT: PROCEED / REVISE FIRST / STOP AND DISCUSS
[1-2 sentence justification]

SUGGESTED PLAN AMENDMENTS (if REVISE)
[Numbered list of specific additions or changes]

If there are no red flags, say so explicitly. Do not invent issues — only flag genuine concerns.
```

### Step 4: Present Results

Display the subagent's output verbatim.

**If verdict is PROCEED:** Announce that validation passed and execution can begin.

**If verdict is REVISE FIRST:** Present the suggested amendments and ask:
> "The reviewer suggests revisions. Apply these amendments to the plan before executing? Or proceed as-is?"

**If verdict is STOP AND DISCUSS:** Flag this prominently and wait for user input before proceeding.

### Step 5: Inline Fallback

If the Agent tool fails or is unavailable, perform the review inline using this stance:

> **CRITIC STANCE:** You are now the critic, not the planner. Do not rationalize. Your job is to find what's missing, what will break, and what's wishful thinking.

Review against the same 7 dimensions and produce the same output format.

## Examples

```
/validate-plan
/validate-plan file:Plan/session05_plan.md
/validate-plan skip
```
