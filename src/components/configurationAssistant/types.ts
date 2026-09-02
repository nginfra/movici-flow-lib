import type { JsonSchema } from "./modelSchemas";

export interface ModelTypeOption {
  value: string;
  label: string;
}

export type SchemaKind =
  | "array"
  | "attribute"
  | "attributeMap"
  | "dataset"
  | "entityGroup"
  | "object"
  | "value";

export interface SchemaField {
  key: string;
  schema: JsonSchema;
  required: boolean;
}
