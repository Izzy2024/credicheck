# M4 - Experiencia de Usuario Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pulir la interfaz de CrediCheck con dark mode, loading skeletons, formularios robustos, error boundaries, toasts consistentes, tipos compartidos y responsive design.

**Architecture:** Aprovechar la infraestructura existente (ThemeProvider, Skeleton, react-hook-form, Sonner ya instalados) y conectarla. Crear tipos compartidos en `@/types/`. Estandarizar en Sonner para toasts. Agregar `dark:` classes progresivamente.

**Tech Stack:** next-themes, react-hook-form + zod + @hookform/resolvers, sonner, shadcn/ui Skeleton/Form components

---

## File Structure

### Files to CREATE:

| File                                | Responsibility                                           |
| ----------------------------------- | -------------------------------------------------------- |
| `types/index.ts`                    | Shared TypeScript types for frontend                     |
| `types/api.ts`                      | API response/request types                               |
| `types/user.ts`                     | User-related types (exported from Zod schemas or manual) |
| `types/credit-reference.ts`         | Credit reference types                                   |
| `components/theme-toggle.tsx`       | Dark mode toggle button (moon/sun)                       |
| `components/error-boundary.tsx`     | Global error boundary wrapper                            |
| `components/loading-skeletons.tsx`  | Reusable skeleton layouts for each page type             |
| `app/error.tsx`                     | Next.js error boundary (root)                            |
| `app/global-error.tsx`              | Next.js global error boundary                            |
| `app/dashboard/loading.tsx`         | Dashboard skeleton (REWRITE)                             |
| `app/history/loading.tsx`           | History skeleton (REWRITE)                               |
| `app/results/found/loading.tsx`     | Found results skeleton (REWRITE)                         |
| `app/results/not-found/loading.tsx` | Not found skeleton (REWRITE)                             |
| `app/admin/loading.tsx`             | Admin layout skeleton (NEW)                              |
| `app/admin/users/loading.tsx`       | Users page skeleton (NEW)                                |
| `app/admin/records/loading.tsx`     | Records page skeleton (NEW)                              |
| `app/admin/settings/loading.tsx`    | Settings page skeleton (NEW)                             |
| `app/profile/loading.tsx`           | Profile page skeleton (NEW)                              |
| `app/add-record/loading.tsx`        | Add record skeleton (NEW)                                |
| `app/forgot-password/loading.tsx`   | Forgot password skeleton (NEW)                           |
| `app/signup/loading.tsx`            | Signup skeleton (NEW)                                    |

### Files to MODIFY:

| File                                                   | Change                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `app/layout.tsx`                                       | Add ThemeProvider wrapper, use theme-aware Sonner Toaster          |
| `app/globals.css`                                      | No changes needed (dark vars already exist)                        |
| `app/page.tsx`                                         | Convert login form to react-hook-form + zod, add dark: classes     |
| `app/signup/page.tsx`                                  | Convert form to react-hook-form + zod, add dark: classes           |
| `app/forgot-password/page.tsx`                         | Convert form to react-hook-form + zod, standardize to sonner toast |
| `app/dashboard/page.tsx`                               | Add dark: classes, improve responsive                              |
| `app/history/page.tsx`                                 | Add dark: classes, improve responsive table                        |
| `app/profile/page.tsx`                                 | Convert forms to react-hook-form, standardize to sonner toast      |
| `app/add-record/page.tsx`                              | Convert form to react-hook-form + zod, add dark: classes           |
| `app/results/found/page.tsx`                           | Add dark: classes                                                  |
| `app/results/not-found/page.tsx`                       | Add dark: classes                                                  |
| `app/admin/layout.tsx`                                 | Standardize to sonner toast, add dark: classes                     |
| `app/admin/page.tsx`                                   | Add dark: classes                                                  |
| `app/admin/users/page.tsx`                             | Standardize to sonner toast, add dark: classes                     |
| `app/admin/users/_components/create-user-dialog.tsx`   | Convert to react-hook-form, standardize to sonner toast            |
| `app/admin/users/_components/edit-user-dialog.tsx`     | Convert to react-hook-form, standardize to sonner toast            |
| `app/admin/records/_components/records-management.tsx` | Add dark: classes                                                  |
| `app/admin/records/_components/records-table.tsx`      | Add dark: classes, improve responsive                              |
| `app/admin/records/_components/status-manager.tsx`     | Add dark: classes                                                  |
| `app/admin/settings/page.tsx`                          | Convert forms to react-hook-form, add dark: classes                |

### Files to potentially REMOVE/CLEANUP:

| File                         | Reason                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| `hooks/use-toast.ts`         | Replace with sonner (keep file until all consumers migrated) |
| `components/ui/toast.tsx`    | Dead code after migration to sonner                          |
| `components/ui/toaster.tsx`  | Dead code after migration to sonner                          |
| `components/ui/use-toast.ts` | Duplicate of hooks/use-toast.ts                              |

