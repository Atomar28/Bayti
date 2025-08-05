# Overview

Bayti is a full-stack web application for managing AI-powered calling agent operations. The system provides a comprehensive dashboard for tracking call logs, managing leads, analyzing performance metrics, and configuring agent settings. Built as a modern single-page application with real-time data management capabilities for sales and lead generation workflows.

**NEW**: Added a premium marketing landing page with Apple-inspired design, glassmorphism effects, smooth animations, and conversion-optimized layout for lead generation. Complete rebrand from "DARI AI" to "Bayti" across all platform components.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool
- **Router**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a component-based architecture with clear separation between pages, UI components, and modals. Custom hooks handle mobile detection and toast notifications.

## Backend Architecture

**Server**: Express.js with TypeScript
- **Database Layer**: Drizzle ORM with type-safe database operations
- **API Design**: RESTful endpoints with proper error handling and validation
- **File Structure**: Clean separation between routes, storage layer, and database configuration
- **Middleware**: Request logging, JSON parsing, and error handling middleware

The backend implements a repository pattern through the storage layer, abstracting database operations and providing a clean interface for data access.

## Database Schema

**Database**: PostgreSQL with Neon serverless configuration
- **Users**: Authentication and role management
- **Call Logs**: Detailed call tracking with recordings, duration, and outcomes
- **Leads**: Contact management with qualification scoring and follow-up tracking
- **Call Scripts**: Configurable conversation templates
- **Agent Settings**: Customizable AI agent configuration

All tables use UUID primary keys and include proper timestamps and relationships.

## Authentication & Session Management

Uses PostgreSQL session storage with connect-pg-simple for persistent session management. The system supports role-based access control through the users table.

## Development Workflow

- **Hot Reload**: Vite HMR in development with error overlay
- **Type Safety**: Full TypeScript coverage with shared types between frontend and backend
- **Database Migrations**: Drizzle Kit for schema management
- **Build Process**: Separate build processes for client and server with proper bundling

# External Dependencies

## Core Runtime Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection pooling
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **express**: Node.js web application framework

## UI and Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant API for component styling
- **lucide-react**: Icon library for consistent iconography

## Form Management and Validation
- **react-hook-form**: Performant forms with minimal re-renders
- **@hookform/resolvers**: Integration with validation libraries
- **zod**: TypeScript-first schema validation
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

## Development Tools
- **vite**: Fast build tool and development server
- **typescript**: Static type checking
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **tsx**: TypeScript execution for Node.js

## Date and Utility Libraries
- **date-fns**: Modern date utility library
- **clsx**: Conditional className utility
- **wouter**: Minimalist routing for React

The application is configured for deployment on Replit with specific plugins and optimizations for the platform.