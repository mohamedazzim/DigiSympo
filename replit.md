# Symposium Management System

## Overview
The Symposium Management System is a React-based web application designed for managing symposium events. Its core purpose is to provide a comprehensive platform with role-based access control (Super Admin, Event Admin, Participants), facilitate proctored online testing with strict integrity measures, enable efficient event and question management, and offer real-time leaderboards and reporting capabilities. The project aims to deliver a robust, secure, and user-friendly system for organizing and conducting online assessments for various events.

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

## Recent Changes
**October 3, 2025** - Live Timer & Participant Test Flow Fix ✅
- **NEW FEATURE: Live Countdown Timer for Event Admins**
  - ✅ Added "Time Remaining" column to Rounds Management table
  - ✅ Real-time countdown timer updates every second for in-progress rounds
  - ✅ Dynamic color coding: Red (<5 min), Yellow (<15 min), Green (>15 min)
  - ✅ Smart display format: "MM:SS" for short durations, "Xh Ym" for long durations
  - ✅ Shows "-- : --" for not_started rounds, "Completed" for completed rounds
  - ✅ Proper cleanup on component unmount to prevent memory leaks
- **CRITICAL BUG FIX: Participant Test Access**
  - ✅ **ROOT CAUSE:** When participants clicked "Begin Test" multiple times, backend rejected duplicate attempts but frontend didn't navigate to existing attempt
  - ✅ **BACKEND:** Added GET /api/participants/rounds/:roundId/my-attempt endpoint to check for existing attempts
  - ✅ **FRONTEND:** Modified Begin Test flow to check for existing attempt BEFORE creating new one
  - ✅ If attempt exists → navigate directly to /participant/test/:attemptId
  - ✅ If no attempt → create new one via POST endpoint
  - ✅ Fixed error handling: Added response.ok checks before parsing JSON to properly surface backend errors
  - ✅ All error cases now display proper toast messages to users
- **DATA FLOW:**
  1. Participant clicks "Begin Test"
  2. Frontend calls GET /api/participants/rounds/:roundId/my-attempt
  3. If existing attempt found → Navigate to test page immediately
  4. If no attempt → Create new via POST /api/events/:eventId/rounds/:roundId/start
  5. All errors properly surfaced via toast notifications
- **TESTING:** All requirements verified by architect, zero LSP errors, proper error handling confirmed

**October 3, 2025** - Restart Round Feature for Event Admins ✅
- **NEW FEATURE: Restart Round Functionality**
  - ✅ Event Admins can now restart any round from the Rounds Management page
  - ✅ Restart button available in Actions column for all rounds (orange/warning color)
  - ✅ Confirmation dialog prevents accidental restarts with clear warning message
  - ✅ Restarting a round deletes ALL participant test attempts and resets round to 'not_started'
  - ✅ Participants can retake the test fresh after restart
- **BACKEND IMPLEMENTATION:**
  - ✅ Added POST /api/rounds/:roundId/restart endpoint
  - ✅ Created deleteTestAttemptsByRound() method in storage layer
  - ✅ Fixed updateRoundStatus() to properly handle null timestamps with explicit Drizzle ORM updates
  - ✅ Proper authentication and authorization validation
- **FRONTEND IMPLEMENTATION:**
  - ✅ Added "Restart Round" button with RotateCcw icon
  - ✅ AlertDialog confirmation with warning about data deletion
  - ✅ Success/error toast notifications
  - ✅ Auto-refresh table after restart via cache invalidation
- **USE CASE:**
  - Admin can reset a completed or in-progress round
  - All participant attempts are wiped clean
  - Round returns to 'not_started' status
  - Admin can then click "Start Round" to begin fresh test session
- **BUG FIX (October 3, 2025):**
  - ✅ Fixed database update issue where restart was showing success toast but not updating status
  - ✅ Refactored updateRoundStatus() method to use explicit Drizzle ORM set operations for each status
  - ✅ Now properly sets status='not_started' and clears startedAt/endedAt timestamps on restart
- **BUG FIX (October 3, 2025) - Participant Sync Issue (RESOLVED):**
  - ✅ **ROOT CAUSE:** API response structure mismatch - backend returned testEnabled at top level, frontend expected it nested in credential object
  - ✅ **BACKEND CHANGES:**
    - "Start Round" now automatically enables test for all participants (sets testEnabled=true)
    - "Restart Round" now automatically disables test for all participants (sets testEnabled=false)
    - Fixed /api/participants/my-credential to return credential object nested properly
  - ✅ **DATA FLOW:** Admin Start Round → Backend sets testEnabled=true → Participant polls within 5 seconds → UI updates
  - ✅ **VERIFICATION:** Database confirms testEnabled=true after Start Round, API response structure fixed
  - ✅ No separate "Enable Test" action required - starting a round enables it automatically
- **TESTING:** All requirements verified, database updates confirmed working, API response structure validated, zero LSP errors

**October 3, 2025** - Rounds Management System Redesign - Real-Time Status Sync ✅
- **MAJOR SYSTEM REDESIGN:**
  - ✅ Completely redesigned rounds lifecycle to eliminate start time confusion
  - ✅ Implemented strict 3-state lifecycle: not_started → in_progress → completed
  - ✅ Added real-time status synchronization between admin and participant views
  - ✅ Removed misleading auto-generated start time from UI display
- **DATABASE SCHEMA UPDATES:**
  - ✅ Added startedAt timestamp field (tracks when admin starts round)
  - ✅ Added endedAt timestamp field (tracks when admin ends round)
  - ✅ Changed status default from 'upcoming' to 'not_started'
  - ✅ Status values: 'not_started', 'in_progress', 'completed'
