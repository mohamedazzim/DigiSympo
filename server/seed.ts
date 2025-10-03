import { db } from './db';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { users, events, eventAdmins, rounds, questions, participants, testAttempts, answers, registrationForms, registrations, eventCredentials, auditLogs } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';

async function clearDatabase() {
  console.log('Clearing existing data...');
  
  await db.delete(answers);
  await db.delete(testAttempts);
  await db.delete(eventCredentials);
  await db.delete(participants);
  await db.delete(questions);
  await db.delete(rounds);
  await db.delete(eventAdmins);
  await db.delete(registrations);
  await db.delete(registrationForms);
  await db.delete(events);
  await db.delete(auditLogs);
  await db.delete(users);
  
  console.log('Database cleared successfully!');
}

async function seed() {
  console.log('Starting database seeding...');
  
  await clearDatabase();

  const hashedPassword = await bcrypt.hash('admin123', 10);

  console.log('Creating admin users...');
  const [superAdmin] = await db.insert(users).values({
    username: 'superadmin',
    password: hashedPassword,
    email: 'super@bootfeet.com',
    fullName: 'Super Administrator',
    role: 'super_admin',
    phone: '+1234567890'
  }).returning();

  const [eventAdmin1] = await db.insert(users).values({
    username: 'eventadmin1',
    password: hashedPassword,
    email: 'eventadmin1@bootfeet.com',
    fullName: 'Event Admin One',
    role: 'event_admin',
    phone: '+1234567891',
    createdBy: superAdmin.id
  }).returning();

  const [eventAdmin2] = await db.insert(users).values({
    username: 'eventadmin2',
    password: hashedPassword,
    email: 'eventadmin2@bootfeet.com',
    fullName: 'Event Admin Two',
    role: 'event_admin',
    phone: '+1234567892',
    createdBy: superAdmin.id
  }).returning();

  const [regCommittee1] = await db.insert(users).values({
    username: 'regcommittee1',
    password: hashedPassword,
    email: 'reg1@bootfeet.com',
    fullName: 'Registration Committee One',
    role: 'registration_committee',
    phone: '+1234567893',
    createdBy: superAdmin.id
  }).returning();

  const [regCommittee2] = await db.insert(users).values({
    username: 'regcommittee2',
    password: hashedPassword,
    email: 'reg2@bootfeet.com',
    fullName: 'Registration Committee Two',
    role: 'registration_committee',
    phone: '+1234567894',
    createdBy: superAdmin.id
  }).returning();

  console.log('Creating events...');
  const [event1] = await db.insert(events).values({
    name: 'Web Development Challenge',
    description: 'A comprehensive web development competition testing HTML, CSS, JavaScript, and modern frameworks',
    type: 'Technical',
    category: 'technical',
    status: 'active',
    startDate: new Date('2025-10-15T09:00:00'),
    endDate: new Date('2025-10-15T17:00:00'),
    createdBy: eventAdmin1.id
  }).returning();

  const [event2] = await db.insert(events).values({
    name: 'Quiz Competition',
    description: 'General knowledge quiz covering science, history, geography, and current affairs',
    type: 'Academic',
    category: 'non_technical',
    status: 'active',
    startDate: new Date('2025-10-16T10:00:00'),
    endDate: new Date('2025-10-16T14:00:00'),
    createdBy: eventAdmin2.id
  }).returning();

  const [event3] = await db.insert(events).values({
    name: 'Data Science Hackathon',
    description: 'Machine learning and AI competition focused on real-world data analysis',
    type: 'Technical',
    category: 'technical',
    status: 'completed',
    startDate: new Date('2025-10-01T08:00:00'),
    endDate: new Date('2025-10-01T20:00:00'),
    createdBy: eventAdmin1.id
  }).returning();

  console.log('Assigning event admins...');
  await db.insert(eventAdmins).values([
    { eventId: event1.id, adminId: eventAdmin1.id },
    { eventId: event2.id, adminId: eventAdmin2.id },
    { eventId: event3.id, adminId: eventAdmin1.id }
  ]);

  console.log('Creating rounds...');
  const [event1Round1] = await db.insert(rounds).values({
    eventId: event1.id,
    name: 'Round 1 - Basics',
    description: 'Fundamental web development concepts',
    roundNumber: 1,
    duration: 30,
    status: 'completed',
    startTime: new Date('2025-10-15T09:00:00'),
    endTime: new Date('2025-10-15T09:30:00'),
    startedAt: new Date('2025-10-15T09:00:00'),
    endedAt: new Date('2025-10-15T09:30:00')
  }).returning();

  const [event1Round2] = await db.insert(rounds).values({
    eventId: event1.id,
    name: 'Round 2 - Advanced',
    description: 'Advanced web development and frameworks',
    roundNumber: 2,
    duration: 45,
    status: 'in_progress',
    startTime: new Date('2025-10-15T10:00:00'),
    endTime: new Date('2025-10-15T10:45:00'),
    startedAt: new Date('2025-10-15T10:00:00')
  }).returning();

  const [event2Round1] = await db.insert(rounds).values({
    eventId: event2.id,
    name: 'Round 1 - Basics',
    description: 'General knowledge basics',
    roundNumber: 1,
    duration: 30,
    status: 'completed',
    startTime: new Date('2025-10-16T10:00:00'),
    endTime: new Date('2025-10-16T10:30:00'),
    startedAt: new Date('2025-10-16T10:00:00'),
    endedAt: new Date('2025-10-16T10:30:00')
  }).returning();

  const [event2Round2] = await db.insert(rounds).values({
    eventId: event2.id,
    name: 'Round 2 - Advanced',
    description: 'Advanced general knowledge',
    roundNumber: 2,
    duration: 45,
    status: 'in_progress',
    startTime: new Date('2025-10-16T11:00:00'),
    endTime: new Date('2025-10-16T11:45:00'),
    startedAt: new Date('2025-10-16T11:00:00')
  }).returning();

  const [event3Round1] = await db.insert(rounds).values({
    eventId: event3.id,
    name: 'Round 1 - Basics',
    description: 'Data science fundamentals',
    roundNumber: 1,
    duration: 30,
    status: 'completed',
    startTime: new Date('2025-10-01T08:00:00'),
    endTime: new Date('2025-10-01T08:30:00'),
    startedAt: new Date('2025-10-01T08:00:00'),
    endedAt: new Date('2025-10-01T08:30:00')
  }).returning();

  const [event3Round2] = await db.insert(rounds).values({
    eventId: event3.id,
    name: 'Round 2 - Advanced',
    description: 'Advanced machine learning concepts',
    roundNumber: 2,
    duration: 45,
    status: 'in_progress',
    startTime: new Date('2025-10-01T09:00:00'),
    endTime: new Date('2025-10-01T09:45:00'),
    startedAt: new Date('2025-10-01T09:00:00')
  }).returning();

  console.log('Creating questions...');
  
  const event1Round1Questions = await db.insert(questions).values([
    {
      roundId: event1Round1.id,
      questionType: 'multiple_choice',
      questionText: 'What does HTML stand for?',
      questionNumber: 1,
      points: 10,
      options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlinks and Text Markup Language'],
      correctAnswer: 'Hyper Text Markup Language'
    },
    {
      roundId: event1Round1.id,
      questionType: 'multiple_choice',
      questionText: 'Which CSS property is used to change the text color?',
      questionNumber: 2,
      points: 10,
      options: ['color', 'text-color', 'font-color', 'text-style'],
      correctAnswer: 'color'
    },
    {
      roundId: event1Round1.id,
      questionType: 'multiple_choice',
      questionText: 'Which JavaScript method is used to write on the browser console?',
      questionNumber: 3,
      points: 10,
      options: ['console.log()', 'print()', 'write()', 'display()'],
      correctAnswer: 'console.log()'
    },
    {
      roundId: event1Round1.id,
      questionType: 'multiple_choice',
      questionText: 'Is JavaScript case-sensitive?',
      questionNumber: 4,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'True'
    },
    {
      roundId: event1Round1.id,
      questionType: 'multiple_choice',
      questionText: 'Can HTML and CSS be combined in the same file?',
      questionNumber: 5,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'True'
    },
    {
      roundId: event1Round1.id,
      questionType: 'descriptive',
      questionText: 'Explain the difference between let, const, and var in JavaScript.',
      questionNumber: 6,
      points: 15,
      expectedOutput: 'let and const are block-scoped, var is function-scoped. const cannot be reassigned.'
    },
    {
      roundId: event1Round1.id,
      questionType: 'descriptive',
      questionText: 'What is the box model in CSS?',
      questionNumber: 7,
      points: 15,
      expectedOutput: 'The box model consists of content, padding, border, and margin.'
    },
    {
      roundId: event1Round1.id,
      questionType: 'coding',
      questionText: 'Write a JavaScript function that takes an array of numbers and returns the sum of all even numbers.',
      questionNumber: 8,
      points: 25,
      expectedOutput: 'function sumEven(arr) { return arr.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0); }',
      testCases: [
        { input: '[1, 2, 3, 4, 5, 6]', output: '12' },
        { input: '[10, 15, 20, 25]', output: '30' }
      ]
    }
  ]).returning();

  const event1Round2Questions = await db.insert(questions).values([
    {
      roundId: event1Round2.id,
      questionType: 'multiple_choice',
      questionText: 'What is React?',
      questionNumber: 1,
      points: 10,
      options: ['A JavaScript library', 'A programming language', 'A database', 'An operating system'],
      correctAnswer: 'A JavaScript library'
    },
    {
      roundId: event1Round2.id,
      questionType: 'multiple_choice',
      questionText: 'Which hook is used for side effects in React?',
      questionNumber: 2,
      points: 10,
      options: ['useEffect', 'useState', 'useContext', 'useMemo'],
      correctAnswer: 'useEffect'
    },
    {
      roundId: event1Round2.id,
      questionType: 'multiple_choice',
      questionText: 'What does REST stand for in API development?',
      questionNumber: 3,
      points: 10,
      options: ['Representational State Transfer', 'Remote Estate Transfer', 'Real State Testing', 'Representational System Transfer'],
      correctAnswer: 'Representational State Transfer'
    },
    {
      roundId: event1Round2.id,
      questionType: 'multiple_choice',
      questionText: 'Does Node.js run on the client side?',
      questionNumber: 4,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'False'
    },
    {
      roundId: event1Round2.id,
      questionType: 'multiple_choice',
      questionText: 'Is TypeScript a superset of JavaScript?',
      questionNumber: 5,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'True'
    },
    {
      roundId: event1Round2.id,
      questionType: 'descriptive',
      questionText: 'Explain the Virtual DOM in React.',
      questionNumber: 6,
      points: 15,
      expectedOutput: 'Virtual DOM is a lightweight copy of the actual DOM. React uses it to optimize updates by comparing changes.'
    },
    {
      roundId: event1Round2.id,
      questionType: 'descriptive',
      questionText: 'What is the purpose of middleware in Express.js?',
      questionNumber: 7,
      points: 15,
      expectedOutput: 'Middleware functions have access to request and response objects and can modify them or end the request-response cycle.'
    },
    {
      roundId: event1Round2.id,
      questionType: 'coding',
      questionText: 'Create a React component that displays a counter with increment and decrement buttons.',
      questionNumber: 8,
      points: 25,
      expectedOutput: 'function Counter() { const [count, setCount] = useState(0); return (<div><button onClick={() => setCount(count - 1)}>-</button><span>{count}</span><button onClick={() => setCount(count + 1)}>+</button></div>); }',
      testCases: [
        { input: 'Initial render', output: 'Shows 0' },
        { input: 'Click increment', output: 'Shows 1' }
      ]
    }
  ]).returning();

  const event2Round1Questions = await db.insert(questions).values([
    {
      roundId: event2Round1.id,
      questionType: 'multiple_choice',
      questionText: 'What is the capital of France?',
      questionNumber: 1,
      points: 10,
      options: ['Paris', 'London', 'Berlin', 'Madrid'],
      correctAnswer: 'Paris'
    },
    {
      roundId: event2Round1.id,
      questionType: 'multiple_choice',
      questionText: 'Who painted the Mona Lisa?',
      questionNumber: 2,
      points: 10,
      options: ['Leonardo da Vinci', 'Michelangelo', 'Raphael', 'Donatello'],
      correctAnswer: 'Leonardo da Vinci'
    },
    {
      roundId: event2Round1.id,
      questionType: 'multiple_choice',
      questionText: 'What is the largest planet in our solar system?',
      questionNumber: 3,
      points: 10,
      options: ['Jupiter', 'Saturn', 'Neptune', 'Earth'],
      correctAnswer: 'Jupiter'
    },
    {
      roundId: event2Round1.id,
      questionType: 'multiple_choice',
      questionText: 'The Great Wall of China is visible from space.',
      questionNumber: 4,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'False'
    },
    {
      roundId: event2Round1.id,
      questionType: 'multiple_choice',
      questionText: 'Water boils at 100 degrees Celsius at sea level.',
      questionNumber: 5,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'True'
    },
    {
      roundId: event2Round1.id,
      questionType: 'descriptive',
      questionText: 'Name three countries in South America.',
      questionNumber: 6,
      points: 15,
      expectedOutput: 'Brazil, Argentina, Chile'
    },
    {
      roundId: event2Round1.id,
      questionType: 'descriptive',
      questionText: 'What is photosynthesis?',
      questionNumber: 7,
      points: 15,
      expectedOutput: 'The process by which plants convert light energy into chemical energy.'
    },
    {
      roundId: event2Round1.id,
      questionType: 'coding',
      questionText: 'Calculate the sum of first N natural numbers where N=10.',
      questionNumber: 8,
      points: 25,
      expectedOutput: '55',
      testCases: [
        { input: 'N=10', output: '55' },
        { input: 'N=5', output: '15' }
      ]
    }
  ]).returning();

  const event2Round2Questions = await db.insert(questions).values([
    {
      roundId: event2Round2.id,
      questionType: 'multiple_choice',
      questionText: 'Which element has the chemical symbol "Au"?',
      questionNumber: 1,
      points: 10,
      options: ['Gold', 'Silver', 'Aluminum', 'Argon'],
      correctAnswer: 'Gold'
    },
    {
      roundId: event2Round2.id,
      questionType: 'multiple_choice',
      questionText: 'In which year did World War II end?',
      questionNumber: 2,
      points: 10,
      options: ['1945', '1944', '1946', '1943'],
      correctAnswer: '1945'
    },
    {
      roundId: event2Round2.id,
      questionType: 'multiple_choice',
      questionText: 'What is the smallest country in the world?',
      questionNumber: 3,
      points: 10,
      options: ['Vatican City', 'Monaco', 'San Marino', 'Liechtenstein'],
      correctAnswer: 'Vatican City'
    },
    {
      roundId: event2Round2.id,
      questionType: 'multiple_choice',
      questionText: 'Mount Everest is the highest mountain in the world.',
      questionNumber: 4,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'True'
    },
    {
      roundId: event2Round2.id,
      questionType: 'multiple_choice',
      questionText: 'The Pacific Ocean is the smallest ocean.',
      questionNumber: 5,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'False'
    },
    {
      roundId: event2Round2.id,
      questionType: 'descriptive',
      questionText: 'Name the seven continents.',
      questionNumber: 6,
      points: 15,
      expectedOutput: 'Asia, Africa, North America, South America, Antarctica, Europe, Australia'
    },
    {
      roundId: event2Round2.id,
      questionType: 'descriptive',
      questionText: 'What is the theory of relativity?',
      questionNumber: 7,
      points: 15,
      expectedOutput: 'Einstein\'s theory describing the relationship between space, time, and gravity.'
    },
    {
      roundId: event2Round2.id,
      questionType: 'coding',
      questionText: 'Write a program to check if a number is prime.',
      questionNumber: 8,
      points: 25,
      expectedOutput: 'function isPrime(n) { if (n <= 1) return false; for (let i = 2; i <= Math.sqrt(n); i++) { if (n % i === 0) return false; } return true; }',
      testCases: [
        { input: '7', output: 'true' },
        { input: '10', output: 'false' }
      ]
    }
  ]).returning();

  const event3Round1Questions = await db.insert(questions).values([
    {
      roundId: event3Round1.id,
      questionType: 'multiple_choice',
      questionText: 'What does ML stand for in data science?',
      questionNumber: 1,
      points: 10,
      options: ['Machine Learning', 'Manual Learning', 'Multiple Learning', 'Modern Language'],
      correctAnswer: 'Machine Learning'
    },
    {
      roundId: event3Round1.id,
      questionType: 'multiple_choice',
      questionText: 'Which library is commonly used for data manipulation in Python?',
      questionNumber: 2,
      points: 10,
      options: ['pandas', 'numpy', 'matplotlib', 'seaborn'],
      correctAnswer: 'pandas'
    },
    {
      roundId: event3Round1.id,
      questionType: 'multiple_choice',
      questionText: 'What is a neural network?',
      questionNumber: 3,
      points: 10,
      options: ['A computing system inspired by biological neural networks', 'A type of database', 'A web framework', 'A cloud service'],
      correctAnswer: 'A computing system inspired by biological neural networks'
    },
    {
      roundId: event3Round1.id,
      questionType: 'multiple_choice',
      questionText: 'Is supervised learning used for labeled data?',
      questionNumber: 4,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'True'
    },
    {
      roundId: event3Round1.id,
      questionType: 'multiple_choice',
      questionText: 'Can machine learning models work without training data?',
      questionNumber: 5,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'False'
    },
    {
      roundId: event3Round1.id,
      questionType: 'descriptive',
      questionText: 'Explain the difference between classification and regression.',
      questionNumber: 6,
      points: 15,
      expectedOutput: 'Classification predicts discrete categories, while regression predicts continuous values.'
    },
    {
      roundId: event3Round1.id,
      questionType: 'descriptive',
      questionText: 'What is overfitting in machine learning?',
      questionNumber: 7,
      points: 15,
      expectedOutput: 'When a model learns training data too well, including noise, and performs poorly on new data.'
    },
    {
      roundId: event3Round1.id,
      questionType: 'coding',
      questionText: 'Write Python code to normalize a list of numbers between 0 and 1.',
      questionNumber: 8,
      points: 25,
      expectedOutput: 'def normalize(lst): min_val = min(lst); max_val = max(lst); return [(x - min_val) / (max_val - min_val) for x in lst]',
      testCases: [
        { input: '[1, 2, 3, 4, 5]', output: '[0, 0.25, 0.5, 0.75, 1]' },
        { input: '[10, 20, 30]', output: '[0, 0.5, 1]' }
      ]
    }
  ]).returning();

  const event3Round2Questions = await db.insert(questions).values([
    {
      roundId: event3Round2.id,
      questionType: 'multiple_choice',
      questionText: 'What is deep learning?',
      questionNumber: 1,
      points: 10,
      options: ['Machine learning using neural networks with multiple layers', 'A type of database', 'A cloud computing service', 'A programming language'],
      correctAnswer: 'Machine learning using neural networks with multiple layers'
    },
    {
      roundId: event3Round2.id,
      questionType: 'multiple_choice',
      questionText: 'Which algorithm is used for clustering?',
      questionNumber: 2,
      points: 10,
      options: ['K-means', 'Linear Regression', 'Logistic Regression', 'Decision Tree'],
      correctAnswer: 'K-means'
    },
    {
      roundId: event3Round2.id,
      questionType: 'multiple_choice',
      questionText: 'What is a confusion matrix used for?',
      questionNumber: 3,
      points: 10,
      options: ['Evaluating classification model performance', 'Data cleaning', 'Feature engineering', 'Data visualization'],
      correctAnswer: 'Evaluating classification model performance'
    },
    {
      roundId: event3Round2.id,
      questionType: 'multiple_choice',
      questionText: 'Is gradient descent an optimization algorithm?',
      questionNumber: 4,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'True'
    },
    {
      roundId: event3Round2.id,
      questionType: 'multiple_choice',
      questionText: 'Are all neural networks deep learning models?',
      questionNumber: 5,
      points: 5,
      options: ['True', 'False'],
      correctAnswer: 'False'
    },
    {
      roundId: event3Round2.id,
      questionType: 'descriptive',
      questionText: 'Explain the concept of cross-validation.',
      questionNumber: 6,
      points: 15,
      expectedOutput: 'A technique to assess model performance by dividing data into training and validation sets multiple times.'
    },
    {
      roundId: event3Round2.id,
      questionType: 'descriptive',
      questionText: 'What is feature engineering?',
      questionNumber: 7,
      points: 15,
      expectedOutput: 'The process of creating new features or transforming existing ones to improve model performance.'
    },
    {
      roundId: event3Round2.id,
      questionType: 'coding',
      questionText: 'Implement a function to calculate the accuracy of predictions given true and predicted labels.',
      questionNumber: 8,
      points: 25,
      expectedOutput: 'def accuracy(y_true, y_pred): correct = sum(1 for t, p in zip(y_true, y_pred) if t == p); return correct / len(y_true)',
      testCases: [
        { input: 'y_true=[1,0,1,1], y_pred=[1,0,0,1]', output: '0.75' },
        { input: 'y_true=[1,1,1], y_pred=[1,1,1]', output: '1.0' }
      ]
    }
  ]).returning();

  console.log('Creating participants...');
  const participantNames = [
    { first: 'John', last: 'Doe' },
    { first: 'Jane', last: 'Smith' },
    { first: 'Alice', last: 'Johnson' },
    { first: 'Bob', last: 'Williams' },
    { first: 'Charlie', last: 'Brown' },
    { first: 'Diana', last: 'Prince' },
    { first: 'Ethan', last: 'Hunt' },
    { first: 'Fiona', last: 'Green' },
    { first: 'George', last: 'Clark' },
    { first: 'Hannah', last: 'White' },
    { first: 'Ian', last: 'Taylor' },
    { first: 'Julia', last: 'Martinez' },
    { first: 'Kevin', last: 'Lee' },
    { first: 'Laura', last: 'Davis' },
    { first: 'Michael', last: 'Chen' }
  ];

  const participantPassword = await bcrypt.hash('participant123', 10);
  const allParticipants = [];
  
  for (let i = 0; i < 15; i++) {
    const name = participantNames[i];
    const counter = String(i + 1).padStart(3, '0');
    
    const [participant] = await db.insert(users).values({
      username: `participant${counter}`,
      password: participantPassword,
      email: `${name.first.toLowerCase()}.${name.last.toLowerCase()}@student.com`,
      fullName: `${name.first} ${name.last}`,
      role: 'participant',
      phone: `+123456${7900 + i}`,
      createdBy: superAdmin.id
    }).returning();
    
    allParticipants.push({ user: participant, name, counter });
  }

  console.log('Registering participants to events and creating credentials...');
  
  for (let i = 0; i < 5; i++) {
    const p = allParticipants[i];
    await db.insert(participants).values({
      eventId: event1.id,
      userId: p.user.id,
      status: 'registered'
    });
    
    const eventUsername = `web-development-challenge-${p.name.first.toLowerCase()}-${p.counter}`;
    const eventPasswordPlain = `${p.name.last.toLowerCase()}${p.counter}`;
    const eventPasswordHash = await bcrypt.hash(eventPasswordPlain, 10);
    
    await db.insert(eventCredentials).values({
      participantUserId: p.user.id,
      eventId: event1.id,
      eventUsername: eventUsername,
      eventPassword: eventPasswordHash,
      testEnabled: true,
      enabledBy: eventAdmin1.id,
      enabledAt: new Date()
    });
  }
  
  for (let i = 5; i < 10; i++) {
    const p = allParticipants[i];
    await db.insert(participants).values({
      eventId: event2.id,
      userId: p.user.id,
      status: 'registered'
    });
    
    const eventUsername = `quiz-competition-${p.name.first.toLowerCase()}-${p.counter}`;
    const eventPasswordPlain = `${p.name.last.toLowerCase()}${p.counter}`;
    const eventPasswordHash = await bcrypt.hash(eventPasswordPlain, 10);
    
    await db.insert(eventCredentials).values({
      participantUserId: p.user.id,
      eventId: event2.id,
      eventUsername: eventUsername,
      eventPassword: eventPasswordHash,
      testEnabled: true,
      enabledBy: eventAdmin2.id,
      enabledAt: new Date()
    });
  }
  
  for (let i = 10; i < 15; i++) {
    const p = allParticipants[i];
    await db.insert(participants).values({
      eventId: event3.id,
      userId: p.user.id,
      status: 'registered'
    });
    
    const eventUsername = `data-science-hackathon-${p.name.first.toLowerCase()}-${p.counter}`;
    const eventPasswordPlain = `${p.name.last.toLowerCase()}${p.counter}`;
    const eventPasswordHash = await bcrypt.hash(eventPasswordPlain, 10);
    
    await db.insert(eventCredentials).values({
      participantUserId: p.user.id,
      eventId: event3.id,
      eventUsername: eventUsername,
      eventPassword: eventPasswordHash,
      testEnabled: true,
      enabledBy: eventAdmin1.id,
      enabledAt: new Date()
    });
  }

  console.log('Creating test attempts and answers...');
  
  for (let i = 0; i < 5; i++) {
    const p = allParticipants[i];
    
    for (let attemptNum = 0; attemptNum < 2; attemptNum++) {
      const violations = Math.floor(Math.random() * 3);
      const violationLogs = [];
      for (let v = 0; v < violations; v++) {
        violationLogs.push({
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          type: Math.random() > 0.5 ? 'tab_switch' : 'refresh_attempt'
        });
      }
      
      const [attempt] = await db.insert(testAttempts).values({
        roundId: event1Round1.id,
        userId: p.user.id,
        startedAt: new Date('2025-10-15T09:00:00'),
        submittedAt: new Date('2025-10-15T09:25:00'),
        status: 'completed',
        tabSwitchCount: violations,
        refreshAttemptCount: 0,
        violationLogs: violationLogs,
        totalScore: 0,
        maxScore: 85,
        completedAt: new Date('2025-10-15T09:25:00')
      }).returning();
      
      let totalScore = 0;
      
      for (const question of event1Round1Questions) {
        const isCorrect = Math.random() > 0.3;
        const pointsAwarded = isCorrect ? question.points : 0;
        totalScore += pointsAwarded;
        
        let answerText = '';
        if (question.questionType === 'multiple_choice') {
          answerText = isCorrect ? question.correctAnswer! : (question.options as string[])[Math.floor(Math.random() * (question.options as string[]).length)];
        } else if (question.questionType === 'descriptive') {
          answerText = isCorrect ? question.expectedOutput! : 'Sample answer';
        } else {
          answerText = isCorrect ? question.expectedOutput! : 'function incorrect() {}';
        }
        
        await db.insert(answers).values({
          attemptId: attempt.id,
          questionId: question.id,
          answer: answerText,
          isCorrect: isCorrect,
          pointsAwarded: pointsAwarded,
          answeredAt: new Date('2025-10-15T09:20:00')
        });
      }
      
      await db.update(testAttempts)
        .set({ totalScore })
        .where(eq(testAttempts.id, attempt.id));
    }
  }
  
  for (let i = 5; i < 10; i++) {
    const p = allParticipants[i];
    const violations = Math.floor(Math.random() * 3);
    const violationLogs = [];
    for (let v = 0; v < violations; v++) {
      violationLogs.push({
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        type: Math.random() > 0.5 ? 'tab_switch' : 'refresh_attempt'
      });
    }
    
    const [attempt] = await db.insert(testAttempts).values({
      roundId: event2Round1.id,
      userId: p.user.id,
      startedAt: new Date('2025-10-16T10:00:00'),
      submittedAt: new Date('2025-10-16T10:25:00'),
      status: 'completed',
      tabSwitchCount: violations,
      refreshAttemptCount: 0,
      violationLogs: violationLogs,
      totalScore: 0,
      maxScore: 85,
      completedAt: new Date('2025-10-16T10:25:00')
    }).returning();
    
    let totalScore = 0;
    
    for (const question of event2Round1Questions) {
      const isCorrect = Math.random() > 0.25;
      const pointsAwarded = isCorrect ? question.points : 0;
      totalScore += pointsAwarded;
      
      let answerText = '';
      if (question.questionType === 'multiple_choice') {
        answerText = isCorrect ? question.correctAnswer! : (question.options as string[])[Math.floor(Math.random() * (question.options as string[]).length)];
      } else if (question.questionType === 'descriptive') {
        answerText = isCorrect ? question.expectedOutput! : 'Sample answer';
      } else {
        answerText = isCorrect ? question.expectedOutput! : '55';
      }
      
      await db.insert(answers).values({
        attemptId: attempt.id,
        questionId: question.id,
        answer: answerText,
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded,
        answeredAt: new Date('2025-10-16T10:20:00')
      });
    }
    
    await db.update(testAttempts)
      .set({ totalScore })
      .where(eq(testAttempts.id, attempt.id));
  }
  
  for (let i = 10; i < 15; i++) {
    const p = allParticipants[i];
    const violations = Math.floor(Math.random() * 3);
    const violationLogs = [];
    for (let v = 0; v < violations; v++) {
      violationLogs.push({
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        type: Math.random() > 0.5 ? 'tab_switch' : 'refresh_attempt'
      });
    }
    
    const [attempt] = await db.insert(testAttempts).values({
      roundId: event3Round1.id,
      userId: p.user.id,
      startedAt: new Date('2025-10-01T08:00:00'),
      submittedAt: new Date('2025-10-01T08:25:00'),
      status: 'completed',
      tabSwitchCount: violations,
      refreshAttemptCount: 0,
      violationLogs: violationLogs,
      totalScore: 0,
      maxScore: 85,
      completedAt: new Date('2025-10-01T08:25:00')
    }).returning();
    
    let totalScore = 0;
    
    for (const question of event3Round1Questions) {
      const isCorrect = Math.random() > 0.2;
      const pointsAwarded = isCorrect ? question.points : 0;
      totalScore += pointsAwarded;
      
      let answerText = '';
      if (question.questionType === 'multiple_choice') {
        answerText = isCorrect ? question.correctAnswer! : (question.options as string[])[Math.floor(Math.random() * (question.options as string[]).length)];
      } else if (question.questionType === 'descriptive') {
        answerText = isCorrect ? question.expectedOutput! : 'Sample answer';
      } else {
        answerText = isCorrect ? question.expectedOutput! : 'def incorrect(): pass';
      }
      
      await db.insert(answers).values({
        attemptId: attempt.id,
        questionId: question.id,
        answer: answerText,
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded,
        answeredAt: new Date('2025-10-01T08:20:00')
      });
    }
    
    await db.update(testAttempts)
      .set({ totalScore })
      .where(eq(testAttempts.id, attempt.id));
  }

  console.log('Creating registration form...');
  const [regForm] = await db.insert(registrationForms).values({
    title: 'BootFeet 2026 Symposium Registration',
    description: 'Official registration form for BootFeet 2026 Technical Symposium',
    formSlug: 'bootfeet-2026-registration',
    formFields: [
      { id: 'fullName', label: 'Full Name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'phone', label: 'Phone Number', type: 'tel', required: true },
      { id: 'college', label: 'College Name', type: 'text', required: true },
      { id: 'year', label: 'Year of Study', type: 'number', required: true }
    ],
    allowedCategories: ['technical', 'non_technical'],
    isActive: true
  }).returning();

  console.log('Creating pre-registrations...');
  const preRegNames = [
    { fullName: 'Sarah Connor', email: 'sarah.connor@college.edu', phone: '+1234560001' },
    { fullName: 'Kyle Reese', email: 'kyle.reese@college.edu', phone: '+1234560002' },
    { fullName: 'Ellen Ripley', email: 'ellen.ripley@college.edu', phone: '+1234560003' },
    { fullName: 'Rick Deckard', email: 'rick.deckard@college.edu', phone: '+1234560004' },
    { fullName: 'Neo Anderson', email: 'neo.anderson@college.edu', phone: '+1234560005' }
  ];

  for (let i = 0; i < 5; i++) {
    const preReg = preRegNames[i];
    await db.insert(registrations).values({
      formId: regForm.id,
      submittedData: {
        fullName: preReg.fullName,
        email: preReg.email,
        phone: preReg.phone,
        college: 'Example College',
        year: String(2 + (i % 3))
      },
      selectedEvents: i < 2 ? [event1.id] : i < 4 ? [event2.id] : [event3.id],
      paymentStatus: 'pending'
    });
  }

  console.log('Database seeding completed successfully!');
  console.log(`
  ✅ Created 5 admin users (1 super admin, 2 event admins, 2 registration committee)
  ✅ Created 3 events (Web Development Challenge, Quiz Competition, Data Science Hackathon)
  ✅ Created 6 rounds (2 per event)
  ✅ Created 48 questions (8 per round with diverse types)
  ✅ Created 15 participants with event credentials
  ✅ Created 20 test attempts with realistic answers
  ✅ Created 1 registration form
  ✅ Created 5 pending pre-registrations
  
  Admin Credentials:
  - Super Admin: superadmin / admin123
  - Event Admin 1: eventadmin1 / admin123
  - Event Admin 2: eventadmin2 / admin123
  - Reg Committee 1: regcommittee1 / admin123
  - Reg Committee 2: regcommittee2 / admin123
  `);
  
  process.exit(0);
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
  process.exit(1);
});
