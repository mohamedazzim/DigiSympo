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