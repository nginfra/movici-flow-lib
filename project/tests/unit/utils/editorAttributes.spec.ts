import { attributeValueKind, isRestrictedAttribute } from "@movici-flow-lib/utils/editorAttributes";
import { describe, it, expect } from "vitest";

describe("isRestrictedAttribute", () => {
  it("restricts always-restricted attributes without configuration", () => {
    expect(isRestrictedAttribute("id")).toBe(true);
    expect(isRestrictedAttribute("deleted")).toBe(true);
  });
  it("restricts geometry attributes without configuration", () => {
    expect(isRestrictedAttribute("geometry.x")).toBe(true);
    expect(isRestrictedAttribute("geometry.polygon")).toBe(true);
  });
  it("does not restrict a bare geometry attribute", () => {
    expect(isRestrictedAttribute("geometry")).toBe(false);
  });
  it("is case sensitive", () => {
    expect(isRestrictedAttribute("ID")).toBe(false);
  });
  it("restricts a configured attribute", () => {
    expect(isRestrictedAttribute("shape.length", ["shape.length"])).toBe(true);
  });
  it("does not restrict an unconfigured attribute", () => {
    expect(isRestrictedAttribute("shape.width", ["shape.length"])).toBe(false);
  });
});

describe("attributeValueKind", () => {
  it("maps numeric types to number", () => {
    expect(attributeValueKind("integer")).toBe("number");
    expect(attributeValueKind("float")).toBe("number");
  });
  it("maps string to string", () => {
    expect(attributeValueKind("string")).toBe("string");
  });
  it("maps boolean to boolean", () => {
    expect(attributeValueKind("boolean")).toBe("boolean");
  });
});
