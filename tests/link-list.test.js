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

// Mock StatsService
vi.mock("../src/Services/stats.service.js", () => ({
  default: {
    getStatsCountSMS: vi.fn(),
    getSMSList: vi.fn(),
  },
}));

// Mock logger
vi.mock("../../logger.js", () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("Link List Statistics", () => {
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
    StatsService.getStatsCountSMS.mockResolvedValue([{ count: 100 }]);
    StatsService.getSMSList.mockResolvedValue([
      {
        id: 1,
        recordId: 101,
        mobile: "0812345678",
        linkType: "video",
        userType: "user",
        crmSender: "Agent1",
        service: "emergency",
        organization: "Hospital A",
        dtmCreated: "2025-06-19 10:30:00",
        caseId: 1001,
      },
      {
        id: 2,
        recordId: 102,
        mobile: "0823456789",
        linkType: "location",
        userType: "admin",
        crmSender: "Agent2",
        service: "routine",
        organization: "Hospital B",
        dtmCreated: "2025-06-19 11:00:00",
        caseId: 1002,
      },
    ]);
  });

  describe("Date Time Formatting", () => {
    it("should format dateTimeStart with 00:00:00 when only date is provided", async () => {
      const response = await request(app).get("/stats/summary").query({
        dateTimeStart: "2025-06-19",
        dateTimeEnd: "2025-06-20",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getStatsCountSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          dateTimeStart: "2025-06-19 00:00:00",
          dateTimeEnd: "2025-06-20 23:59:59",
        }),
      );
    });

    it("should format dateTimeEnd with 23:59:59 when only date is provided", async () => {
      const response = await request(app).get("/stats/summary").query({
        dateTimeStart: "2025-01-01",
        dateTimeEnd: "2025-01-31",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getSMSList).toHaveBeenCalledWith(
        expect.objectContaining({
          dateTimeStart: "2025-01-01 00:00:00",
          dateTimeEnd: "2025-01-31 23:59:59",
        }),
      );
    });

    it("should not modify datetime when full datetime is provided", async () => {
      const response = await request(app).get("/stats/summary").query({
        dateTimeStart: "2025-06-19 08:30:15",
        dateTimeEnd: "2025-06-19 17:45:30",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getStatsCountSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          dateTimeStart: "2025-06-19 08:30:15",
          dateTimeEnd: "2025-06-19 17:45:30",
        }),
      );
    });

    it("should handle mixed date formats correctly", async () => {
      const response = await request(app).get("/stats/summary").query({
        dateTimeStart: "2025-06-19",
        dateTimeEnd: "2025-06-20 15:30:45",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getSMSList).toHaveBeenCalledWith(
        expect.objectContaining({
          dateTimeStart: "2025-06-19 00:00:00",
          dateTimeEnd: "2025-06-20 15:30:45",
        }),
      );
    });
  });

  describe("Sort Parameter Validation", () => {
    it("should use default sort parameters when none provided", async () => {
      const response = await request(app).get("/stats/summary");

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getStatsCountSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "dtmCreated",
          sortOrder: "DESC",
        }),
      );
    });

    it("should accept valid sort parameters", async () => {
      const response = await request(app).get("/stats/summary").query({
        sortBy: "mobile",
        sortOrder: "ASC",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getSMSList).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "mobile",
          sortOrder: "ASC",
        }),
      );
    });

    it("should normalize sortOrder to uppercase", async () => {
      const response = await request(app).get("/stats/summary").query({
        sortBy: "organization",
        sortOrder: "asc",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getStatsCountSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "organization",
          sortOrder: "ASC",
        }),
      );
    });

    it("should default invalid sortBy to dtmCreated", async () => {
      const response = await request(app).get("/stats/summary").query({
        sortBy: "invalidField",
        sortOrder: "DESC",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getSMSList).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "dtmCreated",
          sortOrder: "DESC",
        }),
      );
    });

    it("should default invalid sortOrder to DESC", async () => {
      const response = await request(app).get("/stats/summary").query({
        sortBy: "mobile",
        sortOrder: "INVALID",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getStatsCountSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: "mobile",
          sortOrder: "DESC",
        }),
      );
    });

    it("should test all valid sort fields", async () => {
      const validSortFields = ["dtmCreated", "mobile", "linkType", "userType", "service", "organization"];

      for (const sortField of validSortFields) {
        vi.clearAllMocks();

        const response = await request(app).get("/stats/summary").query({
          sortBy: sortField,
          sortOrder: "ASC",
        });

        expect(response.status).toBe(200);

        const { default: StatsService } = await import("../src/Services/stats.service.js");
        expect(StatsService.getStatsCountSMS).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: sortField,
            sortOrder: "ASC",
          }),
        );
      }
    });
  });

  describe("Combined Filters and Sort", () => {
    it("should handle all parameters together with date formatting and sorting", async () => {
      const response = await request(app).get("/stats/summary").query({
        dateTimeStart: "2025-06-19",
        dateTimeEnd: "2025-06-20",
        linkType: "video",
        userType: "user",
        search: "Agent",
        service: "emergency",
        organization: "Hospital",
        mobile: "081",
        crmSender: "Agent1",
        sortBy: "mobile",
        sortOrder: "ASC",
        limit: "50",
        page: "2",
      });

      expect(response.status).toBe(200);

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getStatsCountSMS).toHaveBeenCalledWith(
        expect.objectContaining({
          dateTimeStart: "2025-06-19 00:00:00",
          dateTimeEnd: "2025-06-20 23:59:59",
          linkType: "video",
          userType: "user",
          search: "Agent",
          service: "emergency",
          organization: "Hospital",
          mobile: "081",
          crmSender: "Agent1",
          sortBy: "mobile",
          sortOrder: "ASC",
        }),
      );

      expect(StatsService.getSMSList).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 50, // (page-1) * limit = (2-1) * 50
          dateTimeStart: "2025-06-19 00:00:00",
          dateTimeEnd: "2025-06-20 23:59:59",
          linkType: "video",
          userType: "user",
          search: "Agent",
          service: "emergency",
          organization: "Hospital",
          mobile: "081",
          crmSender: "Agent1",
          sortBy: "mobile",
          sortOrder: "ASC",
        }),
      );
    });
  });

  describe("Pagination", () => {
    it("should handle valid pagination parameters", async () => {
      const response = await request(app).get("/stats/summary").query({
        limit: "25",
        page: "3",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        currentPage: 3,
        limit: 25,
        totalPages: 4, // Math.ceil(100/25)
      });

      const { default: StatsService } = await import("../src/Services/stats.service.js");
      expect(StatsService.getSMSList).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 25,
          offset: 50, // (3-1) * 25
        }),
      );
    });

    it("should enforce maximum limit of 500", async () => {
      const response = await request(app).get("/stats/summary").query({
        limit: "1000",
      });

      expect(response.status).toBe(200);
      expect(response.body.limit).toBe(500);
    });

    it("should handle invalid pagination gracefully", async () => {
      const response = await request(app).get("/stats/summary").query({
        limit: "invalid",
        page: "-5",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        currentPage: 1,
        limit: 100,
      });
    });
  });

  describe("Response Format", () => {
    it("should return correct response structure", async () => {
      const response = await request(app).get("/stats/summary");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("count");
      expect(response.body).toHaveProperty("currentPage");
      expect(response.body).toHaveProperty("totalPages");
      expect(response.body).toHaveProperty("limit");
      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should handle empty results", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      StatsService.getStatsCountSMS.mockResolvedValue([{ count: 0 }]);
      StatsService.getSMSList.mockResolvedValue([]);

      const response = await request(app).get("/stats/summary");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        count: 0,
        currentPage: 1,
        totalPages: 0,
        limit: 100,
        data: [],
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle service errors gracefully", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      StatsService.getStatsCountSMS.mockRejectedValue(new Error("Database connection failed"));

      const response = await request(app).get("/stats/summary");

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "An error occurred while fetching statistics",
      });
    });

    it("should handle null count result", async () => {
      const { default: StatsService } = await import("../src/Services/stats.service.js");
      StatsService.getStatsCountSMS.mockResolvedValue([]);

      const response = await request(app).get("/stats/summary");

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });
  });
});
