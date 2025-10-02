import { eq, and } from 'drizzle-orm';
import { db } from './db';
import { users, events, eventAdmins, eventRules, rounds, questions, participants, testAttempts, answers, reports } from '@shared/schema';
import type { User, InsertUser, Event, InsertEvent, EventRules, InsertEventRules, Round, InsertRound, Question, InsertQuestion, Participant, InsertParticipant, TestAttempt, InsertTestAttempt, Answer, InsertAnswer, Report, InsertReport } from '@shared/schema';

export interface IStorage {
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByCreator(creatorId: string): Promise<Event[]>;
  getEventsByAdmin(adminId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<void>;
  
  getEventAdminsByEvent(eventId: string): Promise<User[]>;
  assignEventAdmin(eventId: string, adminId: string): Promise<void>;
  removeEventAdmin(eventId: string, adminId: string): Promise<void>;
  
  getEventRules(eventId: string): Promise<EventRules | undefined>;
  createEventRules(rules: InsertEventRules): Promise<EventRules>;
  updateEventRules(eventId: string, rules: Partial<InsertEventRules>): Promise<EventRules | undefined>;
  
  getRoundsByEvent(eventId: string): Promise<Round[]>;
  getRound(id: string): Promise<Round | undefined>;
  createRound(round: InsertRound): Promise<Round>;
  updateRound(id: string, round: Partial<InsertRound>): Promise<Round | undefined>;
  deleteRound(id: string): Promise<void>;
  
  getQuestionsByRound(roundId: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  updateQuestion(id: string, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  deleteQuestion(id: string): Promise<void>;
  
  getParticipantsByEvent(eventId: string): Promise<Participant[]>;
  getParticipantsByUser(userId: string): Promise<Participant[]>;
  registerParticipant(participant: InsertParticipant): Promise<Participant>;
  
  getTestAttempt(id: string): Promise<TestAttempt | undefined>;
  getTestAttemptByUserAndRound(userId: string, roundId: string): Promise<TestAttempt | undefined>;
  getTestAttemptsByUser(userId: string): Promise<TestAttempt[]>;
  createTestAttempt(attempt: InsertTestAttempt): Promise<TestAttempt>;
  updateTestAttempt(id: string, attempt: Partial<InsertTestAttempt>): Promise<TestAttempt | undefined>;
  
  getAnswersByAttempt(attemptId: string): Promise<Answer[]>;
  createAnswer(answer: InsertAnswer): Promise<Answer>;
  updateAnswer(id: string, answer: Partial<InsertAnswer>): Promise<Answer | undefined>;
  
  getReports(): Promise<Report[]>;
  getReportsByEvent(eventId: string): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, report: Partial<InsertReport>): Promise<Report | undefined>;
  deleteReport(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events);
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventsByCreator(creatorId: string): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.createdBy, creatorId));
  }

  async getEventsByAdmin(adminId: string): Promise<Event[]> {
    const result = await db
      .select({ event: events })
      .from(eventAdmins)
      .innerJoin(events, eq(eventAdmins.eventId, events.id))
      .where(eq(eventAdmins.adminId, adminId));
    return result.map(r => r.event);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: string, updateData: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db.update(events).set({ ...updateData, updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return event;
  }

  async deleteEvent(id: string): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  async getEventAdminsByEvent(eventId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(eventAdmins)
      .innerJoin(users, eq(eventAdmins.adminId, users.id))
      .where(eq(eventAdmins.eventId, eventId));
    return result.map(r => r.user);
  }

  async assignEventAdmin(eventId: string, adminId: string): Promise<void> {
    await db.insert(eventAdmins).values({ eventId, adminId });
  }

  async removeEventAdmin(eventId: string, adminId: string): Promise<void> {
    await db.delete(eventAdmins).where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)));
  }

  async getEventRules(eventId: string): Promise<EventRules | undefined> {
    const [rules] = await db.select().from(eventRules).where(eq(eventRules.eventId, eventId));
    return rules;
  }

  async createEventRules(insertRules: InsertEventRules): Promise<EventRules> {
    const [rules] = await db.insert(eventRules).values(insertRules).returning();
    return rules;
  }

  async updateEventRules(eventId: string, updateData: Partial<InsertEventRules>): Promise<EventRules | undefined> {
    const [rules] = await db.update(eventRules).set({ ...updateData, updatedAt: new Date() }).where(eq(eventRules.eventId, eventId)).returning();
    return rules;
  }

  async getRoundsByEvent(eventId: string): Promise<Round[]> {
    return await db.select().from(rounds).where(eq(rounds.eventId, eventId));
  }

  async getRound(id: string): Promise<Round | undefined> {
    const [round] = await db.select().from(rounds).where(eq(rounds.id, id));
    return round;
  }

  async createRound(insertRound: InsertRound): Promise<Round> {
    const [round] = await db.insert(rounds).values(insertRound).returning();
    return round;
  }

  async updateRound(id: string, updateData: Partial<InsertRound>): Promise<Round | undefined> {
    const [round] = await db.update(rounds).set({ ...updateData, updatedAt: new Date() }).where(eq(rounds.id, id)).returning();
    return round;
  }

  async deleteRound(id: string): Promise<void> {
    await db.delete(rounds).where(eq(rounds.id, id));
  }

  async getQuestionsByRound(roundId: string): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.roundId, roundId));
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const [question] = await db.insert(questions).values(insertQuestion).returning();
    return question;
  }

  async updateQuestion(id: string, updateData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const [question] = await db.update(questions).set({ ...updateData, updatedAt: new Date() }).where(eq(questions.id, id)).returning();
    return question;
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  async getParticipantsByEvent(eventId: string): Promise<Participant[]> {
    return await db.select().from(participants).where(eq(participants.eventId, eventId));
  }

  async getParticipantsByUser(userId: string): Promise<Participant[]> {
    return await db.select().from(participants).where(eq(participants.userId, userId));
  }

  async registerParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const [participant] = await db.insert(participants).values(insertParticipant).returning();
    return participant;
  }

  async getTestAttempt(id: string): Promise<TestAttempt | undefined> {
    const [attempt] = await db.select().from(testAttempts).where(eq(testAttempts.id, id));
    return attempt;
  }

  async getTestAttemptByUserAndRound(userId: string, roundId: string): Promise<TestAttempt | undefined> {
    const [attempt] = await db.select().from(testAttempts)
      .where(and(eq(testAttempts.userId, userId), eq(testAttempts.roundId, roundId)));
    return attempt;
  }

  async getTestAttemptsByUser(userId: string): Promise<TestAttempt[]> {
    return await db.select().from(testAttempts).where(eq(testAttempts.userId, userId));
  }

  async createTestAttempt(insertAttempt: InsertTestAttempt): Promise<TestAttempt> {
    const [attempt] = await db.insert(testAttempts).values(insertAttempt).returning();
    return attempt;
  }

  async updateTestAttempt(id: string, updateData: Partial<TestAttempt>): Promise<TestAttempt | undefined> {
    const [attempt] = await db.update(testAttempts).set(updateData).where(eq(testAttempts.id, id)).returning();
    return attempt;
  }

  async getAnswersByAttempt(attemptId: string): Promise<Answer[]> {
    return await db.select().from(answers).where(eq(answers.attemptId, attemptId));
  }

  async createAnswer(insertAnswer: InsertAnswer): Promise<Answer> {
    const [answer] = await db.insert(answers).values(insertAnswer).returning();
    return answer;
  }

  async updateAnswer(id: string, updateData: Partial<Answer>): Promise<Answer | undefined> {
    const [answer] = await db.update(answers).set(updateData).where(eq(answers.id, id)).returning();
    return answer;
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports);
  }

  async getReportsByEvent(eventId: string): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.eventId, eventId));
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  async updateReport(id: string, updateData: Partial<InsertReport>): Promise<Report | undefined> {
    const [report] = await db.update(reports).set(updateData).where(eq(reports.id, id)).returning();
    return report;
  }

  async deleteReport(id: string): Promise<void> {
    await db.delete(reports).where(eq(reports.id, id));
  }
}

export const storage = new DatabaseStorage();
