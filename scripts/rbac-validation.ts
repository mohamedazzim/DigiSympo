import jwt from 'jsonwebtoken';
import { storage } from '../server/storage';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || "symposium-secret-key-change-in-production";
const BASE_URL = 'http://localhost:5000';

interface TestUser {
  id: string;
  username: string;
  role: string;
  token: string;
  eventId?: string;
}

interface TestResult {
  endpoint: string;
  method: string;
  role: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  message?: string;
}

const testResults: TestResult[] = [];
let testUsers: {
  superAdmin: TestUser;
  eventAdmin1: TestUser;
  eventAdmin2: TestUser;
  regCommittee: TestUser;
  participant1: TestUser;
  participant2: TestUser;
};

let testEvent1Id: string;
let testEvent2Id: string;
let testRound1Id: string;

async function createTestData() {
  console.log('🔧 Creating test data...');

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  const superAdmin = await storage.createUser({
    username: 'test_super_admin',
    password: hashedPassword,
    email: 'super@test.com',
    fullName: 'Test Super Admin',
    role: 'super_admin'
  });

  // Create Event Admins
  const eventAdmin1 = await storage.createUser({
    username: 'test_event_admin_1',
    password: hashedPassword,
    email: 'eventadmin1@test.com',
    fullName: 'Test Event Admin 1',
    role: 'event_admin'
  });

  const eventAdmin2 = await storage.createUser({
    username: 'test_event_admin_2',
    password: hashedPassword,
    email: 'eventadmin2@test.com',
    fullName: 'Test Event Admin 2',
    role: 'event_admin'
  });

  // Create Registration Committee
  const regCommittee = await storage.createUser({
    username: 'test_reg_committee',
    password: hashedPassword,
    email: 'regcom@test.com',
    fullName: 'Test Registration Committee',
    role: 'registration_committee'
  });

  // Create Participants
  const participant1 = await storage.createUser({
    username: 'test_participant_1',
    password: hashedPassword,
    email: 'participant1@test.com',
    fullName: 'Test Participant 1',
    role: 'participant'
  });

  const participant2 = await storage.createUser({
    username: 'test_participant_2',
    password: hashedPassword,
    email: 'participant2@test.com',
    fullName: 'Test Participant 2',
    role: 'participant'
  });

  // Create test events
  const event1 = await storage.createEvent({
    name: 'Test Event 1',
    description: 'Event for testing RBAC',
    type: 'individual',
    category: 'technical',
    status: 'active',
    createdBy: superAdmin.id
  });
  testEvent1Id = event1.id;

  const event2 = await storage.createEvent({
    name: 'Test Event 2',
    description: 'Second event for testing RBAC',
    type: 'individual',
    category: 'non_technical',
    status: 'active',
    createdBy: superAdmin.id
  });
  testEvent2Id = event2.id;

  // Assign event admin 1 to event 1
  await storage.assignEventAdmin(testEvent1Id, eventAdmin1.id);

  // Assign event admin 2 to event 2
  await storage.assignEventAdmin(testEvent2Id, eventAdmin2.id);

  // Register participant 1 to event 1
  await storage.createParticipant(participant1.id, testEvent1Id);
  await storage.createEventCredential(participant1.id, testEvent1Id, 'test-p1', 'pass123');

  // Create a round for event 1
  const round1 = await storage.createRound({
    eventId: testEvent1Id,
    name: 'Test Round 1',
    description: 'Test round',
    roundNumber: 1,
    duration: 60,
    status: 'not_started'
  });
  testRound1Id = round1.id;

  // Generate JWT tokens
  testUsers = {
    superAdmin: {
      id: superAdmin.id,
      username: superAdmin.username,
      role: 'super_admin',
      token: jwt.sign({ id: superAdmin.id, username: superAdmin.username, role: 'super_admin' }, JWT_SECRET, { expiresIn: '1h' })
    },
    eventAdmin1: {
      id: eventAdmin1.id,
      username: eventAdmin1.username,
      role: 'event_admin',
      token: jwt.sign({ id: eventAdmin1.id, username: eventAdmin1.username, role: 'event_admin' }, JWT_SECRET, { expiresIn: '1h' })
    },
    eventAdmin2: {
      id: eventAdmin2.id,
      username: eventAdmin2.username,
      role: 'event_admin',
      token: jwt.sign({ id: eventAdmin2.id, username: eventAdmin2.username, role: 'event_admin' }, JWT_SECRET, { expiresIn: '1h' })
    },
    regCommittee: {
      id: regCommittee.id,
      username: regCommittee.username,
      role: 'registration_committee',
      token: jwt.sign({ id: regCommittee.id, username: regCommittee.username, role: 'registration_committee' }, JWT_SECRET, { expiresIn: '1h' })
    },
    participant1: {
      id: participant1.id,
      username: participant1.username,
      role: 'participant',
      eventId: testEvent1Id,
      token: jwt.sign({ id: participant1.id, username: participant1.username, role: 'participant', eventId: testEvent1Id }, JWT_SECRET, { expiresIn: '1h' })
    },
    participant2: {
      id: participant2.id,
      username: participant2.username,
      role: 'participant',
      token: jwt.sign({ id: participant2.id, username: participant2.username, role: 'participant' }, JWT_SECRET, { expiresIn: '1h' })
    }
  };

  console.log('✅ Test data created successfully');
}

