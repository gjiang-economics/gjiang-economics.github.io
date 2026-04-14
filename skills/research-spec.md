---
name: research-spec
description: |
  Create or update a research design specification for an empirical economics project. Use this skill whenever the user wants to document their research design, create a research spec, update the research specification, interview me about the research design, or start a fresh session with a clean spec. Trigger on phrases like "research spec", "research specification", "create spec", "update spec", "what are we estimating", "document the research design", or "interview me about the research". Also trigger when the user says "update:variables", "update:regression", or similar section-specific update commands.
argument-hint: "[update:question|variables|data|regression|sample|assumptions]"
---

# Research Specification Skill

You help the researcher create and maintain a **research design specification** — an authoritative document that captures the current, correct understanding of the empirical research design. This specification lives at `Plan/research_spec.md` and serves as the single source of truth for all future Claude Code sessions.

This skill complements the `research-project` skill. research-project defines *how* to execute (folder structure, progress tracking, replication docs). This skill defines *what* we are estimating (identification strategy, variables, regression specification).

## Canonical Section Names

These six sections define the spec structure. They are used in both the output template and the partial-update argument mapping. Sections use `##` headers; any sub-sections within a section must use `###` or lower.

| Argument keyword | Section header |
|-----------------|----------------|
| `question` | `## Research Question & Identification` |
| `variables` | `## Variable Definitions` |
| `data` | `## Data Sources & Linkage` |
| `regression` | `## Regression Specification(s)` |
| `sample` | `## Sample Restrictions` |
| `assumptions` | `## Key Assumptions & Decisions` |

## Abstraction Guardrails

The spec must be written at the **conceptual + data mapping** level. Before writing any section, self-check against these rules:

**BANNED — remove if present:**
- Code file paths (e.g., `codes/build/01_clean.do`)
- Line numbers
- References to specific `.do`, `.R`, or `.py` scripts
- Session history references (e.g., "as built in session 5", "we changed this in round 3")

**ALLOWED:**
- Dataset variable names (e.g., `hhincome`, `educ`, `age`) — these are part of the research design
- Data mapping in the format: `concept -> dataset.variable` (e.g., `household income -> SOEP.hhincome`)
- Regression specifications in **equation notation** (e.g., `y_it = alpha + beta * X_it + gamma * Z_i + delta_t + epsilon_it`), NOT in Stata/R syntax
- Dataset names and descriptions
- Plain-language definitions of variables and sample restrictions

The goal: the spec should read like a **methods section draft**, not like a code changelog.

## Precedence Rule

`Plan/research_spec.md` is authoritative for "what we are estimating now." `progress.md` is the historical record of iterations. When they conflict on the current specification, `research_spec.md` wins.

---

## Step 1: Determine Entry Mode

Check if the user passed an argument when invoking the skill.

| Argument | Mode | Action |
|----------|------|--------|
| *(none)* or `fresh` | Fresh interview | Go to Step 2 |
| `update:<section>` | Partial update | Go to Step 7 |

If the argument is `update:<keyword>` but the keyword does not match any entry in the Canonical Section Names table, show an error message listing the six valid keywords and stop.

## Step 2: Setup

1. Check if `Plan/` directory exists. If not, create it.
2. Check if `Plan/research_spec.md` already exists.
   - If it exists, ask the researcher: "A research spec already exists. Would you like to (a) start fresh and overwrite it, or (b) update specific sections? If you want to update specific sections, you can re-invoke with `update:<section>` (e.g., `update:variables`)."
   - If the researcher chooses to overwrite, continue to Step 3.
   - If the researcher chooses to update, ask which section and proceed to Step 7.

## Step 3: Interview

Conduct a structured interview in **3 rounds**, batched by topic area. The researcher is the authority — never summarize past sessions or guess from code.

### Interview guidelines

- Batch related questions together in each round. Aim for 3 rounds, not 10+ separate questions.
- If the researcher's answers are very brief or vague, tell them openly that more detail will produce a better spec and ask follow-up questions. It is fine to ask extra follow-ups if the information is thin.
- Use structured prompts for bounded choices (e.g., identification strategy type: DiD, IV, RDD, selection on observables) and open-ended conversation for richer topics (e.g., describing the economic mechanism).
- Don't ask about things that can be inferred from arguments or existing project context.
- If the researcher says "skip" for a topic area, write a `[Not yet specified]` placeholder for that section.
- Ask the researcher to provide regression specifications in **equation notation** rather than Stata/R syntax. You can offer to help convert, but the researcher confirms the final equation.

### Round 1 — Research Design

Ask about:
- **Research question:** What is the main question this project answers?
- **Identification strategy:** How do you identify the causal effect? (DiD, IV, RDD, selection on observables, event study, other)
- **Key mechanism:** What is the economic mechanism or channel? Why would X affect Y?

