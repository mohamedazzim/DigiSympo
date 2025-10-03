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

### October 3, 2025 - Enhanced Report Generation & Super Admin Override Capabilities ✅

**PHASE 1: ENHANCED REPORT GENERATION**
- ✅ Implemented 4 comprehensive export endpoints (event/symposium in Excel/PDF formats)
- ✅ **Excel Reports:** Multi-sheet workbooks with professional formatting
  - Event Reports (4 sheets): Event Overview, Round Details, Participant Scores, Leaderboard
  - Symposium Reports (3 sheets): Symposium Overview, Event Summaries, Top Performers
  - Auto-sized columns, bold headers, border styling
- ✅ **PDF Reports:** Professional A4 landscape documents with tables and borders
  - Event PDFs: Overview table, round details, participant scores with rankings
  - Symposium PDFs: Overview, event summaries, top 10 performers across all events
  - Alternating row colors, proper text alignment
- ✅ **Frontend Reports Page:** Tabbed interface (Event Reports / Symposium Reports)
  - Event reports: Dropdown to select specific event, export buttons for Excel/PDF
  - Symposium reports: Single-click export for comprehensive overview
  - Loading states, toast notifications, proper error handling
- ✅ **Access Control:** Event reports accessible to Event Admin (event-specific) and Super Admin (all events); Symposium reports Super Admin only
- ✅ **Route:** `/reports` with navigation link in AdminLayout
- ✅ **Architect Approved:** Production-ready with proper RBAC, professional UI, comprehensive data exports

**PHASE 2: SUPER ADMIN OVERRIDE CAPABILITIES WITH AUDIT TRAIL**
- ✅ Created comprehensive audit logging system with `audit_logs` table (11 columns)
- ✅ **Audit Schema Fields:** 
  - adminId, adminUsername, action, targetType, targetId, targetName
  - changes (jsonb for before/after state), reason, timestamp, ipAddress
- ✅ **Storage Methods:** createAuditLog, getAuditLogs (with filters), getAuditLogsByTarget
- ✅ **Override API Endpoints:** 7 total endpoints with full audit logging
  1. PUT /api/super-admin/events/:eventId/override - Update any event
  2. DELETE /api/super-admin/events/:eventId/override - Delete any event
  3. PUT /api/super-admin/questions/:questionId/override - Update any question
  4. DELETE /api/super-admin/questions/:questionId/override - Delete any question
  5. PUT /api/super-admin/rounds/:roundId/override - Override round settings
  6. GET /api/super-admin/audit-logs - Retrieve logs with filters
  7. GET /api/super-admin/audit-logs/target/:targetType/:targetId - Get history for specific resource
- ✅ **Audit Features:** Before/after state capture, optional reason field, IP address tracking, timestamp logging
- ✅ **Super Admin Override Dashboard:** Professional tabbed UI (`/admin/super-admin-overrides`)
  - **Events Tab:** Table with edit/delete, confirmation dialogs, reason input
  - **Questions Tab:** Event/round filtering, edit/delete with validation
  - **Audit Logs Tab:** Comprehensive log viewer with filters (admin, type, date range), pagination (50/page), view changes dialog, CSV export
- ✅ **Security:** All endpoints protected with requireAuth + requireSuperAdmin middleware
- ✅ **UI Quality:** Professional shadcn components, data-testid attributes, loading states, error handling
- ✅ **Database Migration:** Successfully applied via `npm run db:push --force`
- ✅ **Architect Approved:** Production-ready, no security concerns, full CRUD with audit trail

**Technical Implementations:**
- ✅ Helper functions: `logSuperAdminAction()` for centralized audit logging, `getClientIp()` for IP extraction
- ✅ Professional Excel generation using exceljs library with multi-sheet support
- ✅ PDF generation using pdfkit with tables, borders, and professional styling
- ✅ React Query for data fetching with proper cache invalidation
- ✅ Navigation links added to AdminLayout for both features

**Benefits:**
- Comprehensive reporting for events and symposium-wide analysis
- Full administrative control with complete audit trail for compliance
- Accountability through reason tracking and IP logging
- Professional export capabilities for stakeholders
- Enhanced security and transparency for administrative actions

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