# Metro Bus System - Shared Package

Shared types, utilities, constants, and validation schemas used across all Metro Bus applications.

## What's Inside

- **Types**: TypeScript interfaces and enums for all domain models
- **Validation**: Zod schemas for runtime validation
- **Constants**: Application-wide constants
- **Utils**: Utility functions for formatting, date manipulation, and validation

## Usage

```typescript
import { UserRole, registerSchema, formatCurrency } from '@metro/shared';
```

## Development

```bash
pnpm typecheck
```
