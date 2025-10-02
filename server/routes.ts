import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { requireAuth, requireSuperAdmin, requireEventAdmin, requireParticipant, requireEventAccess, requireRoundAccess, type AuthRequest } from "./middleware/auth";

const JWT_SECRET = process.env.JWT_SECRET || "symposium-secret-key-change-in-production";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be set in production environment");
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

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { username, password, email, fullName, role } = req.body;
      
      if (!username || !password || !email || !fullName || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const validRoles = ["super_admin", "event_admin", "participant"];
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

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
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
          role: user.role
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

  app.get("/api/events", requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role === "super_admin") {
        const events = await storage.getEvents();
        res.json(events);
      } else if (req.user!.role === "event_admin") {
        const events = await storage.getEventsByAdmin(req.user!.id);
        res.json(events);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Get events error:", error);
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
      res.json(admins);
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

      res.status(201).json(round);
    } catch (error) {
      console.error("Create round error:", error);
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
      res.json(participants);
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

  const httpServer = createServer(app);

  return httpServer;
}
