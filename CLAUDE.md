# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application called "Ustaz" that connects users with home service providers (electricians, plumbers, carpenters) in Pakistan. The app allows users to request services, find nearby providers, and track their service requests in real-time.

## Architecture-

The application follows a Next.js App Router architecture with:
- Client-side authentication using Clerk
- Database and real-time features using Supabase
- Internationalization support with next-intl
- Progressive Web App (PWA) capabilities
- Google Maps integration for location services
- Twilio for SMS OTP verification

### Key Components:
- **ServiceContext**: Manages service request state (address, service type, coordinates)
- **API Routes**: Handle OTP verification, location updates, and other backend operations
- **Real-time Features**: Supabase Realtime subscriptions for tracking service requests and provider locations
- **Multi-language Support**: Urdu, Arabic, and English with RTL/LTR support

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Key Directories

- `src/app/` - Next.js App Router pages and layouts
- `src/app/components/` - Reusable UI components for the main application
- `src/components/ui/` - Shadcn UI components
- `src/app/context/` - React Context providers
- `src/app/api/` - API routes
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and validations
- `src/actions/` - Server actions

## Authentication & Authorization

- User authentication is handled by Supabase authentication
- Provider authentication is handled by Supabase
- Role-based access control for different user types (customers vs service providers)

## Database & Real-time

- Supabase PostgreSQL database
- Real-time subscriptions for service requests and live location tracking
- Custom Supabase functions (e.g., find_providers_nearby)

## Internationalization

- Uses next-intl for multi-language support
- Supports English, Urdu, and Arabic
- Automatic RTL/LTR direction detection
- Translation files located in the i18n directory

## Key Features

- Service request workflow with real-time status updates
- Location-based provider matching
- SMS OTP verification for phone numbers
- Live tracking of service providers
- PWA installation capability
- Multi-language and RTL support