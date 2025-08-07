# Overview

Bayti is a comprehensive AI-powered calling agent system built for real estate professionals. The platform integrates Twilio for phone calls, OpenAI for speech processing and intelligent responses, and ElevenLabs for natural voice synthesis. Features a premium web dashboard for managing calls, leads, analytics, and testing AI call functionality.

**Key Features**: 
- AI-powered calling agent with real estate expertise
- Real-time call processing with speech-to-text and text-to-speech
- Twilio integration for incoming/outgoing calls
- Test call functionality from dashboard
- Real-time call logs and conversation tracking
- Calendar-based appointment booking with conflict detection
- Live script upload system with dynamic placeholders
- Project-specific AI conversation customization
- Premium Apple-inspired UI design with glassmorphism effects

**Recent Integration**: Successfully migrated from unstable dual-server architecture to unified Node.js implementation for AI calling system. Integrated Twilio directly with Express.js server, eliminating Python backend dependency. All AI calling functionality now runs through single stable server with proper TwiML webhook responses. System confirmed working with live test calls and speech recognition.

**Latest Features (2025-08-07)**: Completely overhauled dashboard analytics to display authentic call data instead of mock statistics. Implemented real-time dashboard updates with 30-second automatic refresh polling for live monitoring. Fixed database queries to calculate accurate success rates (31.9%), call durations (4:29 avg), and qualified leads from actual AI agent performance. Redefined "qualified leads" to specifically track appointments and callbacks booked through the AI agent rather than generic call completions.

**Real-Time Analytics System (2025-08-07)**: Dashboard now displays authentic call performance data sourced directly from actual AI agent interactions. Key metrics include real call durations, genuine success rates based on completed/qualified calls, and accurate appointment booking counts. System automatically refreshes statistics every 30 seconds for live monitoring of agent performance. Qualified leads are precisely defined as appointments or callbacks successfully scheduled through AI conversations, providing actionable business intelligence for real estate operations.

**AI Call Data Processing (2025-08-07)**: Implemented intelligent parsing of AI conversations to automatically extract lead information and appointment bookings. System now creates lead records with contact details (name, phone) and appointment records with scheduled times when AI agent successfully books callbacks or meetings. Call duration calculation works in real-time, and success rates are accurately computed based on meaningful conversations (excluding initiated-only calls). All appointment and lead data captured from AI interactions appears immediately on dashboard and leads pages.

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

**Dual-Server Setup**: 
- **Node.js/Express**: Main web server (port 5000) handling dashboard, authentication, and API routing
- **Python FastAPI**: AI calling backend (port 8000) handling Twilio webhooks, OpenAI integration, and voice processing

**Node.js Backend**:
- **Database Layer**: Drizzle ORM with type-safe database operations
- **API Design**: RESTful endpoints with proper error handling and validation
- **AI Integration**: Proxy endpoints to Python backend for AI calling features

**Python FastAPI Backend**:
- **Twilio Integration**: Webhook handling for incoming calls
- **OpenAI Services**: Whisper for transcription, GPT-4o mini for responses
- **ElevenLabs**: Text-to-speech voice synthesis
- **Real-time Processing**: Asynchronous call processing pipeline

## Database Schema

**Database**: PostgreSQL with Neon serverless configuration
- **Users**: Authentication and role management
- **Call Logs**: Detailed call tracking with recordings, duration, and outcomes
- **Leads**: Contact management with qualification scoring and follow-up tracking
- **Call Scripts**: Configurable conversation templates
- **Agent Settings**: Customizable AI agent configuration
- **Appointments**: Calendar-based appointment scheduling with Google integration
- **Project Scripts**: Live script uploads with dynamic placeholder support

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