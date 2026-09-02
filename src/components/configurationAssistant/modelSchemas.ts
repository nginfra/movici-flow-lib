export type JsonSchema = {
  $ref?: string;
  oneOf?: JsonSchema[];
  type?: string | string[];
  enum?: string[];
  const?: unknown;
  default?: unknown;
  required?: string[];
  properties?: Record<string, JsonSchema | boolean>;
  $defs?: Record<string, JsonSchema>;
  definitions?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema | JsonSchema[];
  minItems?: number;
  maxItems?: number;
  "movici.type"?: string;
  "movici.datasetType"?: string;
  description?: string;
};

const schemaModules = import.meta.glob(
  "../../../../../../movici-simulation-core/packages/simulation-core/src/movici_simulation_core/json_schemas/models/*.json",
  {
    eager: true,
    import: "default",
  },
);

export const modelSchemas: Record<string, JsonSchema> = Object.fromEntries(
  Object.entries(schemaModules).map(([path, schema]) => [
    path.substring(path.lastIndexOf("/") + 1).replace(/\.json$/, ""),
    schema as JsonSchema,
  ]),
);

export const MODEL_SCHEMA_TYPES = Object.keys(modelSchemas).sort();
