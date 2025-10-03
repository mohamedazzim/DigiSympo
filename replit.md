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