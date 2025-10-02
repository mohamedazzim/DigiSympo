# Symposium Management System

## Overview
The Symposium Management System is a React-based web application for managing symposium events, featuring:
- Role-based access control (Super Admin, Event Admin, Participants)
- Proctored online testing with strict integrity measures
- Event and question management
- Real-time leaderboards and reporting

## Recent Changes
**October 2, 2025** - Phase 1: Database Schema Implementation
- Created comprehensive database schema with 9 tables:
  - Users (supports super_admin, event_admin, participant roles)
  - Events (symposium events)
  - Event Admins (event assignments)
  - Event Rules (proctoring rules)
  - Rounds (multiple rounds per event)
  - Questions (various question types)
  - Participants (event registration)
  - Test Attempts (tracking sessions with violation logs)
  - Answers (participant responses)
- Configured PostgreSQL database with Drizzle ORM
- Implemented database storage layer with full CRUD operations
- Set up basic JWT authentication endpoints (register, login, get user)

## Project Architecture

### Tech Stack
- **Frontend**: React with Vite, Wouter (routing), TanStack Query, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle
- **Authentication**: JWT with bcrypt
- **UI Components**: shadcn/ui (Radix UI primitives)

### Database Schema
The system uses a relational PostgreSQL database with the following core tables:
- Users with role-based access
- Events with rounds and questions
- Proctoring rules and violation tracking
- Test attempts with scoring and integrity monitoring
- Answers with automatic grading support

## User Preferences
- Following PRD specification from attached_assets
- Using PostgreSQL instead of MongoDB (already configured)
- Building in phases as outlined in the PRD
- Strict proctoring features required (fullscreen, no tab switching, no refresh)

## Next Steps
- Phase 2: Complete authentication system with role-based middleware
- Phase 3: Build Super Admin Dashboard
- Phase 4: Build Event Admin Dashboard
- Phase 5: Build Participant Interface
- Phase 6: Implement proctoring system
- Phase 7: Build leaderboard and reporting system
