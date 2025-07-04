# Email Security Analyzer

## Overview

This is a full-stack web application for analyzing email files to detect potential security threats. The application allows users to upload email files (.eml, .msg, .txt) and performs comprehensive security analysis using AI, DNS validation, and forensic techniques. Built with React frontend, Express backend, and PostgreSQL database using Drizzle ORM.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with dark theme optimized for security applications
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **File Upload**: Multer middleware for handling email file uploads
- **API Design**: RESTful endpoints with structured error handling
- **Services**: Modular service architecture for email parsing, AI analysis, and DNS validation

### Database Architecture
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Structured tables for users and email analyses with JSONB fields for flexible data storage
- **Migrations**: Drizzle-kit for database schema management

## Key Components

### Email Processing Pipeline
1. **File Upload Service**: Validates and processes .eml, .msg, and .txt email files
2. **Email Parser**: Extracts headers, body content, links, and attachments from email files
3. **AI Analyzer**: Uses OpenAI GPT-4o to assess threat levels and provide security recommendations
4. **DNS Validator**: Validates SPF, DKIM, and DMARC authentication records
5. **Results Aggregation**: Combines all analysis results into comprehensive security assessment

### UI Components
- **Dashboard**: Central hub showing analysis statistics and recent analyses
- **File Upload**: Drag-and-drop interface with file validation
- **Analysis Results**: Detailed view of security assessment with color-coded risk levels
- **Sidebar Navigation**: Security-themed navigation with status indicators

### Security Features
- Risk level classification (LOW, MEDIUM, HIGH)
- Email authentication validation (SPF, DKIM, DMARC)
- Link extraction and analysis capabilities
- Attachment metadata processing
- AI-powered threat assessment with confidence scoring

## Data Flow

1. User uploads email file through web interface
2. File is validated and stored in memory
3. Email parser extracts structured data from file content
4. DNS validator checks authentication records for sender domain
5. OpenAI analyzer processes email content for threat assessment
6. All results are aggregated and stored in database
7. Comprehensive analysis is returned to client
8. Dashboard statistics are updated in real-time

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **multer**: File upload handling
- **openai**: AI-powered email analysis

### UI Dependencies
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **wouter**: Lightweight routing

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **drizzle-kit**: Database migration tool

## Deployment Strategy

### Development Environment
- Vite development server with HMR for frontend
- tsx for TypeScript execution in development
- Replit integration with runtime error overlay
- File watching and auto-restart capabilities

### Production Build
- Vite builds optimized frontend bundle to `dist/public`
- esbuild bundles server code for production deployment
- Environment variables for database and API key configuration
- Static file serving for built frontend assets

### Database Management
- Environment-based database URL configuration
- Drizzle migrations stored in `./migrations` directory
- Push-based schema updates for development

## Changelog

```
Changelog:
- July 04, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```