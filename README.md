# Symposium Management System

A comprehensive React-based web application for managing symposium events with proctored online testing, dynamic registration forms, role-based access control, and real-time performance tracking.

## Features

### Role-Based Access Control
- **Super Admin**: Full system access, event creation, event admin management, registration forms, system-wide reports
- **Event Admin**: Manage assigned events, configure rounds/questions, monitor participants, view event credentials
- **Registration Committee**: Review and approve participant registrations, generate credentials, download participant lists
- **Participant**: Login with event-specific credentials, view rules and regulations, take proctored tests with admin-controlled access

### Dynamic Registration System
- **Google Forms-Style Builder**: Create custom registration forms with drag-and-drop field builder
- **Event Categories**: Technical and Non-Technical event classification
- **Smart Event Selection**: Participants can select one technical + one non-technical event
- **Time Overlap Prevention**: Automatic detection and prevention of conflicting event times
- **Input Validation**: Email (RFC 5322) and mobile number (Indian 10-digit) validation
- **Real-time Preview**: Live form preview with always-visible placeholders
- **Public Registration Links**: Shareable URLs for participant registration

### Registration Committee Features
- **Approval Workflow**: Review and approve/decline registration submissions
- **Credential Generation**: Automatic account creation with main and event-specific credentials
- **Approved Participants Dashboard**: Real-time list of all approved participants
- **Export Functionality**: Download approved participant lists as text files
- **Event Name Resolution**: Display event names (not IDs) throughout the interface

### Participant Authentication System
- **Event-Specific Credentials Only**: Participants login exclusively with event credentials (no main account access)
- **Credential Generation**: Username and password generated during registration approval
- **Single Event Access**: Each credential grants access to one specific event only
- **Printable Lists**: Event admins can view, export, and print participant credentials with signature columns
- **CSV Export**: Downloadable CSV files for attendance tracking

### Simplified Participant Experience
- **Streamlined Dashboard**: Clean interface displaying Symposium | Event Name | Participant Name
- **Rules & Regulations**: Event/round rules displayed prominently before test access
- **Agreement Requirement**: "I agree" checkbox must be accepted before proceeding
- **Admin-Controlled Test Access**: "Begin Test" button enabled only when event admin permits
- **No Navigation Menu**: Focused, distraction-free experience without event browsing or history
- **Single-Purpose Interface**: Designed exclusively for taking the assigned test

### Event Admin Test Control
- **Enable/Disable Test Access**: Grant or revoke test access for individual participants
- **Test Enablement Status**: View which participants have been granted test access
- **Real-time Control**: Instantly enable/disable tests during the event
- **Participant Management**: Monitor test enablement status from credentials dashboard
- **Flexible Administration**: Control test timing independently for each participant

### Strict Proctored Online Testing
- **Fullscreen Enforcement**: Mandatory fullscreen mode with user gesture activation, strictly enforced throughout test
- **Back Button Blocking**: Prevents browser back navigation during active tests
- **Refresh Prevention**: Blocks page refresh (F5, Ctrl+R, Cmd+R) and all refresh shortcuts
- **Tab Switch Detection**: Automatic tracking and violation warnings for tab switching attempts
- **Window/Tab Close Protection**: Blocks Ctrl+W, Cmd+W, and other closing shortcuts
- **Keyboard Shortcut Blocking**: Disables all potentially disruptive keyboard shortcuts during test
- **Violation Tracking**: Real-time logging of all proctoring violations with timestamps
- **Auto-Submit on Violations**: Automatic test submission when max violations reached
- **Timer Auto-Submit**: Automatic submission when time expires
- **Round-Specific Rules**: Configure proctoring rules per round (overrides event-level rules)

### Event Management
- **Create and manage symposium events with categories**
- **Duplicate event name validation**
- **Configure multiple rounds per event**
- **Support for various question types (MCQ, True/False, Short Answer, Coding)**
- **Event and round-specific proctoring rules**
- **Participant registration and tracking**
- **Bulk question upload (CSV/JSON)**

### Question Types
- **Multiple Choice**: Single correct answer selection with 4 options
- **True/False**: Binary choice questions
- **Short Answer**: Text input for brief responses
- **Coding**: Code editor for programming questions

### Bulk Question Upload
- **CSV Upload**: Upload multiple MCQ questions via CSV file
  - Format: questionNumber, questionText, points, option1-4, correctAnswer
- **JSON Upload**: Upload questions via JSON array
- **Preview & Validation**: Review questions before final upload
- **Duplicate Detection**: Prevents duplicate question numbers

