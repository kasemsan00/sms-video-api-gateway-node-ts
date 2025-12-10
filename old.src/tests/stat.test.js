import { it, beforeAll, describe, afterAll, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";
import { connectForTesting, closeConnection } from "../src/Services/db.service.js";
import StatisticsController from "../src/Controllers/statistics.controller.js";

// Create Express app for testing
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add routes for testing
app.get("/stats/summary", StatisticsController.getStatsSummary);
app.get("/stats/device", StatisticsController.getStatsDevice);
app.get("/stats/type-sms", StatisticsController.getStatsTypeSMS);
app.get("/stats/generate", StatisticsController.generate);
app.get("/stats/user", StatisticsController.user);

// Mock StatsService
vi.mock("../src/Services/stats.service.js", () => ({
  default: {
    getStatsCountSMS: vi.fn(),
    getSMSList: vi.fn(),
    getStatsOSDevice: vi.fn(),
    getStatsTypeSMS: vi.fn(),
    getLinkConnect: vi.fn(),
    getUserListInRoom: vi.fn(),
    getTrackPublished: vi.fn(),
    getUserIdentity: vi.fn(),
  },
}));

// Mock logger
vi.mock("../../logger.js", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Statistics Controller", () => {
  beforeAll(async () => {
    await connectForTesting();
  });

  afterAll(async () => {
    await closeConnection();
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup default mocks
    const { default: StatsService } = await import("../src/Services/stats.service.js");
    StatsService.getStatsCountSMS.mockResolvedValue([{ count: 150 }]);
    StatsService.getSMSList.mockResolvedValue([
      {
        id: 1,
        recordId: 101,
        mobile: "0812345678",
        linkType: "video",
        userType: "user",
        crmSender: "Agent 1",
        room: "ROOM001",
        dtmCreated: "2024-01-15 10:30:00",
        caseId: 1001,
      },
      {
        id: 2,
        recordId: 102,
        mobile: "0823456789",
        linkType: "location",
        userType: "admin",
        crmSender: "Agent 2",
        room: "ROOM002",
        dtmCreated: "2024-01-15 11:00:00",
        caseId: 1002,
      },
    ]);
  });

  describe("GET /stats/summary - getStatsSummary", () => {
    it("should return statistics summary with default pagination", async () => {
      const response = await request(app).get("/stats/summary").query({
        linkType: "video",
        userType: "user",
        dateTimeStart: "2024-01-01",
        dateTimeEnd: "2024-01-31",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        count: 150,
        currentPage: 1,
        totalPages: 2, // Math.ceil(150/100)
        limit: 100,
        data: expect.any(Array),
      });
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toMatchObject({
        mobile: "0812345678",
        linkType: "video",
        caseId: 1001,
      });
    });

    it("should handle custom pagination parameters", async () => {
      const response = await request(app).get("/stats/summary").query({
        limit: "50",
        page: "2",
        linkType: "location",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        count: 150,
        currentPage: 2,
        totalPages: 3, // Math.ceil(150/50)
        limit: 50,
      });

      // Verify StatsService was called with correct offset
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getSMSList).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 50, // (page-1) * limit = (2-1) * 50
          linkType: "location",
        }),
      );
    });

    it("should handle invalid pagination parameters", async () => {
      const response = await request(app).get("/stats/summary").query({
        limit: "invalid",
        page: "-1",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        currentPage: 1, // Default page
        limit: 100, // Default limit
      });
    });

    it("should limit maximum results to 500", async () => {
      const response = await request(app).get("/stats/summary").query({
        limit: "2000", // Over the limit
      });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(500);
    });

    it("should handle search parameter", async () => {
      const response = await request(app).get("/stats/summary").query({
        search: "Agent",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getStatsCountSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Agent",
        }),
      );
    });

    it("should handle service errors gracefully", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      StatsService.getStatsCountSMS.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/stats/summary");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "An error occurred while fetching statistics",
      });
    });

    it("should handle empty count result", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      StatsService.getStatsCountSMS.mockResolvedValue([]);

      const response = await request(app).get("/stats/summary");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.totalPages).toBe(0);
    });
  });

  describe("GET /stats/device - getStatsDevice", () => {
    it("should return device statistics", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      const mockDeviceStats = [
        { os: "Android", COUNT: 25 },
        { os: "iOS", COUNT: 15 },
        { os: "Windows", COUNT: 10 },
      ];
      StatsService.getStatsOSDevice.mockResolvedValue(mockDeviceStats);

      const response = await request(app).get("/stats/device").query({
        dateTimeStart: "2024-01-01",
        dateTimeEnd: "2024-01-31",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDeviceStats);
      expect(StatsService.getStatsOSDevice).toHaveBeenCalledWith({
        dateTimeStart: "2024-01-01",
        dateTimeEnd: "2024-01-31",
      });
    });

    it("should work without date parameters", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      StatsService.getStatsOSDevice.mockResolvedValue([]);

      const response = await request(app).get("/stats/device");

      expect(response.status).toBe(200);
      expect(StatsService.getStatsOSDevice).toHaveBeenCalledWith({
        dateTimeStart: undefined,
        dateTimeEnd: undefined,
      });
    });
  });

  describe("GET /stats/type-sms - getStatsTypeSMS", () => {
    it("should return SMS type statistics", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      const mockSMSStats = [
        { linkType: "video", count: 45 },
        { linkType: "location", count: 25 },
      ];
      StatsService.getStatsTypeSMS.mockResolvedValue(mockSMSStats);

      const response = await request(app).get("/stats/type-sms").query({
        dateTimeStart: "2024-01-01",
        dateTimeEnd: "2024-01-31",
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSMSStats);
      expect(StatsService.getStatsTypeSMS).toHaveBeenCalledWith({
        dateTimeStart: "2024-01-01",
        dateTimeEnd: "2024-01-31",
      });
    });
  });

  describe("GET /stats/generate - generate", () => {
    it("should generate comprehensive statistics report", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");

      // Mock link connect data
      StatsService.getLinkConnect.mockResolvedValue([
        {
          linkID: "link-123",
          os: "Android",
          linkType: "video",
          dtmCreated: "2024-01-15 10:30:00",
          room: "ROOM001",
          latitude: 13.7563,
          longitude: 100.5018,
        },
      ]);

      // Mock user list
      StatsService.getUserListInRoom.mockResolvedValue([{ identity: "user-identity-1" }]);

      // Mock track published data
      StatsService.getTrackPublished.mockResolvedValue([
        {
          data: {
            track: { source: "CAMERA" },
          },
        },
        {
          data: {
            track: { source: "MICROPHONE" },
          },
        },
      ]);

      const response = await request(app).get("/stats/generate").query({
        os: "Android",
        dtmStart: "2024-01-01",
        dtmEnd: "2024-01-31",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveLength(1);
      expect(response.body[0][0]).toMatchObject({
        linkID: "link-123",
        os: "Android",
        type: "video",
        identity: "user-identity-1",
        video: 1,
        audio: 1,
        location: 1, // Has latitude/longitude
      });
    });

    it("should handle links without location data", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");

      StatsService.getLinkConnect.mockResolvedValue([
        {
          linkID: "link-456",
          os: "iOS",
          linkType: "video",
          dtmCreated: "2024-01-15 11:00:00",
          room: "ROOM002",
          latitude: null,
          longitude: null,
        },
      ]);

      StatsService.getUserListInRoom.mockResolvedValue([{ identity: "user-identity-2" }]);

      StatsService.getTrackPublished.mockResolvedValue([]);

      const response = await request(app).get("/stats/generate");

      expect(response.status).toBe(200);
      expect(response.body[0][0]).toMatchObject({
        linkID: "link-456",
        location: 0, // No location data
        video: 0,
        audio: 0,
      });
    });
  });

  describe("GET /stats/user - user", () => {
    it("should return user track information", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");

      StatsService.getUserIdentity.mockResolvedValue("user-identity-123");
      StatsService.getTrackPublished.mockResolvedValue([
        {
          data: {
            event: "track_published",
            participant: { identity: "user-identity-123" },
            track: { source: "CAMERA" },
          },
        },
      ]);

      const response = await request(app).get("/stats/user").query({ mobile: "0812345678" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        track_logs: expect.any(Array),
      });
      expect(response.body.track_logs).toHaveLength(1);
    });

    it("should handle invalid user", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      StatsService.getUserIdentity.mockResolvedValue(null);

      const response = await request(app).get("/stats/user").query({ mobile: "0999999999" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "invalid user",
      });
    });

    it("should handle missing mobile parameter", async () => {
      const response = await request(app).get("/stats/user");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "invalid user",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle StatsService errors in getStatsSummary", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      StatsService.getSMSList.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app).get("/stats/summary");

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("An error occurred while fetching statistics");
    });
  });
});