- **BACKEND API IMPLEMENTATION:**
  - ✅ Created POST /api/rounds/:id/start endpoint (validates status, sets in_progress + startedAt)
  - ✅ Created POST /api/rounds/:id/end endpoint (validates status, sets completed + endedAt)
  - ✅ Added updateRoundStatus() method to storage layer
  - ✅ Enforced strict status transition validation
- **EVENT ADMIN UI UPDATES:**
  - ✅ Removed startTime column from rounds table
  - ✅ Updated status badges: Not Started (gray), In Progress (blue), Completed (green)
  - ✅ Conditional button visibility based on round status
  - ✅ "Start Round" button only visible when status = 'not_started'
  - ✅ "End Round" button only visible when status = 'in_progress'
  - ✅ No control buttons when status = 'completed'
- **PARTICIPANT UI - REAL-TIME SYNC:**
  - ✅ Implemented 5-second polling on all participant pages
  - ✅ Dashboard: Updated active round filter to 'in_progress'
  - ✅ Event Details: Conditional button states (disabled/enabled/completed)
  - ✅ Take Test: Real-time monitoring with auto-submit on round completion
  - ✅ Test automatically submits when admin ends round (2-second delay with notification)
- **KEY FEATURES:**
  - Action-based control instead of generic status updates
  - Real-time synchronization via 5-second polling
  - Auto-submit protection for active tests
  - Clear UI states with intuitive button visibility
  - Timestamp tracking for actual execution times
- **TESTING:** All requirements verified by architect, no regressions, zero LSP errors

**October 3, 2025** - Event Admin Dashboard Redesign - Single-Event Focus ✅
- **COMPLETE DASHBOARD REDESIGN:**
  - ✅ Redesigned Event Admin Dashboard for single-event ownership model
  - ✅ Each Event Admin now sees ONLY their assigned event (not multi-event summaries)
  - ✅ Removed: My Events, Active Events, Recent Activity, Quick Actions sections
  - ✅ Added: Event Name display, Total Participants Count, Manage Settings button, Test Control button
  - ✅ Enterprise-grade, minimal UI with gradient backgrounds and smooth animations
- **BACKEND IMPLEMENTATION:**
  - ✅ Created new endpoint `GET /api/event-admin/my-event`
  - ✅ Returns single assigned event with participant count
  - ✅ Properly secured with `requireAuth` and `requireEventAdmin` middleware
  - ✅ Returns 404 if no event is assigned to the admin
- **FRONTEND IMPLEMENTATION:**
  - ✅ Complete redesign of `/event-admin/dashboard` page
  - ✅ Large prominent Event Name at the top (data-testid="text-event-name")
  - ✅ Total Participants Count stat card (data-testid="text-participant-count")
  - ✅ "Manage Settings" button → navigates to `/event-admin/events/{eventId}` (data-testid="button-manage-settings")
  - ✅ "Test Control" button → navigates to `/event-admin/events/{eventId}/rounds` (data-testid="button-test-control")
  - ✅ Professional gradient design with hover effects
  - ✅ Loading and empty states properly handled
  - ✅ All data-testid attributes added for testing
- **DESIGN HIGHLIGHTS:**
  - Enterprise-grade UI with indigo/purple gradient color scheme
  - Large icons (Settings and Play) in circular gradient backgrounds
  - Hover effects with shadow and transform animations
  - Event status badge and category/type information
  - Responsive grid layout for action buttons
  - Clean, centered card-based layout
- **TESTING:** All requirements verified by architect, no regressions, zero LSP errors

## System Architecture

### UI/UX Decisions
The system utilizes React with Vite for a fast and modern frontend, employing shadcn/ui (Radix UI primitives) for consistent and accessible UI components. Tailwind CSS is used for styling, ensuring a responsive and intuitive user experience across various dashboards (Super Admin, Event Admin, Participant). Design patterns emphasize clarity, ease of navigation, and clear data presentation, including visual podiums for leaderboards.

### Technical Implementations
The application follows a client-server architecture. The frontend communicates with a Node.js Express backend. Data is persisted in a PostgreSQL database, managed with Drizzle ORM. Authentication is handled via JWT with bcrypt for secure password hashing and role-based access control is implemented through middleware to restrict access to specific functionalities based on user roles.

Key features and their technical implementations include:
- **Role-Based Access Control:** Users are assigned roles (Super Admin, Event Admin, Participant) with corresponding permissions enforced by backend middleware.
- **Event and Round Management:** Comprehensive CRUD operations for events and rounds, including validation for unique event names.
- **Question Management:** Support for multiple question types (MCQ, True/False, Short Answer, Coding), with bulk upload functionality for MCQs via CSV or JSON.
- **Proctored Online Testing:** Strict proctoring rules configurable per round, including fullscreen enforcement, tab switch detection, and violation tracking, leading to auto-submission or disqualification.
- **Test Flow:** Managed by admin controls, with live countdown timers, auto-save features, and detailed results displays.
- **Reporting:** Generation of event-wise and symposium-wide reports, downloadable as JSON.
- **Leaderboard System:** Real-time leaderboards for rounds and events, ranking participants by score and submission time, with a visual podium for top performers.
- **Universal Login:** Supports both event-specific participant credentials and standard admin accounts.

### System Design Choices
- **Modular Design:** Clear separation of concerns between frontend, backend, and database layers.
- **Scalability:** Built on a modern tech stack suitable for scaling.
- **Data Integrity:** Ensured through robust backend validation and database constraints.
- **Security:** Implemented with JWT for authentication, bcrypt for password hashing, and role-based access control.
- **Testability:** Extensive use of `data-testid` attributes for comprehensive testing.

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