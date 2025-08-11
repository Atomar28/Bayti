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

**Duplicate Prevention Fix (2025-08-07)**: Fixed critical bug where AI system was creating duplicate leads and appointments for every speech segment in a conversation. Added duplicate detection logic to prevent multiple records for the same customer contact. System now accurately tracks unique leads and appointments, ensuring dashboard shows correct metrics (4 calls, 2 appointments, 71s average duration). Enhanced appointment parsing to capture exact requested dates, times, and updated contact numbers provided during calls.

**Unified Layout Design (2025-08-08)**: Completely redesigned the dashboard layout architecture with unified logo system spanning both sidebar and header areas for fluid, cohesive design. Implemented visual connection effects where selected sidebar pages appear to "open" from the sidebar section through animated connection lines and pulse effects. Created single premium BaytiAI logo positioned at top-left covering both sidebar and header zones, eliminating duplicate branding. Enhanced with slide-in animations, gradient connection lines, and smooth transitions that reinforce the visual relationship between navigation and content areas.

**Voice Configuration System Fix (2025-08-08)**: Resolved critical database constraint issues preventing voice settings from persisting properly. Fixed ElevenLabs API integration errors and corrected parameter order in voice synthesis methods. Enhanced voice configuration system to properly save and load user-selected voices (like George British Male) with custom voice settings (stability, similarity boost, style, speaker boost). System now correctly applies saved voice settings to live calls, replacing default female voice with user's selected voice preference. Added comprehensive logging to track voice configuration changes and ensure settings are properly synchronized between dashboard and AI calling system.

**Header Enhancement Update (2025-08-08)**: Enhanced dashboard header with larger, more prominent notification bell and user profile elements. Notification bell now matches user avatar size (56px diameter) with gradient background styling, proper shadows, and ring borders for visual consistency. Increased header height to 80px to prevent icon cropping and ensure professional appearance. Both notification system and user profile elements are now equally prominent and accessible in the dashboard interface.

**Landing Page Infrastructure (2025-08-11)**: Implemented comprehensive pricing and solutions page infrastructure with production-ready React components. Created separate Pricing.tsx and Solutions.tsx pages featuring conversion-focused design, comprehensive pricing models (Enterprise SaaS, Managed Service, API), and detailed solution explanations. Added navigation links to landing page connecting to new pricing and solutions routes. Pricing page includes interactive cost estimator, annual/monthly billing toggle, comprehensive FAQ section, and market-competitive pricing structure. Solutions page showcases AI calling capabilities, industry-specific use cases, platform benefits, and integration ecosystem. All pages implement proper SEO meta tags and responsive design patterns.

**Standalone Landing Pages Complete (2025-08-11)**: Successfully created standalone HTML pricing and solutions pages for maximum performance and zero loading delays. Implemented comprehensive pricing.html with interactive billing toggle, three-tier pricing structure ($299 Starter, $599 Professional, Custom Enterprise), and conversion-focused design. Created solutions.html showcasing complete AI calling platform capabilities, industry-specific solutions (Real Estate, B2B Sales, Financial, SaaS), and platform benefits. Added pricing snippet to main landing page with link to full pricing details. Updated navigation system to connect to standalone pages (/pricing.html, /solutions.html) for optimal loading speed. All pages feature responsive design, professional styling, and conversion-optimized CTAs.

**React Pricing Component Refactor (2025-08-11)**: Completely refactored the pricing page into a comprehensive React component with tabbed pricing structure. Implemented three distinct pricing models: Enterprise SaaS (subscription tiers: Pro $750/mo, Growth $1,950/mo, Scale $5,500/mo), Managed Service (per-call bundles: $0.30-$0.25/call), and API & Integrations (usage-based pricing from $0.30-$0.22/call). Added interactive features including monthly/annual billing toggle with 10% annual savings, "Coming Soon" badges for lead scraping features, comprehensive add-ons pricing, value proposition sections, price justification comparing to human callers ($0.37-$0.38 vs Bayti's $0.25+), detailed FAQ accordion, and mobile-optimized sticky CTAs. All pricing data is hardcoded for immediate deployment without external dependencies.

**Standalone Pricing Page Implementation (2025-08-11)**: Successfully converted the React pricing component to a comprehensive standalone HTML page, replacing the original landing page pricing. The new pricing.html features full interactive tabbed functionality with JavaScript, maintaining all React component features including billing toggles, FAQ accordions, and smooth animations. Includes proper navigation linking back to main landing page and other sections. Preserved the original pricing as pricing-old.html backup. The standalone version provides faster loading with zero dependencies while maintaining the complete user experience of the React component.

**Adaptive Humanizer Layer Integration (2025-08-11)**: Successfully implemented comprehensive adaptive humanizer layer for realtime AI calling pipeline. Added SSML-enhanced natural speech processing with micro-pauses, prosody variation, sparing backchannels/fillers, and adaptive mirroring of caller energy/speed/sentiment. System now converts LLM reply chunks into natural speech before TTS with configurable persona settings, conversation signal analysis from recent turns, and immediate barge-in safety. Humanizer includes sanitized SSML output, conversation tracking for energy/sentiment adaptation, and full unit test coverage. Integration complete in orchestrator.ts with environment-based configuration (HUMANIZE_ENABLED=true by default).

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