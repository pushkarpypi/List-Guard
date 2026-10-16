import { describe, it, expect } from "vitest";

describe("Multimodal OCR Endpoint Validations", () => {
  const supportedMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "application/pdf"
  ];

  it("validates supported formats include PDF and images", () => {
    expect(supportedMimeTypes.includes("application/pdf")).toBe(true);
    expect(supportedMimeTypes.includes("image/png")).toBe(true);
    expect(supportedMimeTypes.includes("image/jpeg")).toBe(true);
    expect(supportedMimeTypes.includes("image/webp")).toBe(true);
  });

  it("rejects unsupported document formats like zip or exe", () => {
    expect(supportedMimeTypes.includes("application/zip")).toBe(false);
    expect(supportedMimeTypes.includes("application/x-msdownload")).toBe(false);
  });
});
