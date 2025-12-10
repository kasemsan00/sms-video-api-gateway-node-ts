import { it, beforeAll, describe, afterAll, expect } from "vitest";
import IDEMSController from "../src/Custom/idems.controller.js";
import ShareService from "../src/Services/share.service.js";

const { ippbxBranchCheck } = IDEMSController;

const BRANCH = "1";

describe("Test ippbx branch check", () => {
  it("should check ippbx branch", async () => {
    const respIppbxBranchCheck = await ippbxBranchCheck({ branch: BRANCH });
    console.log("respIppbxBranchCheck", respIppbxBranchCheck);
    expect(respIppbxBranchCheck).toBeDefined();
  });
});

describe("Check service detail", () => {
  it("should check service detail", async () => {
    const respServiceVideo = await ShareService.getServiceDetail({ service: 999, type: "video" });
    console.log("respServiceVideo", respServiceVideo);
    expect(respServiceVideo).toBeDefined();
    expect(respServiceVideo.domains).toBeDefined();
    expect(respServiceVideo.prefixTextSMS).toBeDefined();

    const respServiceLocation = await ShareService.getServiceDetail({ service: 999, type: "location" });
    console.log("respServiceLocation", respServiceLocation);
    expect(respServiceLocation).toBeDefined();
    expect(respServiceLocation.domains).toBeDefined();
    expect(respServiceLocation.prefixTextSMS).toBeDefined();

    const respServiceDefault = await ShareService.getServiceDetail({ service: -1, type: "default" });
    console.log("respServiceDefault", respServiceDefault);
    expect(respServiceDefault).toBeDefined();
    expect(respServiceDefault).toBeNull();
  });
});
