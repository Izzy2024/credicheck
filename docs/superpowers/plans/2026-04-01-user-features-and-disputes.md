# User Features and Disputes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the business features to normal authenticated users, keep search public, promote `irios@gmail.com` to admin, and add a user dispute flow with attachments and admin resolution.

**Architecture:** Add a feature-center entry point for authenticated users and expose feature-specific pages from the main navigation. Reuse existing backend controllers where possible, adding only the missing attachment and dispute endpoints needed to support text plus JPG/PDF evidence, ownership checks, and admin resolution. Keep `/admin` intact for internal management while user-facing features live in the main app shell.

**Tech Stack:** Next.js 15, React, TypeScript, Express, Prisma, Zod, React Hook Form, Tailwind CSS

---

### Task 0: Frontend test harness

**Files:**

- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `app/__tests__/frontend-harness.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByText("CrediCheck")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:frontend -- app/__tests__/frontend-harness.test.tsx`
Expected: FAIL because the frontend test harness does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add Vitest, React Testing Library, jsdom, and a setup file so frontend component tests can run.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:frontend -- app/__tests__/frontend-harness.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.ts vitest.setup.ts app/__tests__/frontend-harness.test.tsx
git commit -m "feat: add frontend test harness"
```

### Task 1: Main navigation and feature center

**Files:**

- Modify: `app/dashboard/page.tsx`
- Modify: `app/page.tsx`
- Create: `app/feature-center/page.tsx`
- Modify: `app/history/page.tsx`
- Modify: `app/admin/page.tsx`
- Test: `app/__tests__/feature-center.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByText("Centro de Funciones")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:frontend -- app/__tests__/feature-center.test.tsx`
Expected: FAIL because the page and nav entries do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a feature center page plus links from the main dashboard and homepage, including a visible dispute entry point for authenticated users.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:frontend -- app/__tests__/feature-center.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx app/page.tsx app/feature-center/page.tsx app/history/page.tsx app/admin/page.tsx app/__tests__/feature-center.test.tsx
git commit -m "feat: add user feature center"
```

### Task 2: Notifications UI and unread badge

**Files:**

- Create: `app/notifications/page.tsx`
- Create: `app/__tests__/notifications.test.tsx`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/admin/page.tsx`
- Modify: `backend/src/controllers/notification.controller.ts`
- Test: `backend/tests/notification.controller.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByText("No leídas")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:frontend -- app/__tests__/notifications.test.tsx`
Expected: FAIL because the unread badge/page wiring does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Render unread count in the header and add page actions for mark read, archive, and mark all read.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:frontend -- app/__tests__/notifications.test.tsx && cd backend && npm test -- --runInBand tests/notification.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/notifications/page.tsx app/__tests__/notifications.test.tsx app/dashboard/page.tsx app/admin/page.tsx backend/src/controllers/notification.controller.ts backend/tests/notification.controller.test.ts
git commit -m "feat: add notifications ui"
```

### Task 3: Public search and risk score

**Files:**

- Modify: `app/page.tsx`
- Create: `app/risk-score/page.tsx`
- Modify: `backend/src/controllers/risk-score.controller.ts`
- Test: `backend/tests/risk-score.controller.test.ts`
- Test: `app/__tests__/risk-score.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByLabelText("Número de documento")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:frontend -- app/__tests__/risk-score.test.tsx`
Expected: FAIL because the page does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Expose public search on the landing page and add a logged-in risk score page.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:frontend -- app/__tests__/risk-score.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/risk-score/page.tsx app/__tests__/risk-score.test.tsx backend/src/controllers/risk-score.controller.ts backend/tests/risk-score.controller.test.ts
git commit -m "feat: add public search and risk score ui"
```

### Task 4: Bulk CSV upload

**Files:**

- Create: `app/bulk-upload/page.tsx`
- Create: `app/__tests__/bulk-upload.test.tsx`
- Modify: `backend/src/controllers/bulk-upload.controller.ts`
- Test: `backend/tests/bulk-upload.controller.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByText("Descargar template CSV")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:frontend -- app/__tests__/bulk-upload.test.tsx`
Expected: FAIL because the UI does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add upload form and template download actions.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:frontend -- app/__tests__/bulk-upload.test.tsx && cd backend && npm test -- --runInBand tests/bulk-upload.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/bulk-upload/page.tsx app/__tests__/bulk-upload.test.tsx backend/src/controllers/bulk-upload.controller.ts backend/tests/bulk-upload.controller.test.ts
git commit -m "feat: add bulk csv upload ui"
```