Do NOT ask about contribution, novelty, or comparison to existing literature — that is the researcher's domain, not this skill's concern.

### Round 2 — Variables and Data

Ask about:
- **Dependent variable:** What is the outcome variable? How is it defined? Which dataset and variable name? (use the `concept -> dataset.variable` mapping format)
- **Main independent variable:** What is the treatment/exposure/instrument? Definition and data mapping.
- **Key controls:** What control variables are included and why?
- **Data sources:** What datasets are used? How are they linked (merge keys, time periods)?
- **Sample definition:** What is the unit of observation? What time period? What geographic scope?
- **Sample restrictions:** What observations are excluded and why? (e.g., dropping outliers, age restrictions, balanced panel requirements)

### Round 3 — Specification and Assumptions

Ask about:
- **Regression equation:** Write out the main specification in equation notation. What are the subscripts? (Ask the researcher to provide this in equation form, not Stata syntax.)
- **Fixed effects:** What fixed effects are absorbed? Why?
- **Standard errors:** How are standard errors clustered? Why that level?
- **Identifying assumptions:** What assumptions must hold for the causal interpretation? (e.g., parallel trends, exclusion restriction, conditional independence)
- **Robustness checks:** What alternative specifications or tests are planned?
- **Key decisions:** Any other important methodological choices (e.g., winsorization, log transformation, treatment of missing values)?

### Handling interruptions

If the interview is interrupted at any point (the researcher stops responding, says "that's enough for now", or the session ends), immediately write a partial spec using whatever answers have been collected. Use `[Not yet specified]` placeholders for sections that were not covered. The partial spec can be completed later using `update:<section>`.

## Step 4: Generate the Spec

After the interview, assemble the answers into `Plan/research_spec.md` using the template below.

### Before writing, self-check the abstraction guardrails:

1. Scan the draft for any code file paths, line numbers, or script references — **remove them**.
2. Verify all data mappings use the `concept -> dataset.variable` format.
3. Verify regression specifications are in equation notation, not Stata/R/Python syntax.
4. Verify no session history references appear (e.g., "in our last session", "as we discussed").

### Spec template

```markdown
# Research Design Specification

*Last updated: [today's date]*

## Research Question & Identification

**Research question:** [One-sentence statement of the main question]

**Identification strategy:** [DiD / IV / RDD / selection on observables / event study / other]

**Key mechanism:** [Brief description of the economic channel]

## Variable Definitions

**Dependent variable:**
- [concept] -> [dataset.variable]
- Definition: [plain-language definition]

**Main independent variable (treatment/exposure/instrument):**
- [concept] -> [dataset.variable]
- Definition: [plain-language definition]

**Key controls:**
- [concept] -> [dataset.variable] — [why included]
- [concept] -> [dataset.variable] — [why included]

## Data Sources & Linkage

**Datasets used:**
- [Dataset name]: [brief description, time coverage, geographic scope]
- [Dataset name]: [brief description, time coverage, geographic scope]

**Linkage:** [How datasets are merged — merge keys, time alignment, unit matching]

## Regression Specification(s)

**Main specification:**

```
y_it = alpha + beta * X_it + gamma * Z_it + delta_i + theta_t + epsilon_it
```

where:
- y_it = [dependent variable description]
- X_it = [main independent variable description]
- Z_it = [controls description]
- delta_i = [fixed effect description]
- theta_t = [fixed effect description]

**Standard errors:** Clustered at [level] because [reason].

**Alternative specifications:**
- [Description of robustness check 1]
- [Description of robustness check 2]

## Sample Restrictions

**Unit of observation:** [e.g., individual-year, firm-quarter]

**Time period:** [start year] to [end year]

**Geographic scope:** [e.g., Germany, EU-15, global]

**Exclusions:**
- [Restriction 1]: [reason]
- [Restriction 2]: [reason]

## Key Assumptions & Decisions

**Identifying assumptions:**
- [Assumption 1, e.g., parallel trends hold conditional on X]
- [Assumption 2, e.g., exclusion restriction: Z affects Y only through X]

**Methodological decisions:**
- [Decision 1, e.g., winsorize at 1st/99th percentile]
- [Decision 2, e.g., use log(income + 1) to handle zeros]
```

### Present for review

After assembling the spec, present it to the researcher for review before writing to disk. Ask: "Here is the research spec I assembled from your answers. Would you like to change anything before I save it?"

- If the researcher requests small changes, apply inline edits and re-present.
- If the researcher requests larger changes to a specific section, use the partial-update flow (Step 6) for that section.
- Once approved, write to `Plan/research_spec.md`.

## Step 5: Reconcile CLAUDE.md with the Spec