### Automatic Grading
- **Instant grading for MCQ and True/False questions**
- **Score calculation with points system**
- **Detailed performance analytics**
- **Question-wise breakdown**
- **Validation indicators (✅/❌)**

### Leaderboard & Rankings
- **Real-time leaderboard with participant rankings**
- **Round-wise and event-wide leaderboards**
- **Smart ranking**: Primary by score, secondary by submission time (earlier = higher)
- **Visual podium display for top 3 performers**
- **Complete rankings table for all participants**
- **Accessible directly from test results page**

### Report Generation
- **Event-wise Reports**: Individual event performance and statistics
- **Symposium-wide Reports**: Cross-event analytics and rankings
- **JSON Export**: Downloadable report data
- **Comprehensive Metrics**: Participants, scores, violations, completion rates

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Authentication**: JWT with bcrypt
- **State Management**: TanStack Query v5 (React Query)
- **Routing**: Wouter
- **UI Components**: Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
```

4. Push database schema:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Test Credentials

### Super Admin
- **Username:** `superadmin`
- **Email:** `superadmin@test.com`
- **Password:** `Admin123!`

### Registration Committee (Example)
- **Username:** `azzi`
- **Password:** `123123`

Use these credentials to test different role functionalities.

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── layouts/     # Layout components for each role
│   │   ├── pages/       # Page components
│   │   │   ├── admin/              # Super Admin pages
│   │   │   ├── event-admin/        # Event Admin pages
│   │   │   ├── participant/        # Participant pages
│   │   │   ├── registration-committee/  # Registration Committee pages
│   │   │   └── public/             # Public registration forms
│   │   └── lib/         # Utilities and helpers
├── server/              # Backend Express application
│   ├── routes.ts        # API endpoint definitions (39+ endpoints)
│   ├── storage.ts       # Database operations
│   └── middleware/      # Authentication & authorization
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema with Drizzle (14 tables)
└── db/                  # Database configuration
```

## API Endpoints (39+)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Events (Super Admin & Registration Committee)
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `GET /api/events/:id` - Get event details
- `POST /api/events/check-name` - Validate unique event name

### Registration Forms (Super Admin)
- `GET /api/registration-forms/all` - List all forms
- `POST /api/registration-forms` - Create form
- `PATCH /api/registration-forms/:id` - Update form
- `GET /api/registration-forms/:slug` - Get form by slug (public)
- `GET /api/events/for-registration` - Get events for active form (public)
- `POST /api/registration-forms/:slug/submit` - Submit registration (public)

### Registrations (Registration Committee)
- `GET /api/registrations` - List all registrations
- `PATCH /api/registrations/:id/approve` - Approve registration and generate credentials

### Event Admin Assignment
- `POST /api/events/:eventId/admins` - Assign admin to event
- `GET /api/events/:eventId/admins` - List event admins

### Event Rules & Round Rules
- `GET /api/events/:eventId/rules` - Get event proctoring rules
- `PATCH /api/events/:eventId/rules` - Update event rules
- `GET /api/rounds/:roundId/rules` - Get round-specific rules
- `PATCH /api/rounds/:roundId/rules` - Update round rules
- `POST /api/rounds/backfill-rules` - Backfill rules for legacy rounds

### Rounds
- `GET /api/events/:eventId/rounds` - List rounds
- `POST /api/events/:eventId/rounds` - Create round

### Questions
- `GET /api/rounds/:roundId/questions` - List questions
- `POST /api/rounds/:roundId/questions` - Create question
- `POST /api/rounds/:roundId/questions/bulk` - Bulk upload MCQ questions

### Leaderboard
- `GET /api/rounds/:roundId/leaderboard` - Get round rankings
- `GET /api/events/:eventId/leaderboard` - Get event rankings

### Participants & Credentials
- `POST /api/events/:eventId/participants` - Register for event
- `GET /api/events/:eventId/participants` - List participants
- `GET /api/events/:eventId/event-credentials` - Get event-specific credentials (CSV export)
- `GET /api/participants/my-registrations` - Get participant's registered events
- `GET /api/participants/my-credential` - Get current participant's event credential
- `PATCH /api/event-credentials/:id/enable-test` - Enable test access for participant
- `PATCH /api/event-credentials/:id/disable-test` - Disable test access for participant
- `GET /api/events/:eventId/credentials-status` - Get test enablement status for all participants

