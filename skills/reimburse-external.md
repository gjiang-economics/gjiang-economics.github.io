---
name: reimburse-external
description: |
  Prepare reimbursement documents for an external organization (conference host, funding body, etc.) beyond Guohui's home university. Use this skill whenever Guohui needs to submit receipts and forms to get reimbursed by a conference organizer, workshop host, or external funder. Trigger on phrases like "prepare reimbursement", "submit for reimbursement", "get reimbursed by the host", "reimburse-external", "reimbursement from the organizer", "send receipts to the host", or when the user has a folder of travel documents and receipts to process for an external organization. Also trigger when the user mentions a reimbursement deadline from a conference or workshop host.
---

# External Reimbursement Preparation

You help Guohui prepare everything needed to get reimbursed by an external organization (conference host, workshop organizer, funding body) for travel expenses.

## Expected Folder Structure

The working directory should contain:

```
.
├── proofs/                    # Receipts and payment evidence, numbered by item
│   ├── 01 flight receipt.pdf
│   ├── 01 boarding pass.pdf
│   ├── 03 hotel invoice.pdf
│   ├── 06 taxi receipt.pdf
│   ├── 11 city tax photo.JPG  # Images are also valid — will be converted to PDF
│   └── ...
├── [host instructions].pdf    # Email, form, or letter from the host explaining reimbursement rules
├── [summary template].xlsx    # Excel template provided by the host (if any)
├── [other host docs].pdf      # Self-declaration forms, information forms, etc.
└── ...
```

Files in `proofs/` follow the convention from the `reimbursement-summary` skill: the leading digits before the first space form the item number. Files sharing the same prefix belong to the same expense item. Files may be PDFs, JPGs, PNGs, or other image formats.

## Bank Account to receive the reimbursed money, if you need it.

Read  `targobank.pdf' in `references/` subfolder

## Workflow

### Phase 1 — Understand the host's requirements

Read ALL non-receipt files in the working directory (everything outside `proofs/`). These are documents from the host. Extract:

1. **What they reimburse**: flights, hotel, taxis, meals, conference fee, etc.
2. **Limits**: maximum total amount, number of hotel nights covered, economy-only flights, etc.
3. **Required receipt types**: what specific documents they accept for each expense category. Pay close attention to distinctions like:
   - Flights: do they need e-ticket + boarding pass, or just a receipt?
   - Hotel: do they need the hotel's own tax receipt/invoice (fattura), or is a booking platform confirmation enough?
   - Taxis: do receipts need to show name, date, amount, pickup/dropoff route?
   - General: do they reject "simple booking confirmations" or "credit card receipts"?
4. **Submission format**: do they want one merged PDF, separate attachments, or something else? Look for wording like "a pdf version" (singular = one merged PDF) vs "the receipts" (could be separate).
5. **Submission method**: email address, physical mail, portal upload?
6. **Deadline**: when must the submission arrive?
7. **Template**: is there an Excel or other summary template to fill in?
8. **Previously submitted documents**: has Guohui already sent forms (e.g., self-declaration, bank details) that do NOT need to be re-sent?

### Phase 2 — Read and catalog all receipts

Read every file in `proofs/` (PDFs and images), grouping by item number. For each item, extract:

- Description (what it is)
- Date of service
- Date of payment
- Amount and currency
- Key details: route (for flights/taxis), hotel name and dates, etc.
- **What the document actually is**: a receipt from the service provider, a payment confirmation, a bank statement, an invoice, a booking confirmation, etc. This distinction matters for Phase 3.

**CRITICAL: Read each document carefully and identify its true nature.** File names can be misleading. A file named "city taxes for my hotel" might actually be a bank statement showing the charge, not the hotel's receipt. Always verify by reading the content.

### Phase 3 — Verify receipts against requirements

This is the critical step. For each expense item, check whether the available receipt meets the host's specific requirements.

**Verification checklist for each item:**
1. Does the receipt come from the service provider (not a payment intermediary)?
2. Does it contain all required fields (name, date, amount, etc.)?
3. Is it in the format the host requires?
4. Is the receipt the actual document, or is it a bank/payment statement about that transaction?

Flag issues in three categories:

**OK** — Receipt meets all requirements.

**WARNING** — Receipt is imperfect but may be accepted. Examples:
- A taxi receipt that shows amount and date but not the passenger's name
- A hotel invoice from a booking intermediary rather than the hotel directly
- An Uber receipt (digital) when the host asks for "receipts from the taxi driver"

**MISSING/BLOCKED** — Receipt clearly does not meet requirements and will likely be rejected. Examples:
- Host requires hotel tax receipt from the hotel, but only a Booking.com payment confirmation exists
- Host requires boarding passes but none are available
- No receipt at all for a claimed expense

Present the verification as a table:

| # | Item | Amount | Status | Issue (if any) |
|---|------|--------|--------|----------------|

For any MISSING/BLOCKED items, tell Guohui exactly what to do to fix it (e.g., "Email the hotel at X to request an invoice").

**Stop here if there are BLOCKED items.** Tell Guohui what needs to be fixed and that you'll continue when it's resolved. Do not proceed to Phase 4 with known blockers unless Guohui explicitly says to proceed anyway.

### Phase 4 — Calculate the claim

Determine what to claim:

1. List all eligible expenses with amounts
2. If the host covers only partial expenses (e.g., 1 night of a 2-night hotel stay), calculate the claimable portion
3. Sum the total claim
4. Compare against the host's cap — note if the total exceeds the maximum
5. If expenses are in a non-EUR currency, handle conversion (see `reimbursement-summary` skill for the approach)

### Phase 5 — Fill the summary template

If the host provided an Excel template:

1. Read the template structure with openpyxl to understand column layout
2. Fill in the header fields (event name, date, name, currency)
3. Fill in each expense line item
4. Fill in the total
5. Save as a new file: `[original name] - FILLED.xlsx`

Do NOT overwrite the original template.

### Phase 6 — Select documents for the merged PDF

Before merging, present the proposed document list to Guohui and ask for confirmation. Show:

| # | Item | Document to include | Why this one |
|---|------|---------------------|--------------|

**Document selection principles:**

1. **When unsure, include more rather than less.** It is better to submit an extra document than to miss one. The host can ignore extras, but missing documents cause rejection.
2. **Ask Guohui when the choice is ambiguous.** Don't silently exclude documents.
3. **For each expense item, include the primary receipt.** If there are multiple documents for one item and you're unsure which is the "real" receipt, include all of them.
4. **Image files (JPG, PNG) are valid receipts** — especially photos of paper receipts (e.g., taxi receipts, hotel city tax receipts). These must be converted to PDF before merging using Pillow.

**What to always include:**
- Flights: e-ticket/receipt + boarding pass
- Hotel: the hotel's own tax receipt/invoice + booking confirmation if it shows a different useful detail (e.g., EUR amount vs USD on the invoice)
- Taxis: the receipt that shows name, date, amount, and route
- Any paper receipt photos (JPG/PNG) — these are often the ONLY receipt from the service provider

**What to exclude (unless Guohui says otherwise):**
- PayPal payment confirmations (payment evidence, not service receipts)
- Bank/Wise statements for items that already have a direct receipt

### Phase 7 — Merge into one PDF

After Guohui confirms the document list:

1. **Convert image files** (JPG, PNG) to PDF using Pillow (`PIL.Image`). Fit to A4 page, maintain aspect ratio.
2. **Merge all PDFs** in order using `pypdf.PdfWriter`.
3. Save as `Receipts_Guohui_Jiang.pdf`.

### Phase 8 — Verify the merged PDF

**This step is mandatory.** After merging:

1. Open the merged PDF with `pypdf.PdfReader` and count total pages.
2. Print a page-by-page manifest:

```
Merged PDF verification:
  Page 1: [source file] — [what it contains]
  Page 2: [source file] — [what it contains]
  ...
  Total: N pages