---

## Task 1: M4.1 - Activar Dark Mode

**Files:**

- Modify: `app/layout.tsx`
- Create: `components/theme-toggle.tsx`
- Modify: `app/admin/layout.tsx` (add toggle to admin sidebar header)

- [ ] **Step 1: Wire ThemeProvider in root layout**

In `app/layout.tsx`:

- Import `ThemeProvider` from `@/components/theme-provider`
- Import `Toaster` from `@/components/ui/sonner` (theme-aware version) instead of `from "sonner"`
- Wrap `<AuthProvider>` inside `<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>`
- Add `suppressHydrationWarning` to `<html>` tag

- [ ] **Step 2: Create theme toggle component**

Create `components/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted)
    return <Button variant="ghost" size="icon" className="h-9 w-9" />;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
```

- [ ] **Step 3: Add ThemeToggle to admin layout**

In `app/admin/layout.tsx`, add `<ThemeToggle />` in the sidebar header area, next to the existing logo/title.

- [ ] **Step 4: Add ThemeToggle to main pages (dashboard, profile, history headers)**

In `app/dashboard/page.tsx`, `app/history/page.tsx`, `app/profile/page.tsx`, add `<ThemeToggle />` to the page header area.

- [ ] **Step 5: Add dark: classes to all pages**

Add `dark:` variants to key elements across all page files. Strategy:

- Backgrounds: `dark:bg-gray-900`, `dark:bg-gray-800`, `dark:bg-gray-950`
- Text: `dark:text-gray-100`, `dark:text-gray-300`, `dark:text-gray-400`
- Borders: `dark:border-gray-700`, `dark:border-gray-800`
- Cards: `dark:bg-gray-800 dark:border-gray-700`
- Inputs: `dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100`

Files to update (add dark: classes):

- `app/page.tsx` (login)
- `app/signup/page.tsx`
- `app/forgot-password/page.tsx`
- `app/dashboard/page.tsx`
- `app/history/page.tsx`
- `app/profile/page.tsx`
- `app/add-record/page.tsx`
- `app/results/found/page.tsx`
- `app/results/not-found/page.tsx`
- `app/admin/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/users/page.tsx`
- `app/admin/users/_components/create-user-dialog.tsx`
- `app/admin/users/_components/edit-user-dialog.tsx`
- `app/admin/records/_components/records-management.tsx`
- `app/admin/records/_components/records-table.tsx`
- `app/admin/records/_components/status-manager.tsx`
- `app/admin/settings/page.tsx`

- [ ] **Step 6: Verify dark mode works**

Run dev server, click toggle, verify all pages render correctly in both themes.

---

## Task 2: M4.2 - Loading Skeletons Reales

**Files:**

- Create: `components/loading-skeletons.tsx`
- Rewrite: `app/dashboard/loading.tsx`
- Rewrite: `app/history/loading.tsx`
- Rewrite: `app/results/found/loading.tsx`
- Rewrite: `app/results/not-found/loading.tsx`
- Create: `app/admin/loading.tsx`
- Create: `app/admin/users/loading.tsx`
- Create: `app/admin/records/loading.tsx`
- Create: `app/admin/settings/loading.tsx`
- Create: `app/profile/loading.tsx`
- Create: `app/add-record/loading.tsx`
- Create: `app/forgot-password/loading.tsx`
- Create: `app/signup/loading.tsx`

- [ ] **Step 1: Create reusable skeleton components**

Create `components/loading-skeletons.tsx` with these reusable skeleton layouts:

- `DashboardSkeleton` - 4 stat cards + chart area
- `HistorySkeleton` - search bar + table rows
- `ProfileSkeleton` - avatar + form fields
- `FormSkeleton` - generic form with N fields
- `TableSkeleton` - header + N rows
- `PageSkeleton` - generic page with header + content area

Each uses the existing `Skeleton` component from `@/components/ui/skeleton`.

- [ ] **Step 2: Rewrite all 4 existing loading.tsx files**

Replace `return null` with proper skeleton components in:

- `app/dashboard/loading.tsx` -> `<DashboardSkeleton />`
- `app/history/loading.tsx` -> `<HistorySkeleton />`
- `app/results/found/loading.tsx` -> result card skeleton
- `app/results/not-found/loading.tsx` -> not-found page skeleton

- [ ] **Step 3: Create missing loading.tsx files**

Create loading states for pages that don't have them:

- `app/admin/loading.tsx` -> admin layout skeleton
- `app/admin/users/loading.tsx` -> `<TableSkeleton />`
- `app/admin/records/loading.tsx` -> `<TableSkeleton />`
- `app/admin/settings/loading.tsx` -> `<FormSkeleton />`
- `app/profile/loading.tsx` -> `<ProfileSkeleton />`
- `app/add-record/loading.tsx` -> `<FormSkeleton fields={13} />`
- `app/forgot-password/loading.tsx` -> `<FormSkeleton fields={3} />`
- `app/signup/loading.tsx` -> `<FormSkeleton fields={6} />`

- [ ] **Step 4: Replace inline loading states in pages**

In pages that use plain text "Cargando..." or bare spinner divs:

- `app/dashboard/page.tsx` (line ~312) - replace with skeleton
- `app/history/page.tsx` (line ~207) - replace with skeleton
- `app/admin/page.tsx` (line ~121) - replace with skeleton
- `app/profile/page.tsx` (line ~319) - replace with skeleton
- `app/admin/settings/page.tsx` (line ~222) - replace with skeleton

---

## Task 3: M4.3 - Formularios con react-hook-form + Zod

**Files:**

- Create: `lib/validations/auth.ts` (zod schemas for login, signup, forgot-password)
- Create: `lib/validations/user.ts` (zod schemas for create/edit user)
- Create: `lib/validations/credit-reference.ts` (zod schema for add record)
- Create: `lib/validations/settings.ts` (zod schemas for profile/password settings)
- Modify: `app/page.tsx` (login form)
- Modify: `app/signup/page.tsx` (signup form)
- Modify: `app/forgot-password/page.tsx` (reset form)
- Modify: `app/profile/page.tsx` (profile + password forms)
- Modify: `app/add-record/page.tsx` (record form)
- Modify: `app/admin/users/_components/create-user-dialog.tsx`
- Modify: `app/admin/users/_components/edit-user-dialog.tsx`
- Modify: `app/admin/settings/page.tsx` (settings forms)

- [ ] **Step 1: Create shared Zod validation schemas**

Create `lib/validations/auth.ts`:

```ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const signupSchema = z
  .object({
    firstName: z.string().min(2, "Mínimo 2 caracteres"),
    lastName: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token requerido"),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
```

Create `lib/validations/user.ts` with createUserSchema and editUserSchema.
Create `lib/validations/credit-reference.ts` with createRecordSchema (13 fields matching current form).
Create `lib/validations/settings.ts` with profileSchema and changePasswordSchema.

- [ ] **Step 2: Convert login form (`app/page.tsx`)**

Replace `useState` for email/password/errors with:

```tsx
const form = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "" },
});
```

Use `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>` from `@/components/ui/form`.
Replace `validateEmail()` and manual error handling.

- [ ] **Step 3: Convert signup form (`app/signup/page.tsx`)**

Same pattern as login, using `signupSchema`.

- [ ] **Step 4: Convert forgot-password form (`app/forgot-password/page.tsx`)**

Replace manual validation with `forgotPasswordSchema` + `resetPasswordSchema`.

- [ ] **Step 5: Convert create-user-dialog form**

Replace `useState<CreateUserForm>` + manual `validateForm()` with react-hook-form + `createUserSchema`.

- [ ] **Step 6: Convert edit-user-dialog form**

Same pattern, using `editUserSchema`.

- [ ] **Step 7: Convert add-record form (`app/add-record/page.tsx`)**

This is the largest form (13 fields). Replace the 40+ line manual `validateForm()` with `createRecordSchema`.

- [ ] **Step 8: Convert profile page forms**

Two forms: profile info and change password. Convert both to react-hook-form.

- [ ] **Step 9: Convert settings page forms**

Two forms: profile and password. Convert both.

- [ ] **Step 10: Verify all forms work**

Test each form: valid input, invalid input, submission, error display.

---

## Task 4: M4.4 - Error Boundary Global

**Files:**

- Create: `app/error.tsx`
- Create: `app/global-error.tsx`

- [ ] **Step 1: Create root error boundary**

Create `app/error.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-bold">Algo salió mal</h2>
      <p className="text-muted-foreground text-center">
        Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
      </p>
      <Button onClick={reset}>Intentar de nuevo</Button>
    </div>
  );
}
```

- [ ] **Step 2: Create global error boundary**

Create `app/global-error.tsx` (catches root layout errors, must include own `<html>` and `<body>`).

- [ ] **Step 3: Verify error boundaries work**

Intentionally throw an error in a page to verify the boundary catches it.

---

## Task 5: M4.5 - Notificaciones Toast Consistentes (Estandarizar en Sonner)

**Files:**

- Modify: `app/profile/page.tsx` (migrate from radix toast to sonner)
- Modify: `app/admin/layout.tsx` (migrate from radix toast to sonner)
- Modify: `app/admin/users/_components/create-user-dialog.tsx` (migrate)
- Modify: `app/admin/users/_components/edit-user-dialog.tsx` (migrate)
- Modify: `app/admin/users/page.tsx` (migrate)
- Cleanup: `hooks/use-toast.ts`, `components/ui/toast.tsx`, `components/ui/toaster.tsx`, `components/ui/use-toast.ts`