### Test Attempts
- `POST /api/attempts/start` - Start test attempt
- `POST /api/attempts/:id/answers` - Save answer
- `POST /api/attempts/:id/submit` - Submit test
- `POST /api/attempts/:id/violations` - Log violation
- `GET /api/attempts/:id` - Get attempt details
- `GET /api/attempts/user/:userId` - Get user attempts

### Reports (Super Admin)
- `POST /api/reports/event/:eventId` - Generate event report
- `POST /api/reports/symposium` - Generate symposium-wide report
- `GET /api/reports/:id` - Download report

### Admin Management
- `GET /api/users` - List all users
- `PATCH /api/users/:id/credentials` - Update user credentials
- `GET /api/admin/orphaned-admins` - List orphaned event admins

## User Workflows

### Super Admin
1. Create symposium events with categories (Technical/Non-Technical)
2. Create dynamic registration forms with custom fields
3. Manage event categories and allowed selections
4. Create event admin and registration committee accounts
5. Assign event admins to events
6. View system-wide reports

### Registration Committee
1. Access registrations dashboard
2. Review submitted registrations (name, email, events)
3. Approve registrations to generate credentials:
   - Main account credentials (username, password, email)
   - Event-specific credentials per selected event
4. View approved participants dashboard
5. Download approved participant lists

### Event Admin
1. Access assigned events
2. Configure event rules and proctoring settings
3. Create rounds with time limits and round-specific rules
4. Add questions (manually or bulk upload CSV/JSON)
5. Monitor participant registrations
6. View and export participant credentials with signature columns
7. Enable/disable test access for individual participants
8. Monitor test enablement status across all participants
9. View participant performance

### Participant
1. Access public registration form via shareable link
2. Fill personal information with validated inputs
3. Select events (1 technical + 1 non-technical)
4. View time overlap warnings
5. Submit registration for approval
6. Receive event-specific credentials after approval
7. Login using event credentials (username/password)
8. View simplified dashboard with Symposium | Event Name | Participant Name
9. Read event and round rules & regulations
10. Accept agreement by checking "I agree" checkbox
11. Wait for event admin to enable test access
12. Click "Begin Test" button when enabled by admin
13. Complete proctored test with strict enforcement:
    - Real-time countdown timer
    - Mandatory fullscreen mode
    - Back button blocking
    - Refresh prevention
    - Tab switch detection
    - Keyboard shortcut blocking
    - Automatic violation tracking
    - Auto-submit on max violations or time expiry

## Security Features

- JWT-based authentication with secure token handling
- Role-based access control (RBAC) with 4 distinct roles
- Password hashing with bcrypt (salt rounds: 10)
- Server-side authorization checks on all protected endpoints
- Event-specific access verification
- Input validation (email, phone, form fields)
- Protection against duplicate event names
- Secure credential generation with nanoid

## Proctoring System

The system implements strict browser-based proctoring with configurable rules:

### Event-Level Rules (Default)
- Configured by event admins for the entire event
- Applied to all rounds unless overridden

### Round-Level Rules (Override)
- Configure specific rules per round
- Overrides event-level settings for that round
- Lazy creation: Auto-generated on first access

### Strict Proctoring Features
- **Begin Test Screen**: Requires explicit user gesture to activate fullscreen
- **Fullscreen Lock**: Blocks all attempts to exit fullscreen during test
- **Back Button Blocking**: Prevents browser back navigation completely
- **Refresh Prevention**: Blocks F5, Ctrl+R, Cmd+R, and all refresh attempts
- **Tab Switch Detection**: Counts and warns on tab switches (configurable limit)
- **Window Close Protection**: Blocks Ctrl+W, Cmd+W, and other closing shortcuts
- **Keyboard Shortcut Blocking**: Disables all potentially disruptive shortcuts
- **Violation Warnings**: Shows modal warnings for all violations
- **Auto-Submit on Violations**: Automatically submits after max violations (configurable)
- **Timer Auto-Submit**: Automatic submission when time expires
- **Violation Logs**: Complete audit trail with timestamps for event admins

### Configurable Options
- No Refresh (true/false)
- No Tab Switch (true/false)
- Force Fullscreen (true/false)
- Disable Shortcuts (true/false)
- Auto Submit on Violation (true/false)
- Max Tab Switch Warnings (integer)
- Additional Rules (text)

## Database Schema (14 Tables)

