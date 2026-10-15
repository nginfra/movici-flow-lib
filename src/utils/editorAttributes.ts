export type AttributeValueType = "integer" | "float" | "string" | "boolean";
export type AttributeValueKind = "number" | "string" | "boolean";

export function attributeValueKind(type: AttributeValueType): AttributeValueKind {
  return type === "integer" || type === "float" ? "number" : type;
}

// Projects attributes from deletion operations on all datasets
export const ALWAYS_RESTRICTED_ATTRIBUTES = ["id", "deleted"] as const;
export function isGeometryAttribute(name: string): boolean {
  return name.startsWith("geometry.");
}

export function isRestrictedAttribute(name: string, configured: Iterable<string> = []): boolean {
  if ((ALWAYS_RESTRICTED_ATTRIBUTES as readonly string[]).includes(name)) return true;
  if (isGeometryAttribute(name)) return true;
  for (const restricted of configured) {
    if (restricted === name) return true;
  }
  return false;
}
