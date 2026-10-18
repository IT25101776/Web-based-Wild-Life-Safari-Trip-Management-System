# Contributing to Safari Lanka

Thank you for contributing to **Safari Lanka - Web Based Wildlife Safari Trip Management System**. This guide defines a practical team workflow for the SE2030 Group 01 codebase so that changes from the six major modules integrate safely without breaking the cross-role safari workflow.

> Safari Lanka is an academic prototype. Contributions must preserve that scope and must not present the project as an official Department of Wildlife Conservation or Yala National Park system.

---

## 1. Team Ownership

| IT Number | Member | Primary Module |
|---|---|---|
| IT25102346 | Malintha K.K.I | Tourist Booking, Visitor Group & Permit Application Management |
| IT25100233 | Senanayake S.M.K.D | Safari Package, Route, Time Slot & Pricing Management |
| IT25100295 | Somarathne R.N.N | Jeep Driver & Vehicle Maintenance Management |
| IT25101776 | Weerakkody W.W.M.B | Safari Guide Roster & Trip Assignment Management |
| IT25100854 | Thennakoon T.M.A.N | Payment, Invoice, Cancellation & Refund Management |
| IT25104064 | Hettiarachchi H.A.A.S | Park Entry, Digital Permit Validation & Safari Compliance Management |

Module ownership helps organise work, but shared authentication, database, UI, notifications and end-to-end workflow changes should be reviewed with the members whose modules are affected.

## 2. Architecture Boundary

Keep the current separation of responsibilities:

```text
React UI
   ↓
Axios / REST API
   ↓
Spring Controller
   ↓
Service / Business Rules
   ↓
Spring Data JPA / Hibernate
   ↓
MySQL
```

General rules:

- Keep controllers thin.
- Put reusable business rules in the service layer.
- Keep persistence concerns in repositories/entities.
- Enforce permissions and business rules on the backend even when the frontend also hides/disables an action.
- Do not duplicate authoritative records across modules simply to avoid using an existing relationship/API.
- Use transactions for multi-record operations that must succeed or fail together.

## 3. Git Workflow

Create a branch for one focused change at a time.

Suggested naming:

```text
feature/guide-leave-validation
feature/booking-price-update
fix/permit-checkout-status
fix/dark-mode-contrast
refactor/payment-strategy
```

Recommended process:

```bash
git checkout main
git pull
git checkout -b feature/short-description
```

After implementation and testing:

```bash
git status
git add <changed-files>
git commit -m "feat: short description"
git push -u origin feature/short-description
```

Use clear commit prefixes when practical:

- `feat:` new functionality
- `fix:` defect correction
- `refactor:` structural change without intentional behaviour change
- `test:` test-only change
- `docs:` documentation-only change
- `style:` visual/CSS-only change
- `chore:` maintenance/configuration work

Avoid committing unrelated changes in the same branch.

## 4. Local Setup Before Development

Required local tools:

- Java JDK 17+
- Node.js LTS + npm
- MySQL 8+

On Windows, the project provides:

```bat
run.bat
```

Use the full project SQL under `database/` for a clean environment and the appropriate documented upgrade scripts for an existing environment. Back up local data before destructive reset operations.

## 5. Coding Standards

### Frontend

- Keep React components focused and reusable.
- Keep API access in the established API/service layer where applicable.
- Provide loading, empty, success and error states for data-driven interfaces.
- Preserve responsive behaviour across desktop/tablet/mobile layouts used by the project.
- Check both light and dark themes for changes that affect UI.
- Use accessible labels, sensible keyboard behaviour and readable contrast.
- Do not place business-critical authorisation exclusively in React route/component guards.

### Backend

- Validate request data before mutation logic.
- Use typed DTO/request models rather than accepting uncontrolled payloads.
- Enforce role, ownership and workflow-status rules on the server.
- Return safe errors that do not expose SQL, stack traces, secrets or internal credentials.
- Keep cross-module status changes deliberate and test the resulting downstream workflow.
- Use repository/JPA relationships consistently with the existing domain model.

### Database

- Do not casually edit production-like data to make a feature appear to work.
- Preserve historically important financial, permit, assignment and audit records.
- Keep SQL changes/version upgrades reproducible and documented.
- Before changing a column/table used by another module, search usages across both backend and frontend.
- Take a local backup before testing destructive schema/data changes.

## 6. Important Workflow Gates

Changes must preserve the main Safari Lanka lifecycle:

```text
Booking
  -> Operations confirmation
  -> Payment
  -> Resource assignment
  -> Permit issue
  -> Park check-in
  -> Safari execution
  -> Park check-out
  -> Driver completion
  -> Tourist review
```

Key rules to regression-test when relevant:

- Same-day booking is blocked.
- All visitors count towards vehicle capacity.
- Maximum capacity is 6 visitors per vehicle.
- Children below 5 are free from the package per-person charge but still count towards vehicle capacity.
- Payment is locked until Operations confirms the booking.
- Bank transfer is not paid until Finance approval.
- Assignment is blocked until payment is paid/approved.
- Approved guide/driver leave and resource conflicts block invalid assignment.
- Permit processing depends on booking/payment/assignment readiness.
- Driver trip completion remains blocked before Park Officer check-out.
- Post-trip review is linked to successful completion.

