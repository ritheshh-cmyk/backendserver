# PhoneRepair Pro - Business Management System

## Overview

PhoneRepair Pro is a full-stack web application designed for managing phone repair business transactions. It provides a comprehensive solution for tracking customer repairs, managing payments, and generating business reports. The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Driver**: Neon Database serverless driver
- **Validation**: Zod schemas for runtime type safety
- **File Structure**: Monorepo structure with shared types and schemas

## Key Components

### Database Schema
- **Transactions Table**: Core entity storing repair transaction data including customer info, device details, repair costs, and payment information
- **Users Table**: Basic user authentication structure (prepared for future auth implementation)
- **Shared Schema**: TypeScript types and Zod validation schemas shared between frontend and backend

### API Layer
- RESTful API endpoints for transaction CRUD operations
- Search and filtering capabilities
- Excel export functionality
- Statistics aggregation for business insights
- Error handling with proper HTTP status codes

### Frontend Components
- **Dashboard**: Main interface for creating new transactions and viewing summaries
- **Transaction History**: Comprehensive view of all transactions with search and filtering
- **Transaction Form**: Multi-step form for capturing repair details
- **Responsive Design**: Mobile-first approach with dedicated mobile navigation

### UI/UX Features
- Modern, professional design suitable for business use
- Responsive layout that works on desktop and mobile devices
- Real-time form validation and error handling
- Toast notifications for user feedback
- Loading states and proper error boundaries
- Dark/light mode toggle with theme persistence
- Bilingual support (English/Telugu) with comprehensive translations
- Hidden profit details with eye icon reveal functionality
- Advanced search and filtering capabilities

## Data Flow

1. **Transaction Creation**: User fills out transaction form → Form validation → API call to create transaction → Database insertion → UI update with success feedback
2. **Data Retrieval**: Page load → Query client fetches data → API endpoint retrieves from database → Data displayed in components
3. **Search/Filter**: User input → Debounced API calls → Database queries with filters → Results rendered
4. **Export**: Export button → Server generates Excel file → File download initiated

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **ORM**: Drizzle ORM for type-safe database operations
- **UI Components**: Radix UI primitives via shadcn/ui
- **Validation**: Zod for schema validation
- **State Management**: TanStack Query for server state
- **Excel Export**: ExcelJS for spreadsheet generation

### Development Dependencies
- **Build Tools**: Vite, esbuild for production builds
- **TypeScript**: Full type safety across the stack
- **Tailwind CSS**: Utility-first styling
- **ESLint/Prettier**: Code quality and formatting

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reloading via Vite
- **Production**: Built assets served by Express with static file serving
- **Database**: Environment-based DATABASE_URL configuration
- **Port Configuration**: Configurable port with default 5000

### Build Process
1. Frontend assets built with Vite and output to `dist/public`
2. Backend TypeScript compiled to ES modules in `dist`
3. Production server serves both API and static assets
4. Database migrations handled via Drizzle Kit

### Replit Integration
- Configured for Replit deployment with autoscale target
- Proper port configuration for Replit environment
- Build and run scripts optimized for Replit workflow

## Changelog

- June 23, 2025. Initial setup with basic transaction management
- June 23, 2025. Added advanced features:
  - Dark mode and English/Telugu language support
  - Inventory management with parts tracking
  - Expenditure tracking system
  - Supplier management with payment tracking
  - Profit calculation with hidden cost breakdown
  - Eye icon functionality to reveal/hide sensitive cost data
  - Enhanced search across all transaction fields
  - Mobile-responsive design improvements
- January 24, 2025. Successfully migrated project from Replit Agent to Replit environment:
  - Installed all Node.js dependencies and Radix UI components
  - Fixed Vite configuration with proper Replit plugin integration
  - Configured server to bind to 0.0.0.0:5000 for Replit compatibility
  - Resolved security vulnerabilities and ensured client/server separation
  - Project now runs cleanly without errors in Replit environment

## User Preferences

Preferred communication style: Simple, everyday language.
Development workflow: Uses Git for version control and updates.

## Recent Changes

- June 25, 2025: Successfully migrated to use existing Neon database
- Authentication system implemented with admin/admin123 credentials
- Fixed database connection issues by switching from Neon serverless driver to standard pg driver
- Server-final.js now serves both API and frontend through single port 5000
- Application fully operational with working login and database connectivity
- All core functionality restored and ready for business use