1. **users** - User accounts with roles (super_admin, event_admin, registration_committee, participant)
2. **events** - Symposium events with categories and status
3. **event_admins** - Admin-to-event assignments
4. **event_rules** - Event-level proctoring configuration
5. **rounds** - Event rounds with timing and status
6. **round_rules** - Round-specific proctoring configuration
7. **questions** - Test questions with answers
8. **participants** - Event registrations
9. **test_attempts** - Test sessions with scoring
10. **answers** - Participant responses
11. **registration_forms** - Dynamic registration forms
12. **registrations** - Form submissions pending approval
13. **event_credentials** - Event-specific login credentials with test access control (testEnabled, enabledAt, enabledBy)
14. **reports** - Generated reports

## Data Integrity and Management

### Cascade Delete Behavior

**When an event is deleted:**
- Event admin assignments
- Event-specific rules
- All rounds (and their rules, questions, attempts, answers)
- Participant registrations
- Event credentials
- Event-specific reports

**Important Notes:**
- Admin user accounts persist for reassignment
- Creator information preserved (set to null)
- Report generator information preserved

### Validation Rules
- **Event Names**: Must be unique across the system
- **Email**: RFC 5322 compliant format
- **Phone**: Indian mobile format (10 digits, starts with 6-9)
- **Event Selection**: Max 1 technical + 1 non-technical
- **Time Conflicts**: Automatic detection and prevention
- **Category Enforcement**: Backend validation of allowed categories

## Registration Form System

### Form Builder
- **Dynamic Fields**: text, email, tel, textarea
- **Required/Optional**: Configure field requirements
- **Placeholders**: Helpful input hints
- **Live Preview**: Real-time form preview with blue header
- **Unique Slugs**: Auto-generated shareable URLs

### Event Selection Logic
```
Allowed Categories → Filter Events → Prevent Overlaps → Validate Backend
```

### Security
- Frontend filtering by allowed categories
- Backend validation of selected events
- Category permission enforcement
- Overlap detection across rounds

## Testing Status

**Comprehensive testing completed:**
- ✅ 183+ tests passing
- ✅ All API endpoints verified
- ✅ Registration flow end-to-end tested
- ✅ Proctoring system validated
- ✅ Leaderboard rankings verified
- ✅ Report generation functional

**System Status:** 100% Functional and Production-Ready 🎉

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Database Migrations
```bash
npm run db:push
# or for force push (data loss warning):
npm run db:push --force
```

### Common Development Tasks

**Create a new registration form:**
1. Login as Super Admin
2. Navigate to Registration Forms → Create
3. Add custom fields
4. Select allowed event categories
5. Publish and share the form link

**Approve registrations:**
1. Login as Registration Committee
2. View pending registrations
3. Review submission details
4. Click Approve to generate credentials
5. Share credentials with participant

**Configure proctoring:**
1. Login as Event Admin
2. Navigate to event → Configure Rules
3. Set event-level defaults
4. Navigate to specific round → Configure Rules
5. Override with round-specific settings

## Project Status

**Overall Completion: 100% ✅**

### Completed Features:
- ✅ Database schema (14 tables)
- ✅ Backend API (39+ endpoints)
- ✅ Authentication & authorization
- ✅ Super Admin Dashboard
- ✅ Event Admin Dashboard
- ✅ Registration Committee Dashboard
- ✅ Simplified Participant Interface
- ✅ Event-Specific Participant Authentication
- ✅ Admin-Controlled Test Access
- ✅ Test Enablement Management
- ✅ Dynamic Registration Forms
- ✅ Event Credentials System
- ✅ Strict Proctoring System (event & round-level)
- ✅ Browser Control & Violation Tracking
- ✅ Leaderboard & Rankings
- ✅ Report Generation
- ✅ Bulk Question Upload
- ✅ Input Validation
- ✅ Export/Download Functionality

### Optional Future Enhancements:
- Email notifications for registration approval
- PDF report generation
- Advanced analytics dashboard
- Automated certificate generation
- Mobile app support
- Multi-language support

## Known Issues & Workarounds

### Replit Preview Tab
- **Issue**: Preview tab may show routing errors due to PHP port conflicts
- **Workaround**: Use direct URL or "Open in app" button
- **Direct URL Format**: `https://[repl-id].replit.dev/`

## Support & Documentation

For detailed technical documentation, see:
- `replit.md` - Project overview and recent changes
- `FINAL_TEST_REPORT.md` - Comprehensive test results
- `TEST_SUMMARY.md` - API test results

## License

This project is proprietary and confidential.

## Contributors

Developed for symposium event management with focus on security, integrity, and user experience.
