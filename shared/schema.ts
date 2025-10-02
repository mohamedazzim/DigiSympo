import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - supports super_admin, event_admin, and participant roles
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // super_admin, event_admin, participant
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Events table - created by super admin
export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // quiz, coding, general, etc.
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default('draft'), // draft, active, completed
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Event Admins - assignment of admins to events
export const eventAdmins = pgTable("event_admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  adminId: varchar("admin_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Event Rules - proctoring and test rules per event
export const eventRules = pgTable("event_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull().unique(),
  noRefresh: boolean("no_refresh").notNull().default(true),
  noTabSwitch: boolean("no_tab_switch").notNull().default(true),
  forceFullscreen: boolean("force_fullscreen").notNull().default(true),
  disableShortcuts: boolean("disable_shortcuts").notNull().default(true),
  autoSubmitOnViolation: boolean("auto_submit_on_violation").notNull().default(true),
  maxTabSwitchWarnings: integer("max_tab_switch_warnings").notNull().default(2),
  additionalRules: text("additional_rules"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Rounds - multiple rounds per event
export const rounds = pgTable("rounds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(), // Round 1, Round 2, etc.
  description: text("description"),
  roundNumber: integer("round_number").notNull(),
  duration: integer("duration").notNull(), // in minutes
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  status: text("status").notNull().default('upcoming'), // upcoming, active, completed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Questions - per round
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").references(() => rounds.id, { onDelete: 'cascade' }).notNull(),
  questionType: text("question_type").notNull(), // multiple_choice, coding, descriptive
  questionText: text("question_text").notNull(),
  questionNumber: integer("question_number").notNull(),
  points: integer("points").notNull().default(1),
  
  // For multiple choice questions
  options: jsonb("options"), // Array of options
  correctAnswer: text("correct_answer"), // For multiple choice
  
  // For coding/descriptive questions
  expectedOutput: text("expected_output"),
  testCases: jsonb("test_cases"), // For coding questions
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Participants - users registered for events
export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  status: text("status").notNull().default('registered'), // registered, completed, disqualified
});

// Test Attempts - tracking participant test sessions
export const testAttempts = pgTable("test_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roundId: varchar("round_id").references(() => rounds.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  submittedAt: timestamp("submitted_at"),
  status: text("status").notNull().default('in_progress'), // in_progress, completed, auto_submitted
  
  // Proctoring violations
  tabSwitchCount: integer("tab_switch_count").notNull().default(0),
  refreshAttemptCount: integer("refresh_attempt_count").notNull().default(0),
  violationLogs: jsonb("violation_logs"), // Array of violation timestamps and types
  
  // Scoring
  totalScore: integer("total_score").default(0),
  maxScore: integer("max_score"),
  
  completedAt: timestamp("completed_at"),
});

// Answers - participant answers to questions
export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  attemptId: varchar("attempt_id").references(() => testAttempts.id, { onDelete: 'cascade' }).notNull(),
  questionId: varchar("question_id").references(() => questions.id, { onDelete: 'cascade' }).notNull(),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct"),
  pointsAwarded: integer("points_awarded").default(0),
  answeredAt: timestamp("answered_at").defaultNow().notNull(),
});

// Reports - event-wise and symposium-wide reports
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").references(() => events.id, { onDelete: 'cascade' }),
  reportType: text("report_type").notNull(), // event_wise, symposium_wide
  title: text("title").notNull(),
  generatedBy: varchar("generated_by").references(() => users.id).notNull(),
  reportData: jsonb("report_data").notNull(), // JSON data for the report
  fileUrl: text("file_url"), // URL to the generated PDF/Excel file
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventRulesSchema = createInsertSchema(eventRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoundSchema = createInsertSchema(rounds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  registeredAt: true,
});

export const insertTestAttemptSchema = createInsertSchema(testAttempts).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const insertAnswerSchema = createInsertSchema(answers).omit({
  id: true,
  answeredAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type EventAdmin = typeof eventAdmins.$inferSelect;

export type EventRules = typeof eventRules.$inferSelect;
export type InsertEventRules = z.infer<typeof insertEventRulesSchema>;

export type Round = typeof rounds.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;

export type TestAttempt = typeof testAttempts.$inferSelect;
export type InsertTestAttempt = z.infer<typeof insertTestAttemptSchema>;

export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;

export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