- [ ] **Step 1: Migrate profile page from radix toast to sonner**

Replace `import { useToast } from "@/hooks/use-toast"` with `import { toast } from "sonner"`.
Change `toast({ title: "...", variant: "destructive" })` to `toast.error("...")` or `toast.success("...")`.

- [ ] **Step 2: Migrate admin layout**

Same migration pattern.

- [ ] **Step 3: Migrate create-user-dialog**

Same migration.

- [ ] **Step 4: Migrate edit-user-dialog**

Same migration.

- [ ] **Step 5: Migrate admin users page**

Same migration.

- [ ] **Step 6: Remove radix toast files**

Delete or mark as deprecated:

- `hooks/use-toast.ts`
- `components/ui/toast.tsx`
- `components/ui/toaster.tsx`
- `components/ui/use-toast.ts`

Verify no remaining imports of `@/hooks/use-toast` or `@/components/ui/use-toast`.

- [ ] **Step 7: Verify all toasts work**

Test toast notifications in all affected pages.

---

## Task 6: M4.6 - Tipos TypeScript Compartidos

**Files:**

- Create: `types/index.ts`
- Create: `types/user.ts`
- Create: `types/credit-reference.ts`
- Create: `types/api.ts`
- Modify: All pages with inline types (replace with imports from `@/types`)

- [ ] **Step 1: Create shared type definitions**

Create `types/user.ts`:

```ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER";
}

export interface EditUserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
}
```

Create `types/credit-reference.ts` with CreditReference, CreateCreditReferenceInput, etc.

Create `types/api.ts` with ApiResponse<T>, PaginatedResponse<T>, DashboardData, etc.

Create `types/index.ts` that re-exports everything.

- [ ] **Step 2: Replace inline types in page components**

Update all files that define local interfaces:

- `app/admin/users/_components/edit-user-dialog.tsx` - remove local `User` interface, import from `@/types`
- `app/admin/users/_components/create-user-dialog.tsx` - remove local `CreateUserForm`
- `app/admin/page.tsx` - remove local `DashboardData`
- `app/profile/page.tsx` - remove local `UserProfile`
- `app/admin/settings/page.tsx` - remove local `SettingsData`

- [ ] **Step 3: Verify TypeScript compilation**

Run `npx tsc --noEmit` to ensure all types are correct.

---

## Task 7: M4.7 - Responsive Design

**Files:**

- Modify: `app/history/page.tsx` (table mobile view)
- Modify: `app/admin/users/page.tsx` (table mobile view)
- Modify: `app/admin/records/_components/records-table.tsx` (table mobile view)
- Modify: `app/profile/page.tsx` (header responsive)
- Modify: `app/dashboard/page.tsx` (header responsive)

- [ ] **Step 1: Create mobile-friendly table wrapper pattern**

Create a responsive pattern where tables collapse to card layout on mobile:

```tsx
{/* Desktop: table */}
<div className="hidden md:block">
  <table>...</table>
</div>
{/* Mobile: cards */}
<div className="md:hidden space-y-3">
  {data.map(item => <MobileCard key={item.id} ... />)}
</div>
```

- [ ] **Step 2: Make history page table responsive**

Add mobile card layout for the history search results table (8 columns -> stacked cards on mobile).

- [ ] **Step 3: Make admin users table responsive**

Add mobile card layout for the users table.

- [ ] **Step 4: Make admin records table responsive**

Add mobile card layout for the records table.

- [ ] **Step 5: Fix dashboard/profile header responsiveness**

Ensure header areas with logo, back button, and user dropdown stack properly on mobile.

- [ ] **Step 6: Test on mobile viewport**

Verify all pages at 320px, 768px, and 1024px widths.

---

## Execution Order

Tasks should be executed in this order:

1. **Task 6** (Shared types) - first because other tasks reference types
2. **Task 1** (Dark mode) - foundational visual change
3. **Task 5** (Toast standardization) - quick win, affects many files
4. **Task 4** (Error boundaries) - small, independent
5. **Task 2** (Loading skeletons) - visual improvement
6. **Task 3** (Forms) - largest task, depends on shared types
7. **Task 7** (Responsive) - final polish, depends on dark: classes being in place

---

## Notes

- All packages needed are already installed (next-themes, react-hook-form, @hookform/resolvers, zod, sonner, lucide-react)
- The shadcn Form and Skeleton components already exist in `components/ui/`
- CSS variables for dark mode are already defined in `globals.css`
- Tailwind is configured with `darkMode: ["class"]`
- Focus on Sonner for toasts (cleaner API, fewer files to maintain)