## 7. Validation Expectations

For new or modified forms, validate at both appropriate UI and backend boundaries.

Examples include:

- required fields;
- valid email/phone formats;
- valid dates;
- positive pricing/capacity values;
- legitimate controlled status values;
- valid resource IDs;
- ownership and role permissions;
- overlapping resource/leave conflicts;
- visitor/vehicle-capacity rules.

Never trust a client-calculated price or workflow status as authoritative when the backend can derive or validate it.

## 8. Payment Safety

Safari Lanka payments are academic/demo workflows.

- Never test with real card or bank credentials.
- Never commit complete card numbers, CVV/CVC values or real transfer credentials.
- Do not log sensitive payment input.
- Preserve existing Finance approval/rejection gates for bank transfers.
- Keep rejection/cancellation reasons available only where the respective workflows require them.

## 9. Authentication, Secrets and Privacy

Do not commit:

```text
.env
real database passwords
JWT signing secrets
API keys
tokens
real payment credentials
private user data exported from a real system
```

Development/demo credentials must never be reused as production credentials.

For sensitive project records:

- enforce role access on backend endpoints;
- minimise personal information displayed to roles that do not need it;
- avoid placing secrets in browser-visible source or logs;
- keep DB services private when using LAN/ngrok demo access.

## 10. Testing a Change

Each contribution should test the behaviour it changes rather than only proving that the page loads.

### Minimum manual checks

- Main success path works.
- Invalid input is rejected clearly.
- Unauthorised/wrong-role actions remain blocked.
- Relevant status transitions are correct.
- Existing records still load correctly.
- Refresh/re-login does not reveal a state inconsistency.
- Dark and light modes remain readable for UI changes.
- No obvious browser-console/backend errors are introduced.

### Cross-role regression checks

If your change affects the shared workflow, test the impacted sequence using the appropriate roles. A high-value regression path is:

```text
Tourist creates booking
-> Operator confirms
-> Tourist pays
-> Finance approves bank transfer if used
-> Operator assigns resources
-> Park Officer issues permit
-> Park Officer checks in
-> Park Officer checks out
-> Driver completes safari
-> Tourist submits review
```

### Pricing/capacity regression

When pricing or booking logic changes, include cases such as:

- adults only;
- child aged 5-11;
- child below 5;
- group at vehicle capacity;
- group requiring more than one vehicle.

## 11. UI/UX Checklist

Safari Lanka uses a premium, theme-aware interface. Before handing off UI work, check:

- visual consistency with existing cards, forms and dashboards;
- readable dark-mode text and controls;
- responsive layouts;
- no clipped buttons/modals;
- no raw technical status/code shown where user-friendly wording exists;
- action feedback is visible;
- notifications/navigation still reach the correct destination;
- form validation identifies the field/problem clearly.

## 12. Database Change Checklist

Before submitting DB-related work:

- [ ] Existing data is considered.
- [ ] The change has a reproducible SQL upgrade path where required.
- [ ] Reset/full SQL is updated when the project's delivery process requires it.
- [ ] Backend entity/repository mappings match the schema.
- [ ] Any affected queries/views are updated.
- [ ] Cross-module references are checked.
- [ ] Backup/rollback considerations are documented.
- [ ] No real credentials or personal data are contained in SQL files.

## 13. Documentation Changes

Update `README.md` when a contribution changes any of these:

- prerequisites;
- startup/run commands;
- technology stack;
- database setup;
- major role/workflow behaviour;
- important business rule;
- major project limitation.

Add focused documentation under `docs/` when a feature needs a longer technical or viva/evaluation explanation.

## 14. Pull Request / Handoff Checklist

Before requesting review:

- [ ] Change is limited to the intended ticket/feature/fix.
- [ ] Project starts successfully on the contributor's environment.
- [ ] Main success path was tested.
- [ ] Validation/failure path was tested.
- [ ] Role and ownership restrictions were tested where applicable.
- [ ] Relevant end-to-end workflow was regression-tested.
- [ ] Light/dark/responsive UI was checked if applicable.
- [ ] Database changes and upgrade steps are documented.
- [ ] No secret, real credential or generated build output is committed.
- [ ] `README.md`/other docs were updated when behaviour changed.
- [ ] Another team member can understand how to verify the change.

## 15. Definition of Done

A Safari Lanka change is ready to merge when:

1. The requested behaviour is implemented within scope.
2. Existing role permissions and workflow gates remain correct.
3. Input and business rules are validated server-side where required.
4. The affected success and failure paths have been tested.
5. Shared-flow regression testing is complete when the change crosses modules.
6. UI states are usable and consistent where applicable.
7. Database changes are reproducible and documented.
8. Secrets, debug artefacts and unrelated changes are absent.
9. Documentation accurately reflects changed setup or behaviour.
10. The change has been reviewed by another team member before merging to the shared branch.

---

## Need to Understand the Project First?

Read [README.md](README.md) for the project overview, technology stack, roles, workflow, local setup and key Safari Lanka business rules before making cross-module changes.
