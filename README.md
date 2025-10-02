# Symposium Management System

A comprehensive React-based web application for managing symposium events with proctored online testing, role-based access control, and real-time performance tracking.

## Features

### Role-Based Access Control
- **Super Admin**: Full system access, event creation, event admin management, system-wide reports
- **Event Admin**: Manage assigned events, configure rounds/questions, monitor participants
- **Participant**: Browse events, register, take proctored tests, view results

### Proctored Online Testing
- **Fullscreen Enforcement**: Mandatory fullscreen mode with user gesture activation
- **Tab Switch Detection**: Automatic tracking and warnings for tab switching
- **Violation Tracking**: Real-time logging of all proctoring violations
- **Auto-Submit**: Automatic test submission on max violations or time expiry
- **Refresh Prevention**: Blocks page refresh and keyboard shortcuts during tests

### Event Management
- Create and manage symposium events
- Configure multiple rounds per event
- Support for various question types (MCQ, True/False, Short Answer, Coding)
- Event-specific proctoring rules configuration
- Participant registration and tracking

### Question Types
- **Multiple Choice**: Single correct answer selection
- **True/False**: Binary choice questions
- **Short Answer**: Text input for brief responses
- **Coding**: Code editor for programming questions

### Automatic Grading
- Instant grading for MCQ and True/False questions
- Score calculation with points system
- Detailed performance analytics
- Question-wise breakdown

### Leaderboard & Rankings
- Real-time leaderboard with participant rankings
- Round-wise and event-wide leaderboards
- Smart ranking: Primary by score, secondary by submission time
- Visual podium display for top 3 performers
- Complete rankings table for all participants
- Accessible directly from test results page

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcrypt
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **UI Components**: Radix UI primitives

## Getting Started

### Prerequisites
- Node.js 18+ 
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

A Super Admin account has been created for testing:

**Super Admin**
- **Username:** `superadmin`
- **Email:** `superadmin@test.com`
- **Password:** `Admin123!`

Use these credentials to log in and access all administrative features including event management, user management, and system-wide reports.

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── layouts/     # Layout components for each role
│   │   ├── pages/       # Page components
│   │   │   ├── admin/       # Super Admin pages
│   │   │   ├── event-admin/ # Event Admin pages
│   │   │   └── participant/ # Participant pages
│   │   └── lib/         # Utilities and helpers
├── server/              # Backend Express application
│   ├── routes.ts        # API endpoint definitions
│   ├── storage.ts       # Database operations
│   └── middleware.ts    # Authentication & authorization
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema with Drizzle
└── db/                  # Database configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Events (Super Admin)
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Event Admin Assignment
- `POST /api/events/:eventId/admins` - Assign admin to event
- `GET /api/events/:eventId/admins` - List event admins

### Rounds
- `GET /api/events/:eventId/rounds` - List rounds
- `POST /api/events/:eventId/rounds` - Create round

### Questions
- `GET /api/rounds/:roundId/questions` - List questions
- `POST /api/rounds/:roundId/questions` - Create question

### Leaderboard
- `GET /api/rounds/:roundId/leaderboard` - Get round rankings
- `GET /api/events/:eventId/leaderboard` - Get event rankings

### Participants
- `POST /api/events/:eventId/participants` - Register for event
- `GET /api/events/:eventId/participants` - List participants

### Test Attempts
- `POST /api/attempts/start` - Start test attempt
- `POST /api/attempts/:id/answers` - Save answer
- `POST /api/attempts/:id/submit` - Submit test
- `POST /api/attempts/:id/violations` - Log violation
- `GET /api/attempts/:id` - Get attempt details
- `GET /api/attempts/user/:userId` - Get user attempts

## User Workflows

### Super Admin
1. Create symposium events
2. Create event admin accounts
3. Assign event admins to events
4. View system-wide reports

### Event Admin
1. Access assigned events
2. Configure event rules and proctoring settings
3. Create rounds with time limits
4. Add questions to rounds
5. Monitor participant registrations
6. View participant performance

### Participant
1. Browse available events
2. Register for events
3. Take proctored tests with:
   - Real-time countdown timer
   - Fullscreen enforcement
   - Violation tracking
4. View test results and performance analytics
5. Review test history

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Server-side authorization checks
- Event-specific access verification
- Protected API endpoints

## Proctoring System

The system implements strict browser-based proctoring:

- **Begin Test Screen**: Requires explicit user gesture to activate fullscreen
- **Fullscreen Lock**: Blocks attempts to exit fullscreen during test
- **Tab Switch Detection**: Counts and warns on tab switches
- **Refresh Prevention**: Prevents page refresh during active tests
- **Violation Warnings**: Shows modal warnings for violations
- **Auto-Submit**: Automatically submits test after max violations
- **Violation Logs**: Complete audit trail for event admins

## Database Schema

The system uses 9 core tables:

1. **users** - User accounts with roles
2. **events** - Symposium events
3. **event_admins** - Admin-to-event assignments
4. **event_rules** - Proctoring configuration
5. **rounds** - Event rounds with timing
6. **questions** - Test questions with answers
7. **participants** - Event registrations
8. **test_attempts** - Test sessions with scoring
9. **answers** - Participant responses

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
```

## Project Status

**Overall Completion: ~95%**

✅ **Completed:**
- Database schema and backend infrastructure
- Authentication and authorization system
- Super Admin Dashboard (100%)
- Event Admin Dashboard (100%)
- Participant Interface (100%)
- Proctoring System (100%)
- Test taking and results
- 25+ API endpoints
- 32+ frontend pages

🔜 **Future Enhancements:**
- Leaderboard system for event rankings
- Advanced report generation (PDF/Excel export)
- Email notifications
- Advanced analytics dashboard
- Automated certificate generation

## License

This project is proprietary and confidential.

## Support

For issues or questions, please contact the development team.
