import { describe, it, expect, beforeAll, afterAll } from "vitest";
import CaseService from "../src/Services/case.service.js";
import { connectForTesting, closeConnection } from "../src/Services/db.service.js";
import AuthService from "../src/Services/auth.service.js";
import randomString from "randomstring";

const customCharset = process.env.CUSTOM_CHARSET;

describe("Case service", () => {
  beforeAll(async () => {
    await connectForTesting();
  });

  afterAll(async () => {
    await closeConnection();
  });

  it("should get last case id", async () => {
    const lastCaseId = await CaseService.getLastCaseId({ service: 999 });
    console.log(lastCaseId);

    expect(lastCaseId).toBeDefined();
    expect(typeof lastCaseId).toBe("number");
  });
});

describe("Create token", () => {
  it("should create a token", async () => {
    const uid = randomString.generate({
      length: 6,
      charset: customCharset,
    });
    const token = await AuthService.createToken({ name: uid, days: 1 });
    console.log(token);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });
});
