# Symposium Management System

## Overview
The Symposium Management System is a React-based web application for managing symposium events. It provides role-based access control (Super Admin, Event Admin, Participants), facilitates proctored online testing with strict integrity measures, enables efficient event and question management, and offers real-time leaderboards and reporting capabilities. The project aims to deliver a robust, secure, and user-friendly system for organizing and conducting online assessments for various events.

## User Preferences
- Following PRD specification from attached_assets
- Using PostgreSQL instead of MongoDB (already configured)
- Building in phases as outlined in the PRD
- Strict proctoring features required (fullscreen, no tab switching, no refresh)
- **NEW REQUIREMENT: Single-Event Event Admin Dashboard**
  - Each Event Admin is assigned to ONE specific event only
  - Dashboard must show ONLY their assigned event data (not multi-event summaries)
  - Remove: My Events, Active Events, Recent Activity, Quick Actions sections
  - Show: Event Name, Total Participants Count, Manage Settings button, Test Control button
  - Event-centric design: All features focus on managing that single event
  - Enterprise-grade, minimal UI with real-time live results capability

## System Architecture

### UI/UX Decisions
The system uses React with Vite, shadcn/ui (Radix UI primitives), and Tailwind CSS for a fast, modern, and responsive frontend. Design emphasizes clarity, ease of navigation, and clear data presentation, including visual podiums for leaderboards. UI for Event Admin Dashboard is enterprise-grade with indigo/purple gradient color schemes and professional animations.

### Technical Implementations
The application follows a client-server architecture with a React frontend and a Node.js Express backend. Data is stored in PostgreSQL using Drizzle ORM. Authentication uses JWT with bcrypt for password hashing, and role-based access control is enforced via middleware.

Key features and their technical implementations include:
- **Role-Based Access Control:** Super Admin, Event Admin, and Participant roles with corresponding permissions.
- **Event and Round Management:** CRUD operations for events and rounds, including a new 3-state lifecycle (not_started → in_progress → completed) with real-time status synchronization and action-based controls.
- **Question Management:** Support for MCQ, True/False, Short Answer, and Coding question types, with bulk upload.
- **Proctored Online Testing:** Configurable proctoring rules per round, including fullscreen enforcement, tab switch detection, and violation tracking leading to auto-submission or disqualification.
- **Test Flow:** Admin-controlled with live countdown timers, auto-save, and detailed results.
- **Reporting:** Event-wise and symposium-wide reports downloadable as JSON.
- **Leaderboard System:** Real-time leaderboards for rounds and events, with a visual podium.
- **Universal Login:** Supports both event-specific participant credentials and standard admin accounts.
- **On-Spot Registration:** Registration Committee can create, read, update, and delete participants directly, with event selection limits and auto-generated credentials.
- **Restart Round Functionality:** Event Admins can restart rounds, which deletes all participant attempts and resets the round status.

### System Design Choices
- **Modular Design:** Clear separation of concerns between frontend, backend, and database.
- **Scalability:** Built on a modern tech stack.
- **Data Integrity:** Ensured through robust backend validation and database constraints.
- **Security:** Implemented with JWT, bcrypt, and role-based access control.
- **Testability:** Extensive use of `data-testid` attributes.

## External Dependencies
- **Frontend Framework:** React
- **Build Tool:** Vite
- **Routing:** Wouter
- **State Management/Data Fetching:** TanStack Query
- **Styling Framework:** Tailwind CSS
- **UI Components:** shadcn/ui (based on Radix UI primitives)
- **Backend Runtime:** Node.js
- **Web Framework:** Express
- **Database:** PostgreSQL (specifically Neon for Replit environment)
- **Object-Relational Mapper (ORM):** Drizzle
- **Authentication:** JSON Web Tokens (JWT), bcrypt
- **PDF Generation:** PDFKit

## Recent Changes

### October 3, 2025 - Human-Readable Credential Generation & Export Functionality ✅

**NEW FEATURE: Human-Readable Credential Format**
- ✅ Replaced random credential generation with meaningful, easy-to-remember format
- ✅ **Username Format:** `<eventname>-<firstname>-<counter>` 
  - Example: `coding-mohamed-001`
  - eventname: Event name lowercased, spaces replaced with hyphens
  - firstname: First word of participant's full name (lowercased)
  - counter: 3-digit zero-padded per-event incremental number (001, 002, ..., 999)
- ✅ **Password Format:** `<shortname><counter>`
  - Example: `azzim001`
  - shortname: Last word of full name OR first 5 chars if no space (lowercased)
  - counter: Same 3-digit number as username
- ✅ **Examples:**
  - Mohamed Azzim in Coding → Username: `coding-mohamed-001`, Password: `azzim001`
  - Sarah Khan in Quiz Competition → Username: `quiz-competition-sarah-002`, Password: `khan002`

**Credential Generation Logic:**
- ✅ Per-event counter starting at 001 (independent counters per event)
- ✅ Counter calculated by querying existing event credentials: `COUNT(*) + 1`
- ✅ Applied to both on-spot registration AND pre-registration approval flows
- ✅ Backward compatible: Existing participants with random credentials remain functional

**NEW FEATURE: CSV/PDF Export for Credentials**
- ✅ Added GET /api/registration-committee/participants/export/csv endpoint
- ✅ Added GET /api/registration-committee/participants/export/pdf endpoint
- ✅ Both protected with requireAuth + requireRegistrationCommittee middleware
- ✅ CSV format: Headers → Participant Name, Email, Phone, Event Name, Username, Password
- ✅ PDF format: Professional table with borders, alternating row colors, landscape A4
- ✅ Export buttons added to Registration Committee On-Spot Registration page
- ✅ Secure download handlers using fetch with Bearer token authentication
- ✅ Loading states and toast notifications for UX feedback

**UI Enhancements:**
- ✅ Credentials displayed in clean shadcn Table component (Event Name | Username | Password | Actions)
- ✅ Copy buttons for individual username/password with toast notifications
- ✅ Export CSV and Export PDF buttons with Download icons
- ✅ Professional enterprise-grade styling consistent with existing design
- ✅ All elements have proper data-testid attributes for testing

**Backend Implementation:**
- ✅ Added `getEventCredentialCountForEvent(eventId)` to storage interface
- ✅ Created `generateHumanReadableCredentials(fullName, eventName, counter)` helper
- ✅ Updated on-spot registration credential generation
- ✅ Updated pre-registration approval credential generation
- ✅ Installed pdfkit and @types/pdfkit for PDF generation

**Testing Results:**
- ✅ Credential format validated: `coding-mohamed-051` / `azzim051`
- ✅ Counter increment verified: 051 → 061 for sequential participants
- ✅ CSV export: Valid CSV file with proper character escaping
- ✅ PDF export: Professional PDF document generated successfully
- ✅ Participant authentication: Login successful with new credentials
- ✅ Architect approved: Production-ready, no security concerns

**Benefits:**
- Easy for participants to remember credentials
- Still unique (per-event incremental ID)
- Admin can quickly map participant ↔ event credentials
- Removes confusion from long random strings
- Professional export capabilities for distribution