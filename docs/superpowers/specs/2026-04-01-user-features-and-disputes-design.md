# User Features and Disputes Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the business features to normal authenticated users, keep search public, promote `irios@gmail.com` to admin, and add a user dispute flow with attachments and admin resolution.

**Architecture:** Keep the existing admin area intact and add a user-facing feature menu for authenticated users outside `/admin`. Reuse the current backend controllers and Prisma models where possible, and extend the record status flow so authenticated users can initiate disputes with text and JPG/PDF evidence while admins review and resolve them. The public surface remains limited to search.

**Tech Stack:** Next.js 15, React, TypeScript, Express, Prisma, Zod, React Hook Form, Tailwind CSS

---

### Task 1: User navigation and route exposure

**Files:**

- Modify: `app/dashboard/page.tsx`
- Modify: `app/page.tsx`
- Create: `app/notifications/page.tsx`
- Create: `app/risk-score/page.tsx`
- Create: `app/bulk-upload/page.tsx`
- Create: `app/verifications/page.tsx`
- Create: `app/feature-center/page.tsx`
- Modify: `app/history/page.tsx`
- Modify: `app/admin/page.tsx`

- [ ] **Step 1: Write the failing test / visible assertion**

```ts
expect(screen.getByText("Notificaciones")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test -- <navigation test>`
Expected: FAIL because the menu items/pages do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add a feature center page and user menu entries that use existing layout patterns.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test -- <navigation test>`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/page.tsx app/page.tsx app/history/page.tsx app/notifications/page.tsx app/risk-score/page.tsx app/bulk-upload/page.tsx app/verifications/page.tsx app/feature-center/page.tsx app/admin/page.tsx
git commit -m "feat: expose user features in main navigation"
```

### Task 2: Notifications screen and unread badge

**Files:**

- Create: `app/notifications/page.tsx`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/admin/page.tsx`
- Modify: `backend/src/controllers/notification.controller.ts`
- Test: `backend/tests/notification.controller.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByText("No leídas")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd backend && npm test -- --runInBand tests/notification.controller.test.ts`
Expected: FAIL until the unread badge/page wiring exists.

- [ ] **Step 3: Write minimal implementation**

Render unread count in the header and page actions for mark read/archive/mark all read.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd backend && npm test -- --runInBand tests/notification.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/notifications/page.tsx app/dashboard/page.tsx app/admin/page.tsx backend/src/controllers/notification.controller.ts backend/tests/notification.controller.test.ts
git commit -m "feat: add user notifications screen"
```

### Task 3: Public search and risk score access

**Files:**

- Modify: `app/page.tsx`
- Create: `app/risk-score/page.tsx`
- Modify: `backend/src/controllers/risk-score.controller.ts`
- Test: `backend/tests/risk-score.controller.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByLabelText("Número de documento")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm run type-check`
Expected: FAIL until the page exists.

- [ ] **Step 3: Write minimal implementation**

Expose public search on the landing page and add a logged-in risk score page.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm run type-check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/risk-score/page.tsx backend/src/controllers/risk-score.controller.ts backend/tests/risk-score.controller.test.ts
git commit -m "feat: add public search and risk score UI"
```

### Task 4: Bulk CSV upload UI

**Files:**

- Create: `app/bulk-upload/page.tsx`
- Modify: `backend/src/controllers/bulk-upload.controller.ts`
- Test: `backend/tests/bulk-upload.controller.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByText("Descargar template CSV")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd backend && npm test -- --runInBand tests/bulk-upload.controller.test.ts`
Expected: FAIL until the UI exists.

- [ ] **Step 3: Write minimal implementation**

Add upload form and template download actions.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd backend && npm test -- --runInBand tests/bulk-upload.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/bulk-upload/page.tsx backend/src/controllers/bulk-upload.controller.ts backend/tests/bulk-upload.controller.test.ts
git commit -m "feat: add bulk csv upload ui"
```

### Task 5: Verification review UI

**Files:**

- Create: `app/verifications/page.tsx`
- Modify: `backend/src/controllers/verification.controller.ts`
- Test: `backend/tests/verification.controller.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByText("Pendientes de revisión")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd backend && npm test -- --runInBand tests/verification.controller.test.ts`
Expected: FAIL until the page exists.

- [ ] **Step 3: Write minimal implementation**

Add a page for viewing and resolving verification items.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd backend && npm test -- --runInBand tests/verification.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/verifications/page.tsx backend/src/controllers/verification.controller.ts backend/tests/verification.controller.test.ts
git commit -m "feat: add verification review ui"
```

### Task 6: Disputes and appeal flow

**Files:**

- Modify: `backend/prisma/schema.prisma`
- Create: `backend/src/controllers/dispute.controller.ts`
- Create: `backend/src/routes/dispute.routes.ts`
- Create: `backend/src/controllers/dispute-attachment.controller.ts`
- Create: `backend/src/routes/dispute-attachment.routes.ts`
- Modify: `backend/src/app.ts`
- Create: `backend/src/middleware/dispute-owner.middleware.ts`
- Create: `app/disputes/page.tsx`
- Modify: `app/history/page.tsx`
- Modify: `app/admin/records/page.tsx`
- Test: `backend/tests/dispute.controller.test.ts`
- Test: `backend/tests/dispute-attachment.controller.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(await screen.findByText("Abrir disputa")).toBeInTheDocument();
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `cd backend && npm test -- --runInBand tests/dispute.controller.test.ts tests/dispute-attachment.controller.test.ts`
Expected: FAIL until the dispute flow exists.

- [ ] **Step 3: Write minimal implementation**

Add dispute records, attachment metadata, owner-only dispute creation checks, admin resolution actions, upload endpoints for JPG/PDF evidence up to 3 MB each, and status transitions to `DISPUTED`.

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

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `cd backend && npm test -- --runInBand tests/dispute.controller.test.ts tests/dispute-attachment.controller.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/src/controllers/dispute.controller.ts backend/src/controllers/dispute-attachment.controller.ts backend/src/routes/dispute.routes.ts backend/src/routes/dispute-attachment.routes.ts backend/src/app.ts backend/src/middleware/dispute-owner.middleware.ts app/disputes/page.tsx app/history/page.tsx app/admin/records/page.tsx backend/tests/dispute.controller.test.ts backend/tests/dispute-attachment.controller.test.ts
git commit -m "feat: add disputes and appeals flow"
```

### Task 7: Promote user to admin

**Files:**

- Modify: `backend/prisma/schema.prisma` or seed/update script
- Modify: `backend/src/config/database.config.ts` if a seed helper is needed
- Test: `backend/tests/admin-role.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
expect(user.role).toBe("ADMIN");
```

- [ ] **Step 2: Run it to make sure it fails**

Run: `npm test -- admin-role.test.ts`
Expected: FAIL until `irios@gmail.com` is promoted.

- [ ] **Step 3: Write minimal implementation**

Ensure `irios@gmail.com` exists as `ADMIN` in seed or migration data.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test -- admin-role.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/src/config/database.config.ts backend/tests/admin-role.test.ts
git commit -m "feat: promote irios to admin"
```
