import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { nanoid } from "nanoid";
import { requireAuth, requireSuperAdmin, requireEventAdmin, requireParticipant, requireEventAccess, requireRoundAccess, type AuthRequest } from "./middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "symposium-secret-key-change-in-production";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production environment");
}

function generateFormSlug(eventName: string): string {
  const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${slug}-${nanoid(8)}`;
}

function generateSecurePassword(): string {
  return crypto.randomBytes(12).toString('base64').slice(0, 16);
}

function timesOverlap(start1: Date | null, end1: Date | null, start2: Date | null, end2: Date | null): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  return start1 < end2 && start2 < end1;
}

async function validateEventSelection(eventIds: string[]): Promise<{ valid: boolean; error?: string }> {
  if (eventIds.length === 0) {
    return { valid: false, error: 'At least one event must be selected' };
  }

  const events = await storage.getEventsByIds(eventIds);
  
  if (events.length !== eventIds.length) {
    return { valid: false, error: 'One or more selected events not found' };
  }
  
  const technical = events.filter(e => e.category === 'technical');
  const nonTechnical = events.filter(e => e.category === 'non_technical');
  
  if (technical.length > 1) {
    return { valid: false, error: 'Only one technical event can be selected' };
  }
  if (nonTechnical.length > 1) {
    return { valid: false, error: 'Only one non-technical event can be selected' };
  }
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const e1 = events[i];
      const e2 = events[j];
      
      const e1Rounds = await storage.getRoundsByEvent(e1.id);
      const e2Rounds = await storage.getRoundsByEvent(e2.id);
      
      for (const r1 of e1Rounds) {
        for (const r2 of e2Rounds) {
          if (timesOverlap(r1.startTime, r1.endTime, r2.startTime, r2.endTime)) {
            return { valid: false, error: `Events "${e1.name}" and "${e2.name}" have overlapping times` };
          }
        }
      }
    }
  }
  
  return { valid: true };
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  app.get("/api/users", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id/credentials", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username && !email && !password) {
        return res.status(400).json({ message: "At least one field (username, email, or password) must be provided" });
      }

      const updates: any = {};
      if (username !== undefined) updates.username = username;
      if (email !== undefined) updates.email = email;
      if (password !== undefined) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.password = hashedPassword;
      }

      const user = await storage.updateUserCredentials(req.params.id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({
        message: "User credentials updated successfully",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error("Update user credentials error:", error);
      if (error.message === "Username already exists" || error.message === "Email already exists") {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.get("/api/admin/orphaned-admins", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const orphanedAdmins = await storage.getOrphanedEventAdmins();
      const adminsWithoutPasswords = orphanedAdmins.map(({ password, ...admin }) => admin);
      res.json(adminsWithoutPasswords);
    } catch (error) {
      console.error("Get orphaned admins error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, email, fullName, role } = req.body;
      
      if (!username || !password || !email || !fullName || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const validRoles = ["super_admin", "event_admin", "participant", "registration_committee"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        fullName,
        role
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      if (username.startsWith("DISABLED_")) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const eventCredential = await storage.getEventCredentialByUsername(username);
      if (!eventCredential) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (eventCredential.eventPassword !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const user = await storage.getUserById(eventCredential.participantUserId);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, eventId: eventCredential.eventId },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          eventId: eventCredential.eventId
        },
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res: Response) => {
    res.json(req.user);
  });

  app.get("/api/participants/my-credential", requireAuth, requireParticipant, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      
      if (!user.eventId) {
        return res.status(400).json({ message: 'No event associated with this session' });
      }

      const data = await storage.getParticipantCredentialWithDetails(user.id, user.eventId);
      
      if (!data) {
        return res.status(404).json({ message: 'Event credential not found' });
      }

      const { credential, event, rounds, eventRules, activeRoundRules } = data;

      res.json({
        id: credential.id,
        eventUsername: credential.eventUsername,
        testEnabled: credential.testEnabled,
        enabledAt: credential.enabledAt,
        participantName: user.fullName,
        event: {
          id: event.id,
          name: event.name,
          description: event.description,
          type: event.type,
          category: event.category
        },
        rounds: rounds.map((round: any) => ({
          id: round.id,
          name: round.name,
          duration: round.duration,
          startTime: round.startTime,
          endTime: round.endTime,
          status: round.status
        })),
        eventRules: {
          noRefresh: eventRules?.noRefresh,
          noTabSwitch: eventRules?.noTabSwitch,
          forceFullscreen: eventRules?.forceFullscreen,
          disableShortcuts: eventRules?.disableShortcuts,
          autoSubmitOnViolation: eventRules?.autoSubmitOnViolation,
          maxTabSwitchWarnings: eventRules?.maxTabSwitchWarnings,
          additionalRules: eventRules?.additionalRules
        },
        roundRules: activeRoundRules ? {
          noRefresh: activeRoundRules.noRefresh,
          noTabSwitch: activeRoundRules.noTabSwitch,
          forceFullscreen: activeRoundRules.forceFullscreen,
          disableShortcuts: activeRoundRules.disableShortcuts,
          autoSubmitOnViolation: activeRoundRules.autoSubmitOnViolation,
          maxTabSwitchWarnings: activeRoundRules.maxTabSwitchWarnings,
          additionalRules: activeRoundRules.additionalRules
        } : null
      });
    } catch (error) {
      console.error("Get participant credential error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role === "super_admin" || req.user!.role === "registration_committee") {
        const events = await storage.getEvents();
        res.json(events);
      } else if (req.user!.role === "event_admin") {
        const events = await storage.getEventsByAdmin(req.user!.id);
        res.json(events);
      } else if (req.user!.role === "participant") {
        const allEvents = await storage.getEvents();
        const activeEvents = allEvents.filter(e => e.status === 'active');
        res.json(activeEvents);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/for-registration", async (req: Request, res: Response) => {
    try {
      const activeForm = await storage.getActiveRegistrationForm();
      
      if (!activeForm) {
        return res.status(404).json({ message: 'No active registration form found' });
      }

      const allEvents = await storage.getEvents();
      
      const allowedEvents = allEvents.filter(event => 
        activeForm.allowedCategories.includes(event.category)
      );
      
      const eventsWithRounds = await Promise.all(
        allowedEvents.map(async (event) => {
          const rounds = await storage.getRoundsByEvent(event.id);
          return {
            id: event.id,
            name: event.name,
            description: event.description,
            category: event.category,
            rounds: rounds.map(r => ({
              id: r.id,
              name: r.name,
              startTime: r.startTime,
              endTime: r.endTime
            }))
          };
        })
      );
      res.json(eventsWithRounds);
    } catch (error) {
      console.error("Get events for registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:id", requireAuth, requireEventAccess, async (req: AuthRequest, res: Response) => {
    try {
      const event = await storage.getEvent(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/events", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, type, startDate, endDate, status } = req.body;
      
      if (!name || !description || !type) {
        return res.status(400).json({ message: "Name, description, and type are required" });
      }

      const existingEvent = await storage.getEventByName(name);
      if (existingEvent) {
        return res.status(400).json({ message: "An event with this name already exists" });
      }

      const event = await storage.createEvent({
        name,
        description,
        type,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'draft',
        createdBy: req.user!.id
      });

      await storage.createEventRules({
        eventId: event.id,
        noRefresh: true,
        noTabSwitch: true,
        forceFullscreen: true,
        disableShortcuts: true,
        autoSubmitOnViolation: true,
        maxTabSwitchWarnings: 2,
        additionalRules: null
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/events/:id", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, type, startDate, endDate, status } = req.body;
      
      if (name !== undefined) {
        const existingEvent = await storage.getEventByName(name);
        if (existingEvent && existingEvent.id !== req.params.id) {
          return res.status(400).json({ message: "An event with this name already exists" });
        }
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (type !== undefined) updateData.type = type;
      if (startDate !== undefined) updateData.startDate = new Date(startDate);
      if (endDate !== undefined) updateData.endDate = new Date(endDate);
      if (status !== undefined) updateData.status = status;

      const event = await storage.updateEvent(req.params.id, updateData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/events/:id", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      // CASCADE DELETE BEHAVIOR: Deleting an event automatically deletes eventAdmins (assignments),
      // eventRules, rounds, roundRules, questions, testAttempts, answers, participants, and reports.
      // Admin user accounts persist and can be reassigned to other events.
      await storage.deleteEvent(req.params.id);
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/events/:eventId/admins", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { adminId } = req.body;
      
      if (!adminId) {
        return res.status(400).json({ message: "Admin ID is required" });
      }

      const admin = await storage.getUser(adminId);
      if (!admin || admin.role !== "event_admin") {
        return res.status(400).json({ message: "Invalid event admin" });
      }

      await storage.assignEventAdmin(req.params.eventId, adminId);
      res.json({ message: "Event admin assigned successfully" });
    } catch (error) {
      console.error("Assign event admin error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:eventId/admins", requireAuth, requireEventAccess, async (req: AuthRequest, res: Response) => {
    try {
      const admins = await storage.getEventAdminsByEvent(req.params.eventId);
      const adminsWithoutPasswords = admins.map(({ password, ...admin }) => admin);
      res.json(adminsWithoutPasswords);
    } catch (error) {
      console.error("Get event admins error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/events/:eventId/admins/:adminId", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      await storage.removeEventAdmin(req.params.eventId, req.params.adminId);
      res.json({ message: "Event admin removed successfully" });
    } catch (error) {
      console.error("Remove event admin error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:eventId/rules", requireAuth, requireEventAccess, async (req: AuthRequest, res: Response) => {
    try {
      const rules = await storage.getEventRules(req.params.eventId);
      if (!rules) {
        return res.status(404).json({ message: "Event rules not found" });
      }
      res.json(rules);
    } catch (error) {
      console.error("Get event rules error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/events/:eventId/rules", requireAuth, requireEventAccess, async (req: AuthRequest, res: Response) => {
    try {
      const { noRefresh, noTabSwitch, forceFullscreen, disableShortcuts, autoSubmitOnViolation, maxTabSwitchWarnings, additionalRules } = req.body;
      
      const updateData: any = {};
      if (noRefresh !== undefined) updateData.noRefresh = noRefresh;
      if (noTabSwitch !== undefined) updateData.noTabSwitch = noTabSwitch;
      if (forceFullscreen !== undefined) updateData.forceFullscreen = forceFullscreen;
      if (disableShortcuts !== undefined) updateData.disableShortcuts = disableShortcuts;
      if (autoSubmitOnViolation !== undefined) updateData.autoSubmitOnViolation = autoSubmitOnViolation;
      if (maxTabSwitchWarnings !== undefined) updateData.maxTabSwitchWarnings = maxTabSwitchWarnings;
      if (additionalRules !== undefined) updateData.additionalRules = additionalRules;

      const rules = await storage.updateEventRules(req.params.eventId, updateData);
      if (!rules) {
        return res.status(404).json({ message: "Event rules not found" });
      }

      res.json(rules);
    } catch (error) {
      console.error("Update event rules error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:eventId/rounds", requireAuth, requireEventAccess, async (req: AuthRequest, res: Response) => {
    try {
      const rounds = await storage.getRoundsByEvent(req.params.eventId);
      res.json(rounds);
    } catch (error) {
      console.error("Get rounds error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/events/:eventId/rounds", requireAuth, requireEventAccess, async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, roundNumber, duration, startTime, endTime, status } = req.body;
      
      if (!name || roundNumber === undefined || !duration) {
        return res.status(400).json({ message: "Name, round number, and duration are required" });
      }

      const round = await storage.createRound({
        eventId: req.params.eventId,
        name,
        description: description || null,
        roundNumber,
        duration,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        status: status || 'upcoming'
      });

      await storage.createRoundRules({
        roundId: round.id,
        noRefresh: true,
        noTabSwitch: true,
        forceFullscreen: true,
        disableShortcuts: true,
        autoSubmitOnViolation: true,
        maxTabSwitchWarnings: 2,
        additionalRules: null
      });

      res.status(201).json(round);
    } catch (error) {
      console.error("Create round error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rounds/:roundId/rules", requireAuth, requireRoundAccess, async (req: AuthRequest, res: Response) => {
    try {
      let rules = await storage.getRoundRules(req.params.roundId);
      
      if (!rules) {
        const round = await storage.getRound(req.params.roundId);
        if (!round) {
          return res.status(404).json({ message: "Round not found" });
        }
        
        rules = await storage.createRoundRules({
          roundId: req.params.roundId,
          noRefresh: true,
          noTabSwitch: true,
          forceFullscreen: true,
          disableShortcuts: true,
          autoSubmitOnViolation: true,
          maxTabSwitchWarnings: 2,
          additionalRules: null
        });
      }
      
      res.json(rules);
    } catch (error) {
      console.error("Get round rules error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/rounds/:roundId/rules", requireAuth, requireRoundAccess, async (req: AuthRequest, res: Response) => {
    try {
      const { noRefresh, noTabSwitch, forceFullscreen, disableShortcuts, autoSubmitOnViolation, maxTabSwitchWarnings, additionalRules } = req.body;
      
      const updateData: any = {};
      if (noRefresh !== undefined) updateData.noRefresh = noRefresh;
      if (noTabSwitch !== undefined) updateData.noTabSwitch = noTabSwitch;
      if (forceFullscreen !== undefined) updateData.forceFullscreen = forceFullscreen;
      if (disableShortcuts !== undefined) updateData.disableShortcuts = disableShortcuts;
      if (autoSubmitOnViolation !== undefined) updateData.autoSubmitOnViolation = autoSubmitOnViolation;
      if (maxTabSwitchWarnings !== undefined) updateData.maxTabSwitchWarnings = maxTabSwitchWarnings;
      if (additionalRules !== undefined) updateData.additionalRules = additionalRules;

      const rules = await storage.updateRoundRules(req.params.roundId, updateData);
      if (!rules) {
        return res.status(404).json({ message: "Round rules not found" });
      }

      res.json(rules);
    } catch (error) {
      console.error("Update round rules error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/rounds/:roundId/questions", requireAuth, requireRoundAccess, async (req: AuthRequest, res: Response) => {
    try {
      const questions = await storage.getQuestionsByRound(req.params.roundId);
      res.json(questions);
    } catch (error) {
      console.error("Get questions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/rounds/:roundId/questions", requireAuth, requireRoundAccess, async (req: AuthRequest, res: Response) => {
    try {
      const { questionType, questionText, questionNumber, points, options, correctAnswer, expectedOutput, testCases } = req.body;
      
      if (!questionType || !questionText || questionNumber === undefined) {
        return res.status(400).json({ message: "Question type, text, and number are required" });
      }

      const question = await storage.createQuestion({
        roundId: req.params.roundId,
        questionType,
        questionText,
        questionNumber,
        points: points || 1,
        options: options || null,
        correctAnswer: correctAnswer || null,
        expectedOutput: expectedOutput || null,
        testCases: testCases || null
      });

      res.status(201).json(question);
    } catch (error) {
      console.error("Create question error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/rounds/:roundId/questions/bulk", requireAuth, requireRoundAccess, async (req: AuthRequest, res: Response) => {
    try {
      const { questions } = req.body;
      
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "Questions array is required and must not be empty" });
      }

      const errors: string[] = [];
      const createdQuestions = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        
        if (!q.questionText || q.questionNumber === undefined) {
          errors.push(`Question ${i + 1}: questionText and questionNumber are required`);
          continue;
        }

        try {
          const question = await storage.createQuestion({
            roundId: req.params.roundId,
            questionType: q.questionType || 'multiple_choice',
            questionText: q.questionText,
            questionNumber: q.questionNumber,
            points: q.points || 1,
            options: q.options || null,
            correctAnswer: q.correctAnswer || null,
            expectedOutput: q.expectedOutput || null,
            testCases: q.testCases || null
          });
          createdQuestions.push(question);
        } catch (error: any) {
          errors.push(`Question ${i + 1}: ${error.message}`);
        }
      }

      if (errors.length > 0 && createdQuestions.length === 0) {
        return res.status(400).json({ message: "Failed to create any questions", errors });
      }

      res.status(201).json({
        message: `Successfully created ${createdQuestions.length} questions`,
        created: createdQuestions.length,
        errors: errors.length > 0 ? errors : undefined,
        questions: createdQuestions
      });
    } catch (error) {
      console.error("Bulk create questions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/events/:eventId/participants", requireAuth, requireParticipant, async (req: AuthRequest, res: Response) => {
    try {
      const participant = await storage.registerParticipant({
        eventId: req.params.eventId,
        userId: req.user!.id,
        status: 'registered'
      });

      res.status(201).json(participant);
    } catch (error) {
      console.error("Register participant error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:eventId/participants", requireAuth, requireEventAccess, async (req: AuthRequest, res: Response) => {
    try {
      const participants = await storage.getParticipantsByEvent(req.params.eventId);
      res.json(participants);
    } catch (error) {
      console.error("Get participants error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/participants/my-registrations", requireAuth, requireParticipant, async (req: AuthRequest, res: Response) => {
    try {
      const participants = await storage.getParticipantsByUser(req.user!.id);
      res.json(participants);
    } catch (error) {
      console.error("Get my registrations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/event-admin/participants", requireAuth, requireEventAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const participants = await storage.getParticipantsByAdmin(req.user!.id);
      const participantsWithoutPasswords = participants.map(p => ({
        ...p,
        user: p.user ? (({ password, ...user }) => user)(p.user) : p.user
      }));
      res.json(participantsWithoutPasswords);
    } catch (error) {
      console.error("Get admin participants error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test Attempt Routes
  app.post("/api/events/:eventId/rounds/:roundId/start", requireAuth, requireParticipant, async (req: AuthRequest, res: Response) => {
    try {
      const { roundId } = req.params;
      const userId = req.user!.id;

      // Check if user already has an attempt for this round
      const existingAttempt = await storage.getTestAttemptByUserAndRound(userId, roundId);
      if (existingAttempt) {
        return res.status(400).json({ message: "You already have an attempt for this round" });
      }

      // Get round to calculate max score
      const round = await storage.getRound(roundId);
      if (!round) {
        return res.status(404).json({ message: "Round not found" });
      }

      // Get questions to calculate max score
      const questions = await storage.getQuestionsByRound(roundId);
      const maxScore = questions.reduce((sum, q) => sum + q.points, 0);

      const attempt = await storage.createTestAttempt({
        roundId,
        userId,
        status: 'in_progress',
        tabSwitchCount: 0,
        refreshAttemptCount: 0,
        violationLogs: [],
        totalScore: 0,
        maxScore
      });

      res.status(201).json(attempt);
    } catch (error) {
      console.error("Start test attempt error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/attempts/:attemptId", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const attempt = await storage.getTestAttempt(req.params.attemptId);
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }

      // Only allow user to view their own attempt or admins
      if (attempt.userId !== req.user!.id && req.user!.role === 'participant') {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get round and questions
      const round = await storage.getRound(attempt.roundId);
      const questions = await storage.getQuestionsByRound(attempt.roundId);
      const answers = await storage.getAnswersByAttempt(attempt.id);

      res.json({
        ...attempt,
        round,
        questions,
        answers
      });
    } catch (error) {
      console.error("Get test attempt error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/attempts/:attemptId/answers", requireAuth, requireParticipant, async (req: AuthRequest, res: Response) => {
    try {
      const { attemptId } = req.params;
      const { questionId, answer } = req.body;

      if (!questionId || answer === undefined) {
        return res.status(400).json({ message: "Question ID and answer are required" });
      }

      const attempt = await storage.getTestAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }

      if (attempt.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (attempt.status !== 'in_progress') {
        return res.status(400).json({ message: "Test is not in progress" });
      }

      // Check if answer already exists
      const existingAnswers = await storage.getAnswersByAttempt(attemptId);
      const existingAnswer = existingAnswers.find(a => a.questionId === questionId);

      let savedAnswer;
      if (existingAnswer) {
        savedAnswer = await storage.updateAnswer(existingAnswer.id, { answer });
      } else {
        savedAnswer = await storage.createAnswer({
          attemptId,
          questionId,
          answer,
          isCorrect: false,
          pointsAwarded: 0
        });
      }

      res.json(savedAnswer);
    } catch (error) {
      console.error("Save answer error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/attempts/:attemptId/violations", requireAuth, requireParticipant, async (req: AuthRequest, res: Response) => {
    try {
      const { attemptId } = req.params;
      const { type } = req.body; // 'tab_switch', 'refresh', 'shortcut'

      const attempt = await storage.getTestAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }

      if (attempt.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (attempt.status !== 'in_progress') {
        return res.status(400).json({ message: "Test is not in progress" });
      }

      const violationLogs = (attempt.violationLogs as any[]) || [];
      violationLogs.push({
        type,
        timestamp: new Date().toISOString()
      });

      const updates: any = { violationLogs };

      if (type === 'tab_switch') {
        updates.tabSwitchCount = (attempt.tabSwitchCount || 0) + 1;
      } else if (type === 'refresh') {
        updates.refreshAttemptCount = (attempt.refreshAttemptCount || 0) + 1;
      }

      const updatedAttempt = await storage.updateTestAttempt(attemptId, updates);

      res.json(updatedAttempt);
    } catch (error) {
      console.error("Log violation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/attempts/:attemptId/submit", requireAuth, requireParticipant, async (req: AuthRequest, res: Response) => {
    try {
      const { attemptId } = req.params;

      const attempt = await storage.getTestAttempt(attemptId);
      if (!attempt) {
        return res.status(404).json({ message: "Test attempt not found" });
      }

      if (attempt.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (attempt.status !== 'in_progress') {
        return res.status(400).json({ message: "Test is already submitted" });
      }

      // Get questions and answers to calculate score
      const questions = await storage.getQuestionsByRound(attempt.roundId);
      const answers = await storage.getAnswersByAttempt(attemptId);

      let totalScore = 0;

      // Grade answers
      for (const answer of answers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) continue;

        let isCorrect = false;
        let pointsAwarded = 0;

        // Auto-grade multiple choice and true/false
        if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
          isCorrect = answer.answer.toLowerCase() === (question.correctAnswer || '').toLowerCase();
          pointsAwarded = isCorrect ? question.points : 0;
        }
        // For short answer and coding, require manual grading (set to 0 for now)
        else {
          isCorrect = false;
          pointsAwarded = 0;
        }

        totalScore += pointsAwarded;

        // Update answer with grading
        await storage.updateAnswer(answer.id, {
          isCorrect,
          pointsAwarded
        });
      }

      // Update attempt as completed
      const updatedAttempt = await storage.updateTestAttempt(attemptId, {
        status: 'completed',
        submittedAt: new Date(),
        completedAt: new Date(),
        totalScore
      });

      res.json(updatedAttempt);
    } catch (error) {
      console.error("Submit test error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/participants/my-attempts", requireAuth, requireParticipant, async (req: AuthRequest, res: Response) => {
    try {
      const attempts = await storage.getTestAttemptsByUser(req.user!.id);
      res.json(attempts);
    } catch (error) {
      console.error("Get my attempts error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Leaderboard Routes
  app.get("/api/rounds/:roundId/leaderboard", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { roundId } = req.params;
      const leaderboard = await storage.getRoundLeaderboard(roundId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Get round leaderboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:eventId/leaderboard", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.params;
      const leaderboard = await storage.getEventLeaderboard(eventId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Get event leaderboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/reports", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reports/generate/event", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { eventId } = req.body;
      
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      const report = await storage.generateEventReport(eventId, req.user!.id);
      res.status(201).json(report);
    } catch (error) {
      console.error("Generate event report error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Internal server error" });
    }
  });

  app.post("/api/reports/generate/symposium", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const report = await storage.generateSymposiumReport(req.user!.id);
      res.status(201).json(report);
    } catch (error) {
      console.error("Generate symposium report error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/reports/:id/download", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const report = await storage.getReport(id);

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, '_')}_${id}.json"`);
      res.json(report.reportData);
    } catch (error) {
      console.error("Download report error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/backfill-round-rules", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const events = await storage.getEvents();
      let processedCount = 0;
      let createdCount = 0;
      
      for (const event of events) {
        const rounds = await storage.getRoundsByEvent(event.id);
        
        for (const round of rounds) {
          processedCount++;
          const existingRules = await storage.getRoundRules(round.id);
          
          if (!existingRules) {
            await storage.createRoundRules({
              roundId: round.id,
              noRefresh: true,
              noTabSwitch: true,
              forceFullscreen: true,
              disableShortcuts: true,
              autoSubmitOnViolation: true,
              maxTabSwitchWarnings: 2,
              additionalRules: null
            });
            createdCount++;
          }
        }
      }

      res.json({ 
        message: "Backfill completed successfully",
        processedRounds: processedCount,
        createdRules: createdCount
      });
    } catch (error) {
      console.error("Backfill round rules error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/registration-forms", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const { title, description, formFields } = req.body;
      
      if (!title || !formFields || !Array.isArray(formFields)) {
        return res.status(400).json({ message: "Title and formFields are required" });
      }
      
      const slug = generateFormSlug(title);
      const form = await storage.createRegistrationForm(title, description || '', formFields, slug);
      
      res.status(201).json(form);
    } catch (error) {
      console.error("Create registration form error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/registration-forms/active", async (req: Request, res: Response) => {
    try {
      const form = await storage.getActiveRegistrationForm();
      if (!form) {
        return res.status(404).json({ message: "No active registration form found" });
      }
      res.json(form);
    } catch (error) {
      console.error("Get active registration form error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/registration-forms/:id", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const updates = req.body;
      const form = await storage.updateRegistrationForm(req.params.id, updates);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      res.json(form);
    } catch (error) {
      console.error("Update registration form error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/registration-forms/all", requireAuth, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const forms = await storage.getAllRegistrationForms();
      res.json(forms);
    } catch (error) {
      console.error("Get all registration forms error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/registration-forms/:slug", async (req: Request, res: Response) => {
    try {
      const form = await storage.getRegistrationFormBySlug(req.params.slug);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      res.json(form);
    } catch (error) {
      console.error("Get registration form error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/registration-forms/:slug/submit", async (req: Request, res: Response) => {
    try {
      const form = await storage.getRegistrationFormBySlug(req.params.slug);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      
      if (!form.isActive) {
        return res.status(400).json({ message: 'This form is no longer accepting submissions' });
      }
      
      const { submittedData, selectedEvents } = req.body;
      
      if (!submittedData || !selectedEvents || !Array.isArray(selectedEvents)) {
        return res.status(400).json({ message: "submittedData and selectedEvents are required" });
      }

      const events = await storage.getEventsByIds(selectedEvents);
      const invalidEvents = events.filter(event => 
        !form.allowedCategories.includes(event.category)
      );
      
      if (invalidEvents.length > 0) {
        return res.status(400).json({ 
          message: `The following events are not allowed by this form: ${invalidEvents.map(e => e.name).join(', ')}` 
        });
      }

      const validation = await validateEventSelection(selectedEvents);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.error });
      }
      
      const registration = await storage.createRegistration(form.id, submittedData, selectedEvents);
      res.status(201).json(registration);
    } catch (error) {
      console.error("Submit registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/registrations", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      if (user.role !== 'super_admin' && user.role !== 'registration_committee') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const registrations = await storage.getRegistrations();
      res.json(registrations);
    } catch (error) {
      console.error("Get registrations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/registrations/:id/approve", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      if (user.role !== 'super_admin' && user.role !== 'registration_committee') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const registration = await storage.getRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: 'Registration not found' });
      }

      if (registration.paymentStatus !== 'pending') {
        return res.status(400).json({ message: 'Registration has already been processed' });
      }
      
      const password = generateSecurePassword();
      const userData = registration.submittedData;
      
      const extractEmail = (data: Record<string, string>): string => {
        for (const value of Object.values(data)) {
          if (value && typeof value === 'string' && value.includes('@') && value.includes('.')) {
            return value;
          }
        }
        throw new Error('Email not found in registration data');
      };
      
      const extractFullName = (data: Record<string, string>): string => {
        for (const value of Object.values(data)) {
          if (value && typeof value === 'string' && value.includes(' ') && !value.includes('@')) {
            return value;
          }
        }
        return 'Participant';
      };
      
      const email = extractEmail(userData);
      const fullName = extractFullName(userData);
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await storage.createUser({
        username: `DISABLED_${nanoid(16)}`,
        password: hashedPassword,
        email: email,
        fullName: fullName,
        role: 'participant',
      });
      
      const eventCredentialsList = [];
      
      for (const eventId of registration.selectedEvents) {
        await storage.createParticipant(newUser.id, eventId);
        
        const event = await storage.getEventById(eventId);
        if (!event) continue;
        
        const firstName = fullName.split(' ')[0].toLowerCase();
        const eventUsername = `${event.name.toLowerCase().replace(/\s+/g, '-').substring(0, 10)}-${firstName}-${nanoid(4)}`;
        const eventPassword = generateSecurePassword();
        
        await storage.createEventCredential(
          newUser.id,
          eventId,
          eventUsername,
          eventPassword
        );
        
        eventCredentialsList.push({
          eventId,
          eventName: event.name,
          eventUsername,
          eventPassword,
        });
      }
      
      const updated = await storage.updateRegistrationStatus(
        req.params.id,
        'paid',
        newUser.id,
        user.id
      );
      
      res.json({
        registration: updated,
        mainCredentials: {
          username: newUser.username,
          password: password,
          email: newUser.email,
        },
        eventCredentials: eventCredentialsList,
      });
    } catch (error) {
      console.error("Approve registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:eventId/event-credentials", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { eventId } = req.params;
      
      if (user.role === 'event_admin') {
        const isEventAdmin = await storage.isUserEventAdmin(user.id, eventId);
        if (!isEventAdmin) {
          return res.status(403).json({ message: 'Not authorized for this event' });
        }
      } else if (user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const credentials = await storage.getEventCredentialsByEvent(eventId);
      res.json(credentials);
    } catch (error) {
      console.error("Get event credentials error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/event-credentials/:credentialId/enable-test", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { credentialId } = req.params;
      
      const credential = await storage.getEventCredential(credentialId);
      if (!credential) {
        return res.status(404).json({ message: 'Event credential not found' });
      }
      
      if (user.role === 'event_admin') {
        const isEventAdmin = await storage.isUserEventAdmin(user.id, credential.eventId);
        if (!isEventAdmin) {
          return res.status(403).json({ message: 'Not authorized for this event' });
        }
      } else if (user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updatedCredential = await storage.updateEventCredentialTestStatus(credentialId, true, user.id);
      res.json(updatedCredential);
    } catch (error) {
      console.error("Enable test access error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/event-credentials/:credentialId/disable-test", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { credentialId } = req.params;
      
      const credential = await storage.getEventCredential(credentialId);
      if (!credential) {
        return res.status(404).json({ message: 'Event credential not found' });
      }
      
      if (user.role === 'event_admin') {
        const isEventAdmin = await storage.isUserEventAdmin(user.id, credential.eventId);
        if (!isEventAdmin) {
          return res.status(403).json({ message: 'Not authorized for this event' });
        }
      } else if (user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const updatedCredential = await storage.updateEventCredentialTestStatus(credentialId, false, user.id);
      res.json(updatedCredential);
    } catch (error) {
      console.error("Disable test access error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:eventId/credentials-status", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.user!;
      const { eventId } = req.params;
      
      if (user.role === 'event_admin') {
        const isEventAdmin = await storage.isUserEventAdmin(user.id, eventId);
        if (!isEventAdmin) {
          return res.status(403).json({ message: 'Not authorized for this event' });
        }
      } else if (user.role !== 'super_admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      const credentialsWithParticipants = await storage.getEventCredentialsWithParticipants(eventId);
      
      const result = credentialsWithParticipants.map(cred => ({
        id: cred.id,
        participantUserId: cred.participantUserId,
        eventUsername: cred.eventUsername,
        testEnabled: cred.testEnabled,
        enabledAt: cred.enabledAt,
        enabledBy: cred.enabledBy,
        participantFullName: cred.participant.fullName,
        participantEmail: cred.participant.email,
      }));
      
      res.json(result);
    } catch (error) {
      console.error("Get credentials status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