The research spec is designed to be the **clean, authoritative reset point** for a project. After writing or updating the spec, reconcile the project's CLAUDE.md so that future sessions are not polluted by stale or incorrect information from past sessions.

This is NOT just "add a pointer to the spec." It is an active audit.

### 5a. Locate and read CLAUDE.md

1. **Locate project root:** The project root is the parent directory of `Plan/`.
2. **Check for CLAUDE.md:** If none exists, create a minimal one with `# [Project Name]` and proceed to 5c.
3. **Read the full CLAUDE.md.**

### 5b. Audit CLAUDE.md against the spec

Compare every claim in CLAUDE.md against the spec you just wrote. Look for:

- **Contradictions:** CLAUDE.md says variable X is defined one way, but the spec says another. CLAUDE.md says the sample is restricted to age 25-65, but the spec says 18-65. Fix these.
- **Stale session artifacts:** References to "we changed this in round 3", "the old approach was...", "after debugging we found..." — these are session history leaking into instructions. Remove them.
- **Outdated methodology notes:** CLAUDE.md describes a regression specification or identification strategy that no longer matches the spec. Replace with the current spec version or remove and let the spec be the authority.
- **Code-path instructions that encode wrong design decisions:** e.g., CLAUDE.md says "always use log(income)" but the spec says levels. Remove the stale instruction.

**Do NOT remove:**
- General project conventions (folder structure, coding standards, commit practices)
- Tool/software configuration notes
- Anything that does not conflict with the research spec

### 5c. Ensure the spec reference section exists

If CLAUDE.md does not already reference `research_spec.md`, add this section:

```
## Research Specification

This project has a research design specification at `Plan/research_spec.md`.
Read it before writing analysis code — it defines the current research design
(variables, data sources, regression specifications, sample restrictions).
When the spec and CLAUDE.md describe different specifications, the spec
reflects the current intent.
```

### 5d. Present changes for approval

Show the researcher a diff-style summary of what you propose to change in CLAUDE.md. Explain each removal or edit with a one-line reason (e.g., "Removed: 'use log(income)' — contradicts spec which says levels"). Ask: "I'd like to update CLAUDE.md to be consistent with the spec. Here are the proposed changes. Approve?"

- If approved, apply changes.
- If declined, skip without modifying CLAUDE.md.

## Step 6: Review the Spec for Logical Consistency

After the spec is written to disk (whether fresh or partial update), run a consistency review.

1. **Invoke `/ce:review`** (or the `compound-engineering:ce-review` skill) on the `Plan/research_spec.md` file. The review should focus on:
   - **Internal consistency:** Do the variable definitions match what appears in the regression equation? Do the sample restrictions align with the data sources described? Do the fixed effects match the unit of observation?
   - **Completeness:** Are there placeholder sections (`[Not yet specified]`) that create logical gaps? (e.g., regression equation references variables not defined in the variable section)
   - **Abstraction guardrail compliance:** Any code paths, script names, or session history references that slipped through?

2. **Report findings** to the researcher. If issues are found, offer to fix them inline.

3. This step is mandatory — do not skip it even if the spec looks clean.

## Step 7: Partial Update Mode

This mode is triggered by `update:<section>` (e.g., `update:variables`, `update:regression`).

1. **Read existing spec:** Read `Plan/research_spec.md`. If it does not exist, inform the researcher and redirect to a fresh interview (Step 2).
2. **Find target section:** Parse the file for `##` headers that match entries in the Canonical Section Names table. Match only known section headers — ignore any other `##` headers.
3. **Show current content:** Display the current content of the target section to the researcher. Say: "Here is the current content of [section name]. I'll re-interview you on this topic. Your new answers will replace this section."
4. **Re-interview:** Ask the questions from the relevant round in Step 3 that correspond to this section only. This is a single-section interview, not the full 3-round protocol.
5. **Replace section:** Replace the content from the target `##` header to the next known `##` header (from the Canonical Section Names table) or EOF. Preserve all other sections unchanged.
6. **If the section is a placeholder** (`[Not yet specified]`), replace the placeholder with the new content from the interview.
7. **Present the updated spec** for confirmation, then write to disk.
8. **Run Step 5** (reconcile CLAUDE.md) — check if the partial update creates any new contradictions with CLAUDE.md.
9. **Run Step 6** (review for logical consistency) — the review is mandatory even for partial updates.

## Checklist Before Finishing

Before ending the session, verify:

- [ ] `Plan/research_spec.md` exists and is populated (or partially populated with placeholders)
- [ ] The spec contains no code file paths, line numbers, or script references
- [ ] All data mappings use the `concept -> dataset.variable` format
- [ ] Regression specifications are in equation notation
- [ ] The document reads like a methods section draft
- [ ] CLAUDE.md has been audited against the spec for contradictions (Step 5)
- [ ] Consistency review has been run on the spec (Step 6)
