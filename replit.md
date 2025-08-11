# Overview

Bayti is an AI-powered calling agent system for real estate professionals. It integrates Twilio for calls, OpenAI for intelligent responses, and ElevenLabs for voice synthesis. The platform features a premium web dashboard for managing calls, leads, analytics, and testing AI call functionality, designed with an Apple-inspired UI and glassmorphism effects. The system aims to provide comprehensive tools for real estate operations, offering real-time analytics, lead processing, and appointment booking with dynamic script management.

**Key Capabilities**:
- AI-powered calling agent with real estate domain expertise.
- Real-time call processing with speech-to-text and text-to-speech.
- Comprehensive analytics for call performance, success rates, and qualified leads.
- Calendar-based appointment booking with conflict detection.
- Live script upload system with dynamic placeholders and AI conversation customization.
- Unified Node.js backend for AI calling system, integrating directly with Twilio and Express.js.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React with TypeScript using Vite.
- **Router**: Wouter for client-side routing.
- **State Management**: TanStack Query (React Query) for server state management.
- **UI Library**: Radix UI components with shadcn/ui design system.
- **Styling**: Tailwind CSS with custom CSS variables for theming.
- **Form Handling**: React Hook Form with Zod validation.

The frontend uses a component-based architecture, separating pages, UI components, and modals. It includes custom hooks for mobile detection and toast notifications. UI/UX design features an Apple-inspired aesthetic with glassmorphism effects, a unified logo system, and animated transitions for navigation.

## Backend Architecture

**Unified Node.js/Express Server**:
- Handles dashboard, authentication, API routing, and all AI calling functionality.
- Integrates directly with Twilio for webhooks.
- Proxy endpoints for AI features.

**AI Functionality**:
- **OpenAI Services**: Whisper for transcription, GPT-4o mini for responses.
- **ElevenLabs**: Text-to-speech voice synthesis.
- **Real-time Processing**: Asynchronous call processing pipeline.
- **Adaptive Humanizer Layer**: SSML-enhanced speech processing with micro-pauses, prosody variation, and adaptive mirroring of caller sentiment for natural conversation flow.

## Database Schema

**Database**: PostgreSQL with Neon serverless configuration.
- **Data Models**: Users, Call Logs, Leads, Call Scripts, Agent Settings, Appointments, Project Scripts.
- **Design**: UUID primary keys, timestamps, and relationships. Drizzle ORM for type-safe operations.

## Authentication & Session Management

Uses PostgreSQL session storage with `connect-pg-simple` for persistent session management. Supports role-based access control.

## Development Workflow

- **Hot Reload**: Vite HMR.
- **Type Safety**: Full TypeScript coverage with shared types.
- **Database Migrations**: Drizzle Kit for schema management.

# External Dependencies

## Core Runtime
- **@neondatabase/serverless**: Serverless PostgreSQL connection.
- **drizzle-orm**: Type-safe database ORM.
- **@tanstack/react-query**: Server state management.
- **express**: Node.js web framework.
- **Twilio**: For telecommunications.
- **OpenAI**: For AI speech processing and intelligent responses.
- **ElevenLabs**: For natural voice synthesis.

## UI and Styling
- **@radix-ui/**: UI primitives.
- **tailwindcss**: CSS framework.
- **class-variance-authority**: Component styling.
- **lucide-react**: Icon library.

## Form Management and Validation
- **react-hook-form**: Form handling.
- **@hookform/resolvers**: Validation integration.
- **zod**: Schema validation.
- **drizzle-zod**: Drizzle/Zod integration.

## Development Tools
- **vite**: Build tool and dev server.
- **typescript**: Static type checking.
- **tsx**: TypeScript execution for Node.js.

## Date and Utility Libraries
- **date-fns**: Date utility library.
- **clsx**: Conditional className utility.
- **wouter**: React routing.