### Task 5: Verification review UI

**Files:**

- Create: `app/verifications/page.tsx`
- Create: `app/__tests__/verification.test.tsx`
- Modify: `backend/src/controllers/verification.controller.ts`
- Test: `backend/tests/verification.controller.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByText("Pendientes de revisión")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:frontend -- app/__tests__/verification.test.tsx`
Expected: FAIL because the page does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a page for viewing and resolving verification items.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:frontend -- app/__tests__/verification.test.tsx && cd backend && npm test -- --runInBand tests/verification.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/verifications/page.tsx app/__tests__/verification.test.tsx backend/src/controllers/verification.controller.ts backend/tests/verification.controller.test.ts
git commit -m "feat: add verification review ui"
```

### Task 6: Disputes and appeal flow

**Files:**

- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/controllers/dispute.controller.ts`
- Create: `backend/src/routes/dispute.routes.ts`
- Create: `backend/src/controllers/dispute-attachment.controller.ts`
- Create: `backend/src/routes/dispute-attachment.routes.ts`
- Create: `backend/src/middleware/dispute-owner.middleware.ts`
- Modify: `backend/src/app.ts`
- Create: `app/disputes/page.tsx`
- Create: `app/__tests__/disputes.test.tsx`
- Modify: `app/history/page.tsx`
- Modify: `app/admin/records/page.tsx`
- Test: `backend/tests/dispute.controller.test.ts`
- Test: `backend/tests/dispute-attachment.controller.test.ts`
- Test: `app/__tests__/disputes.test.tsx`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByText("Abrir disputa")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm run test:frontend -- app/__tests__/disputes.test.tsx`
Expected: FAIL because the dispute page does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add dispute records, owner-only dispute creation checks, admin resolution actions, upload endpoints for JPG/PDF evidence up to 3 MB each, and status transitions to `DISPUTED`, `APPROVED`, or `REJECTED`.

Backend test coverage must include:

- create dispute as authenticated owner
- reject dispute creation for non-owner users
- upload attachments to an existing dispute
- reject attachment uploads from unauthorized users
- admin resolve dispute to `APPROVED`
- admin resolve dispute to `REJECTED`
- deny resolution for non-admin users

Frontend test coverage must include:

- dispute entry point rendered for logged-in users
- open dispute form visible from the dispute page

Attachment contract:

- `POST /api/v1/disputes/:disputeId/attachments`
- multipart field name: `files`
- allowed MIME types: `image/jpeg`, `image/jpg`, `application/pdf`
- max size: 3 MB per file
- store files on disk under `backend/uploads/disputes/:disputeId/`
- persist `fileName`, `mimeType`, `sizeBytes`, `storagePath`, `uploadedById`, `disputeId`

Dispute contract:

- `POST /api/v1/disputes` creates a dispute for the authenticated user only
- `GET /api/v1/disputes/me` lists the user’s own disputes
- `PATCH /api/v1/disputes/:id/resolve` is admin-only and records the final decision and notes

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:frontend -- app/__tests__/disputes.test.tsx && cd backend && npm test -- --runInBand tests/dispute.controller.test.ts tests/dispute-attachment.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/src/controllers/dispute.controller.ts backend/src/controllers/dispute-attachment.controller.ts backend/src/routes/dispute.routes.ts backend/src/routes/dispute-attachment.routes.ts backend/src/middleware/dispute-owner.middleware.ts backend/src/app.ts app/disputes/page.tsx app/__tests__/disputes.test.tsx app/history/page.tsx app/admin/records/page.tsx backend/tests/dispute.controller.test.ts backend/tests/dispute-attachment.controller.test.ts
git commit -m "feat: add disputes and appeals flow"
```

### Task 7: Promote `irios@gmail.com` to admin

**Files:**

- Modify: `backend/prisma/schema.prisma` or seed/update script
- Modify: `backend/src/config/database.config.ts` if a seed helper is needed
- Test: `backend/tests/admin-role.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(user.role).toBe("ADMIN");
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd backend && npm test -- --runInBand tests/admin-role.test.ts`
Expected: FAIL until `irios@gmail.com` is promoted.

- [ ] **Step 3: Write minimal implementation**

Ensure `irios@gmail.com` exists as `ADMIN` in seed or migration data.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd backend && npm test -- --runInBand tests/admin-role.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/src/config/database.config.ts backend/tests/admin-role.test.ts
git commit -m "feat: promote irios to admin"
```