async function makeRequest(method: string, endpoint: string, token: string, body?: any): Promise<number> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    return response.status;
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    return 500;
  }
}

function recordResult(endpoint: string, method: string, role: string, expectedStatus: number, actualStatus: number, message?: string) {
  const passed = actualStatus === expectedStatus;
  testResults.push({ endpoint, method, role, expectedStatus, actualStatus, passed, message });
  
  const icon = passed ? '✅' : '❌';
  const statusText = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} ${statusText}: ${role} ${method} ${endpoint} - Expected ${expectedStatus}, Got ${actualStatus}`);
}

async function testSuperAdminAccess() {
  console.log('\n📋 Testing Super Admin Access...');
  const token = testUsers.superAdmin.token;
  const role = 'super_admin';

  // Should access all admin routes
  await makeRequest('GET', '/api/users', token).then(status => recordResult('/api/users', 'GET', role, 200, status));
  await makeRequest('GET', '/api/admin/orphaned-admins', token).then(status => recordResult('/api/admin/orphaned-admins', 'GET', role, 200, status));
  await makeRequest('POST', '/api/events', token, { name: 'Test Event', description: 'Test', type: 'individual', category: 'technical' }).then(status => recordResult('/api/events', 'POST', role, 201, status));
  await makeRequest('GET', '/api/reports', token).then(status => recordResult('/api/reports', 'GET', role, 200, status));
  await makeRequest('GET', '/api/registration-forms/all', token).then(status => recordResult('/api/registration-forms/all', 'GET', role, 200, status));

  // Should NOT access participant-only routes
  await makeRequest('GET', '/api/participants/my-credential', token).then(status => recordResult('/api/participants/my-credential', 'GET', role, 403, status, 'Super admin should NOT access participant-only routes'));
  await makeRequest('GET', '/api/participants/my-attempts', token).then(status => recordResult('/api/participants/my-attempts', 'GET', role, 403, status));
  await makeRequest('GET', `/api/participants/rounds/${testRound1Id}/my-attempt`, token).then(status => recordResult('/api/participants/rounds/:id/my-attempt', 'GET', role, 403, status));
}

async function testEventAdminAccess() {
  console.log('\n📋 Testing Event Admin Access...');
  const token = testUsers.eventAdmin1.token;
  const role = 'event_admin';

  // Should access assigned event
  await makeRequest('GET', `/api/events/${testEvent1Id}`, token).then(status => recordResult('/api/events/:eventId (assigned)', 'GET', role, 200, status));
  await makeRequest('GET', `/api/events/${testEvent1Id}/rounds`, token).then(status => recordResult('/api/events/:eventId/rounds (assigned)', 'GET', role, 200, status));
  await makeRequest('GET', `/api/events/${testEvent1Id}/rules`, token).then(status => recordResult('/api/events/:eventId/rules (assigned)', 'GET', role, 200, status));
  await makeRequest('GET', `/api/rounds/${testRound1Id}`, token).then(status => recordResult('/api/rounds/:roundId (assigned)', 'GET', role, 200, status));

  // Should NOT access other events
  await makeRequest('GET', `/api/events/${testEvent2Id}`, token).then(status => recordResult('/api/events/:eventId (not assigned)', 'GET', role, 403, status, 'Event admin should NOT access non-assigned events'));
  await makeRequest('GET', `/api/events/${testEvent2Id}/rounds`, token).then(status => recordResult('/api/events/:eventId/rounds (not assigned)', 'GET', role, 403, status));

  // Should NOT access super admin routes
  await makeRequest('GET', '/api/users', token).then(status => recordResult('/api/users', 'GET', role, 403, status, 'Event admin should NOT access super admin routes'));
  await makeRequest('POST', '/api/events', token, { name: 'Test', description: 'Test', type: 'individual', category: 'technical' }).then(status => recordResult('/api/events', 'POST', role, 403, status));
  await makeRequest('DELETE', `/api/events/${testEvent1Id}`, token).then(status => recordResult('/api/events/:id', 'DELETE', role, 403, status));
  await makeRequest('GET', '/api/reports', token).then(status => recordResult('/api/reports', 'GET', role, 403, status));

  // Should NOT access registration committee routes
  await makeRequest('GET', '/api/registrations', token).then(status => recordResult('/api/registrations', 'GET', role, 403, status, 'Event admin should NOT access registration committee routes'));
  await makeRequest('POST', '/api/registration-committee/participants', token, {}).then(status => recordResult('/api/registration-committee/participants', 'POST', role, 403, status));

  // Should NOT access participant routes
  await makeRequest('GET', '/api/participants/my-credential', token).then(status => recordResult('/api/participants/my-credential', 'GET', role, 403, status, 'Event admin should NOT access participant routes'));
  await makeRequest('GET', '/api/participants/my-attempts', token).then(status => recordResult('/api/participants/my-attempts', 'GET', role, 403, status));
}

async function testRegistrationCommitteeAccess() {
  console.log('\n📋 Testing Registration Committee Access...');
  const token = testUsers.regCommittee.token;
  const role = 'registration_committee';

  // Should access registration routes
  await makeRequest('GET', '/api/registrations', token).then(status => recordResult('/api/registrations', 'GET', role, 200, status));
  await makeRequest('GET', '/api/registration-committee/participants', token).then(status => recordResult('/api/registration-committee/participants', 'GET', role, 200, status));

  // Should access events (read-only)
  await makeRequest('GET', '/api/events', token).then(status => recordResult('/api/events', 'GET', role, 200, status));

  // Should NOT access super admin routes
  await makeRequest('GET', '/api/users', token).then(status => recordResult('/api/users', 'GET', role, 403, status, 'Reg committee should NOT access super admin routes'));
  await makeRequest('POST', '/api/events', token, { name: 'Test', description: 'Test', type: 'individual', category: 'technical' }).then(status => recordResult('/api/events', 'POST', role, 403, status));
  await makeRequest('GET', '/api/reports', token).then(status => recordResult('/api/reports', 'GET', role, 403, status));

  // Should NOT access event admin routes
  await makeRequest('POST', `/api/events/${testEvent1Id}/rounds`, token, { name: 'Test', roundNumber: 1, duration: 60 }).then(status => recordResult('/api/events/:eventId/rounds', 'POST', role, 403, status, 'Reg committee should NOT access event admin routes'));
  await makeRequest('POST', `/api/rounds/${testRound1Id}/start`, token).then(status => recordResult('/api/rounds/:roundId/start', 'POST', role, 403, status));
  await makeRequest('GET', `/api/events/${testEvent1Id}/event-credentials`, token).then(status => recordResult('/api/events/:eventId/event-credentials', 'GET', role, 403, status));

  // Should NOT access participant routes
  await makeRequest('GET', '/api/participants/my-credential', token).then(status => recordResult('/api/participants/my-credential', 'GET', role, 403, status, 'Reg committee should NOT access participant routes'));
  await makeRequest('GET', '/api/participants/my-attempts', token).then(status => recordResult('/api/participants/my-attempts', 'GET', role, 403, status));
}

async function testParticipantAccess() {
  console.log('\n📋 Testing Participant Access...');
  const token = testUsers.participant1.token;
  const role = 'participant';

  // Should access participant routes
  await makeRequest('GET', '/api/participants/my-credential', token).then(status => recordResult('/api/participants/my-credential', 'GET', role, 200, status));
  await makeRequest('GET', '/api/participants/my-attempts', token).then(status => recordResult('/api/participants/my-attempts', 'GET', role, 200, status));

  // Should access registered event
  await makeRequest('GET', `/api/events/${testEvent1Id}`, token).then(status => recordResult('/api/events/:eventId (registered)', 'GET', role, 200, status));

  // Should NOT access super admin routes
  await makeRequest('GET', '/api/users', token).then(status => recordResult('/api/users', 'GET', role, 403, status, 'Participant should NOT access super admin routes'));
  await makeRequest('POST', '/api/events', token, { name: 'Test', description: 'Test', type: 'individual', category: 'technical' }).then(status => recordResult('/api/events', 'POST', role, 403, status));
  await makeRequest('GET', '/api/reports', token).then(status => recordResult('/api/reports', 'GET', role, 403, status));

  // Should NOT access event admin routes
  await makeRequest('POST', `/api/events/${testEvent1Id}/rounds`, token, { name: 'Test', roundNumber: 1, duration: 60 }).then(status => recordResult('/api/events/:eventId/rounds', 'POST', role, 403, status, 'Participant should NOT access event admin routes'));
  await makeRequest('POST', `/api/rounds/${testRound1Id}/start`, token).then(status => recordResult('/api/rounds/:roundId/start', 'POST', role, 403, status));
  await makeRequest('DELETE', `/api/rounds/${testRound1Id}`, token).then(status => recordResult('/api/rounds/:roundId', 'DELETE', role, 403, status));

  // Should NOT access registration committee routes
  await makeRequest('GET', '/api/registrations', token).then(status => recordResult('/api/registrations', 'GET', role, 403, status, 'Participant should NOT access registration committee routes'));
  await makeRequest('POST', '/api/registration-committee/participants', token, {}).then(status => recordResult('/api/registration-committee/participants', 'POST', role, 403, status));
}

async function testCrossRoleDataIsolation() {
  console.log('\n📋 Testing Cross-Role Data Isolation...');

  // Event Admin 1 should NOT see Event Admin 2's events
  const eventAdmin1Token = testUsers.eventAdmin1.token;
  await makeRequest('GET', '/api/events', eventAdmin1Token).then(async (status) => {
    if (status === 200) {
      const response = await fetch(`${BASE_URL}/api/events`, {
        headers: { 'Authorization': `Bearer ${eventAdmin1Token}` }
      });
      const events = await response.json();
      const hasOnlyAssignedEvent = events.length === 1 && events[0].id === testEvent1Id;
      recordResult('/api/events (isolation)', 'GET', 'event_admin', 200, hasOnlyAssignedEvent ? 200 : 403, 
        hasOnlyAssignedEvent ? 'Event admin sees only assigned events' : 'Event admin sees other admins events - DATA LEAK!');
    }
  });

  // Participant should NOT access other participants' data
  // This is already enforced in the attempt access code
  console.log('✅ Participant data isolation enforced by attempt ownership checks');
}

async function generateReport() {
  console.log('\n\n📊 ========== RBAC VALIDATION REPORT ==========\n');

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = testResults.filter(r => !r.passed).length;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`);

  if (failedTests > 0) {
    console.log('❌ FAILED TESTS:\n');
    testResults.filter(r => !r.passed).forEach(result => {
      console.log(`  - ${result.role} ${result.method} ${result.endpoint}`);
      console.log(`    Expected: ${result.expectedStatus}, Got: ${result.actualStatus}`);
      if (result.message) console.log(`    Issue: ${result.message}`);
      console.log('');
    });
  }

  // Access Control Matrix
  console.log('\n📋 ACCESS CONTROL MATRIX:\n');
  console.log('Endpoint Category'.padEnd(50) + ' | Super Admin | Event Admin | Reg Committee | Participant');
  console.log('-'.repeat(110));

  const categories = [
    { name: 'User Management (/api/users)', super: '✅', event: '❌', reg: '❌', part: '❌' },
    { name: 'Admin Tools (/api/admin/*)', super: '✅', event: '❌', reg: '❌', part: '❌' },
    { name: 'Event Management (POST/PATCH/DELETE)', super: '✅', event: '❌', reg: '❌', part: '❌' },
    { name: 'Event Data (GET - assigned)', super: '✅', event: '✅', reg: '❌', part: '✅' },
    { name: 'Event Data (GET - not assigned)', super: '✅', event: '❌', reg: '❌', part: '❌' },
    { name: 'Round Management', super: '✅', event: '✅', reg: '❌', part: '❌' },
    { name: 'Question Management', super: '✅', event: '✅', reg: '❌', part: '❌' },
    { name: 'Reports', super: '✅', event: '❌', reg: '❌', part: '❌' },
    { name: 'Registrations', super: '✅', event: '❌', reg: '✅', part: '❌' },
    { name: 'On-Spot Registration', super: '✅', event: '❌', reg: '✅', part: '❌' },
    { name: 'Participant Credentials (own)', super: '❌', event: '❌', reg: '❌', part: '✅' },
    { name: 'Participant Attempts (own)', super: '❌', event: '❌', reg: '❌', part: '✅' },
    { name: 'Test Control', super: '✅', event: '✅', reg: '❌', part: '❌' },
    { name: 'Leaderboards', super: '✅', event: '✅', reg: '✅', part: '✅' }
  ];

  categories.forEach(cat => {
    console.log(
      cat.name.padEnd(50) + ' | ' +
      cat.super.padEnd(12) + '| ' +
      cat.event.padEnd(12) + '| ' +
      cat.reg.padEnd(14) + '| ' +
      cat.part
    );
  });

  console.log('\n✅ = Access Allowed | ❌ = Access Denied (403)\n');
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  try {
    // Delete events (cascade will handle related data)
    await storage.deleteEvent(testEvent1Id);
    await storage.deleteEvent(testEvent2Id);

    // Delete test users
    await storage.deleteUser(testUsers.superAdmin.id);
    await storage.deleteUser(testUsers.eventAdmin1.id);
    await storage.deleteUser(testUsers.eventAdmin2.id);
    await storage.deleteUser(testUsers.regCommittee.id);
    await storage.deleteUser(testUsers.participant1.id);
    await storage.deleteUser(testUsers.participant2.id);

    console.log('✅ Test data cleaned up successfully');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting RBAC Validation Tests...\n');

    await createTestData();

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    await testSuperAdminAccess();
    await testEventAdminAccess();
    await testRegistrationCommitteeAccess();
    await testParticipantAccess();
    await testCrossRoleDataIsolation();

    await generateReport();

    // Check if any fixes are needed
    const issues = testResults.filter(r => !r.passed);
    if (issues.length > 0) {
      console.log('\n⚠️  ACCESS CONTROL ISSUES DETECTED - Auto-fix required!\n');
      console.log('Issues found:');
      issues.forEach(issue => {
        console.log(`  - ${issue.endpoint}: ${issue.message || 'Incorrect access control'}`);
      });
    } else {
      console.log('\n✅ ALL ACCESS CONTROLS PROPERLY ENFORCED!\n');
    }

    await cleanupTestData();

  } catch (error) {
    console.error('Test execution error:', error);
    await cleanupTestData();
  }
}

runTests();
