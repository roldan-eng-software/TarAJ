# Sistema Kanban Jurídico Interno

Private legal task management system built with Next.js, Firebase, and TypeScript.

## Project Status

**Current Phase**: Complete (MVP + Security + UX)  
**Completed Phases**: Setup, Tests, Core (US1-US4), Integration, Polish, Security Hardening, UX Improvements  
**Overall Progress**: MVP completo - 204 testes passando, TypeScript limpo, lint limpo

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js Route Handlers, TypeScript
- **Database**: Cloud Firestore (data), Cloud Storage (attachments)
- **Authentication**: Firebase Authentication
- **Deployment**: Vercel
- **Testing**: Vitest, React Testing Library

## Project Structure

```
├── app/
│   ├── (auth)/                    # Public routes
│   │   └── login/
│   ├── (private)/                 # Protected routes
│   │   ├── kanban/               # Main Kanban board
│   │   ├── tasks/                # Task details and management
│   │   ├── alerts/               # Alert inbox
│   │   ├── archive/              # Archived tasks
│   │   └── admin/                # Admin panel
│   ├── api/                       # Route Handlers (backend)
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── tasks/                # Task CRUD and workflow
│   │   ├── alerts/               # Alert management
│   │   └── admin/                # Admin operations
│   └── globals.css               # Global styles
├── components/                    # React components
│   ├── ui/                        # Generic UI components
│   ├── kanban/                    # Kanban board components
│   ├── tasks/                     # Task management components
│   ├── alerts/                    # Alert components
│   └── audit/                     # Audit display components
├── src/
│   ├── domain/                    # Business logic layer
│   │   ├── rbac/                  # Role-based access control
│   │   ├── auth/                  # Authentication logic
│   │   ├── tasks/                 # Task domain services
│   │   ├── workflow/              # Workflow state machine
│   │   ├── history/               # Task history tracking
│   │   ├── audit/                 # Audit logging
│   │   ├── notifications/         # Alert and email logic
│   │   ├── comments/              # Comment management
│   │   └── attachments/           # Attachment handling
│   ├── firebase/                  # Firebase integration
│   │   ├── client.ts              # Client SDK initialization
│   │   ├── admin.ts               # Admin SDK initialization
│   │   └── converters/            # Firestore data converters
│   ├── lib/                       # Utilities
│   ├── types/                     # TypeScript type definitions
│   └── constants/                 # Application constants
├── firebase/                      # Firebase configuration
│   ├── firestore.rules            # Firestore security rules
│   ├── storage.rules              # Cloud Storage security rules
│   └── indexes.json               # Firestore composite indexes
├── scripts/                       # Utility scripts
│   └── seed-initial-data.ts      # Database seeding
├── tests/                         # Test files
│   ├── unit/                      # Unit tests
│   ├── contract/                  # Route Handler contract tests
│   └── integration/               # End-to-end tests
└── package.json                   # Dependencies and scripts
```

## Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Firebase project with Authentication, Firestore, and Storage enabled
- Vercel account (for deployment)

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config and email provider details

# Seed initial database
npm run seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to start.

## Key Features

### User Story 1: Kanban Task Management (US1)
- Create legal tasks with title, description, priority, responsible user, participants, and due date
- View tasks in Kanban board with stages: Entrada, Em análise, Aguardando documentos, Em andamento, Em revisão, Concluída, Arquivada
- Move tasks between permitted stages with automatic history recording
- Role-based access control: Administrator, Coordinator, Collaborator, Internal Reader

### User Story 2: History, Comments & Attachments (US2)
- Complete append-only task history
- Add comments with @mention support
- Upload and download attachments with access control
- Chronological timeline view with all events

### User Story 3: Useful Alerts (US3)
- Internal alert inbox for task events
- Email notifications (optional via configured provider)
- Automatic alerts for: task creation, responsible change, stage change, due upcoming, due overdue, completion, archiving, mentions, backward movement
- Deduplication to prevent alert noise

### User Story 4: Archive & Consult (US4)
- Archive completed tasks
- Search and filter archived tasks
- Restore archived tasks
- Full access to archived task history

### Security & Audit
- Firestore Security Rules with deny-by-default
- Server-side RBAC enforcement via assertCan() and canAccessTask()
- httpOnly session cookie (not accessible via JavaScript)
- Rate limiting on API routes
- Route protection via middleware (redirects to /login)
- Complete audit trail for critical events
- Login failure tracking
- Permission change logging

### Admin Panel
- User management (CRUD, roles, password reset)
- Category management (CRUD, active/inactive)
- Alert configuration (per-stage, per-event toggles, recipient roles)
- Audit log viewer with filters
- Email job queue monitoring with manual processing

### Kanban Filters
- Filter by stage, priority, category, responsible user, due date status (próximos/vencidos), confidentiality level, and text search
- Responsive: columns on desktop, stage selector + vertical list on mobile

### Loading Skeletons & Error Boundaries
- Skeleton loading states for all pages (kanban columns, cards, tables, task detail)
- Error boundary components at root, private, and auth route levels
- Custom 404 page with navigation back to kanban

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test:coverage

# Watch mode
npm test -- --watch

# UI mode
npm test:ui
```

### Linting and Formatting

```bash
# Check linting
npm run lint

# Format code
npm run format

# Check formatting without changing
npm run format:check

# Type checking
npm run type-check
```

### Building

```bash
# Build for production
npm run build

# Start production server
npm start
```

## API Documentation

See [contracts/](./specs/001-legal-kanban/contracts/) for detailed API contracts:
- [Route Handlers](./specs/001-legal-kanban/contracts/route-handlers.md)
- [Domain Services](./specs/001-legal-kanban/contracts/domain-services.md)
- [Security Rules](./specs/001-legal-kanban/contracts/security-rules.md)

## Implementation Plan

See [specs/001-legal-kanban/](./specs/001-legal-kanban/) for detailed documentation:
- [spec.md](./specs/001-legal-kanban/spec.md) - Feature specification
- [plan.md](./specs/001-legal-kanban/plan.md) - Implementation plan
- [tasks.md](./specs/001-legal-kanban/tasks.md) - Task breakdown and progress
- [data-model.md](./specs/001-legal-kanban/data-model.md) - Data model and collections
- [quickstart.md](./specs/001-legal-kanban/quickstart.md) - Validation scenarios

## Constitution

This project follows the TarAJ Constitution principles:
1. **Privacy and Authorization by Default** - All data is internal and sensitive
2. **Mandatory Audit** - Complete audit trail for accountability
3. **Centralized Workflow** - All state changes through business logic layer
4. **Preserved History** - Complete task history for reference
5. **Operational Simplicity** - Clear UI optimized for internal users

See [.specify/memory/constitution.md](./.specify/memory/constitution.md) for details.

## Contributing

Follow the project structure and coding conventions established in this codebase. Ensure:
- All tests pass before committing
- Code is formatted with Prettier
- No linting errors
- Type checking passes
- Feature changes include tests

## Deployment

### Deploy to Vercel

```bash
# Connect your GitHub repo to Vercel
# Set environment variables in Vercel dashboard
# Push to main branch to auto-deploy
```

### Firebase Deployment

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules,storage:rules

# Deploy functions if needed
firebase deploy --only functions
```

## Support & Troubleshooting

See the [implementation guide](./IMPLEMENTATION_GUIDE.md) for detailed development instructions.

## License

Internal use only. Not for commercial distribution.
