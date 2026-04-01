# Project Structure

## Directory Organization

### App Router Structure (`/app`)
- **Next.js App Router**: File-based routing with layout and page components
- **Route Groups**: Organized by feature (dashboard, add-record, history, results)
- **Loading States**: `loading.tsx` files for async route transitions
- **Nested Routes**: Results split into `/found` and `/not-found` subdirectories

### Component Architecture (`/components`)
- **UI Components** (`/components/ui/`): shadcn/ui components (buttons, forms, cards, etc.)
- **Shared Components**: Theme provider, style guide at component root
- **Component Library**: Comprehensive set of 40+ UI primitives

### Supporting Directories
- **`/hooks`**: Custom React hooks (mobile detection, toast notifications)
- **`/lib`**: Utility functions and shared logic
- **`/styles`**: Global CSS files (duplicate globals.css in app/ and styles/)
- **`/public`**: Static assets (placeholder images, logos)

## File Naming Conventions
- **Pages**: `page.tsx` for route components
- **Layouts**: `layout.tsx` for shared layouts
- **Loading**: `loading.tsx` for loading states
- **Components**: kebab-case for UI components (`alert-dialog.tsx`)
- **Hooks**: camelCase with `use` prefix (`use-mobile.tsx`)

## Import Patterns
- **Path Aliases**: Use `@/` for all internal imports
- **Component Imports**: Import from `@/components/ui/` for UI components
- **Utility Imports**: Import from `@/lib/utils` for shared functions
- **Hook Imports**: Import from `@/hooks/` for custom hooks

## Code Organization Principles
- **Feature-based routing**: Each major feature has its own app directory
- **Component reusability**: UI components are atomic and composable
- **Type safety**: All components use TypeScript with proper typing
- **Accessibility**: Components built on Radix UI primitives for a11y compliance

## Configuration Files
- **Root level**: Package management, build tools, and framework configs
- **No nested configs**: All configuration at project root for simplicity