```

3. Cross-check: does every expense item in the Excel summary have at least one corresponding receipt in the merged PDF?
4. Flag any expense item that has NO receipt in the merged PDF.

### Phase 9 — Draft the email

Write a concise email draft and save it as `EMAIL_DRAFT.txt`. Include:

- TO/CC addresses
- Subject line
- Brief body listing what's attached
- Total amount claimed and the host's cap
- Note about any previously submitted forms
- Sign-off with name + affiliation + email

### Phase 10 — Final summary

Print a clear summary for Guohui:

1. **Files created**: list the Excel, merged PDF, and email draft
2. **What to send**: the specific attachments
3. **Where to send**: email address
4. **Deadline**: the submission deadline
5. **Warnings**: any receipt issues that may cause problems
6. **Action items**: anything Guohui needs to do manually

### Phase 11: Verify

Verify if each financial number is correct: make sure that Guohui claims every money he deserves to receive.


## Important Notes

- All amounts should use 2 decimal places.
- When claiming partial expenses (e.g., 1 of 2 hotel nights), explain clearly in the expense description which portion is being claimed.
- Do not include expenses the host explicitly does not cover (e.g., meals if the host says meals are not reimbursed).
- If the host's requirements are ambiguous, note the ambiguity and proceed with the safer interpretation.
- The skill `reimbursement-summary` handles reading/summarizing receipts. This skill goes further: it cross-checks against host requirements, fills templates, merges PDFs, and drafts the email.
- **Never trust file names alone.** Always read the document to verify its content matches the filename. This is the single most important rule in this skill. In practice, Guohui's `proofs/` folders follow a pattern where:
  - Files with **descriptive names** (e.g., "taxi from my hotel to Rome airport.pdf", "city taxes for my hotel in Rome.pdf") are often **Wise bank statements** or payment confirmations — NOT the actual receipt.
  - Files with **UUID/hash names** (e.g., "receipt_de87a76a-ffc1-47fb-b58d-274cfa85d3a4.pdf") are often the **actual Uber/service receipts** with route maps and trip details.
  - **Image files** (JPG/PNG) are often photos of **paper receipts** — these are frequently the most important documents (the actual receipt from the service provider).

  Always read every file and classify it as: (a) actual receipt from the service provider, (b) payment confirmation/bank statement, or (c) invoice. Then select accordingly.
