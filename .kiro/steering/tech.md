# Technology Stack

## Framework & Runtime
- **Next.js 15.2.4**: React framework with App Router
- **React 19**: UI library with React Server Components (RSC)
- **TypeScript 5**: Type-safe JavaScript development
- **Node.js**: Runtime environment

## Styling & UI
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Headless UI components for accessibility
- **Lucide React**: Icon library
- **CSS Variables**: Theme system with light/dark mode support

## Form Handling & Validation
- **React Hook Form 7.54.1**: Form state management
- **Zod 3.24.1**: Schema validation
- **@hookform/resolvers**: Form validation integration

## Build Tools & Development
- **pnpm**: Package manager (lock file present)
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing
- **ESLint**: Code linting (build errors ignored in config)

## Common Commands

### Development
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Package Management
```bash
pnpm install      # Install dependencies
pnpm add <pkg>    # Add new dependency
```

## Configuration Notes
- TypeScript strict mode enabled
- Build errors ignored for development speed
- Images unoptimized in Next.js config
- Path aliases configured: `@/*` maps to project root
- Tailwind configured for app/, components/, and root directories