import { cloneDeep } from "lodash";
import type { JsonSchema } from "./modelSchemas";
import type { SchemaKind } from "./types";

export function getSchemaProperties(schema: JsonSchema): [string, JsonSchema][] {
  const properties: [string, JsonSchema][] = [];

  for (const [name, propertySchema] of Object.entries(schema.properties ?? {})) {
    if (typeof propertySchema === "boolean") continue;
    properties.push([name, propertySchema]);
  }

  return properties;
}

export function normalizeSchema(schema: JsonSchema, rootSchema: JsonSchema): JsonSchema {
  const resolvedSchema = resolveSchema(schema, rootSchema);
  if (!resolvedSchema.oneOf?.length) return resolvedSchema;
  if (hasRenderableShape(resolvedSchema)) return resolvedSchema;

  const arrayOption = resolvedSchema.oneOf.find(
    (option) => resolveSchema(option, rootSchema).type === "array",
  );
  const nonNullOption = resolvedSchema.oneOf.find(
    (option) => resolveSchema(option, rootSchema).type !== "null",
  );

  return resolveSchema(arrayOption ?? nonNullOption ?? resolvedSchema.oneOf[0]!, rootSchema);
}

export function resolveSchema(schema: JsonSchema, rootSchema: JsonSchema): JsonSchema {
  if (!schema.$ref) return schema;

  const path = schema.$ref.replace(/^#\//, "").split("/");
  let current: unknown = rootSchema;
  for (const part of path) {
    if (!isJsonSchemaObject(current)) return schema;
    current = (current as Record<string, unknown>)[part];
  }

  return isJsonSchemaObject(current) ? current : schema;
}

export function transformDatasetReferences(
  value: unknown,
  schema: JsonSchema,
  transform: (datasetName: string) => string,
) {
  return transformSchemaDatasetReferences(value, schema, schema, transform);
}

function transformSchemaDatasetReferences(
  value: unknown,
  schema: JsonSchema,
  rootSchema: JsonSchema,
  transform: (datasetName: string) => string,
): unknown {
  const resolvedSchema = resolveSchemaForValue(schema, rootSchema, value);

  if (resolvedSchema["movici.type"] === "dataset") {
    return typeof value === "string" ? transform(value) : value;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      const itemSchema = Array.isArray(resolvedSchema.items)
        ? resolvedSchema.items[index]
        : resolvedSchema.items;
      if (!itemSchema) return;

      const nextEntry = transformSchemaDatasetReferences(entry, itemSchema, rootSchema, transform);
      if (nextEntry !== entry) value[index] = nextEntry;
    });

    return value;
  }

  if (isJsonSchemaObject(value)) {
    const objectValue = value as Record<string, unknown>;
    Object.entries(objectValue).forEach(([key, entry]) => {
      const propertySchema = resolvedSchema.properties?.[key];
      const additionalPropertySchema = resolvedSchema.additionalProperties;
      const entrySchema =
        propertySchema === undefined
          ? isJsonSchemaObject(additionalPropertySchema)
            ? additionalPropertySchema
            : undefined
          : isJsonSchemaObject(propertySchema)
            ? propertySchema
            : undefined;
      if (!entrySchema) return;

      const nextEntry = transformSchemaDatasetReferences(entry, entrySchema, rootSchema, transform);
      if (nextEntry !== entry) objectValue[key] = nextEntry;
    });
  }

  return value;
}

export function resolveSchemaForValue(
  schema: JsonSchema,
  rootSchema: JsonSchema,
  value: unknown,
): JsonSchema {
  const resolvedSchema = resolveSchema(schema, rootSchema);
  if (!resolvedSchema.oneOf?.length || hasRenderableShape(resolvedSchema)) {
    return resolvedSchema;
  }

  const matchingOption = resolvedSchema.oneOf
    .map((option) => resolveSchema(option, rootSchema))
    .find((option) => schemaMatchesValue(option, value));

  return matchingOption
    ? resolveSchemaForValue(matchingOption, rootSchema, value)
    : normalizeSchema(resolvedSchema, rootSchema);
}

function schemaMatchesValue(schema: JsonSchema, value: unknown) {
  if (schema.const !== undefined) return schema.const === value;
  if (schema.enum?.length) return schema.enum.includes(value as string);

  const schemaTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
  return schemaTypes.some((type) => {
    if (type === "array") return Array.isArray(value);
    if (type === "object") return isJsonSchemaObject(value);
    if (type === "null") return value === null;
    if (type === "integer") return typeof value === "number" && Number.isInteger(value);
    return type === typeof value;
  });
}

export function getDefaultConfig(schema?: JsonSchema | null) {
  if (!schema) return {};

  const requiredFields = new Set(schema.required ?? []);
  return Object.fromEntries(
    getSchemaProperties(schema)
      .filter(
        ([key, fieldSchema]) =>
          requiredFields.has(key) || normalizeSchema(fieldSchema, schema).default !== undefined,
      )
      .map(([key, fieldSchema]) => [key, schemaDefaultValue(fieldSchema, schema)]),
  );
}

export function schemaDefaultValue(schema: JsonSchema, rootSchema: JsonSchema): unknown {
  const resolvedSchema = normalizeSchema(schema, rootSchema);

  if (resolvedSchema.default !== undefined) return cloneDeep(resolvedSchema.default);
  if (resolvedSchema.enum?.length) return resolvedSchema.enum[0];

  const schemaKind = getSchemaKind(resolvedSchema, rootSchema);
  if (schemaKind === "entityGroup") return ["", ""];
  if (schemaKind === "dataset" || schemaKind === "attribute") return "";

  if (schemaKind === "array") {
    if (Array.isArray(resolvedSchema.items)) {
      return resolvedSchema.items.map((itemSchema) => schemaDefaultValue(itemSchema, rootSchema));
    }

    const itemSchema = resolvedSchema.items ?? {};
    const length = Math.max(resolvedSchema.minItems ?? 0, 0);

    return Array.from({ length }, () => schemaDefaultValue(itemSchema, rootSchema));
  }

  if (schemaKind === "object") return getDefaultConfig(resolvedSchema);
  if (resolvedSchema.type === "boolean") return false;
  if (resolvedSchema.type === "number" || resolvedSchema.type === "integer") return undefined;

  return "";
}

export function getSchemaKind(schema: JsonSchema, rootSchema: JsonSchema): SchemaKind {
  const resolvedSchema = normalizeSchema(schema, rootSchema);

  if (isEntityGroupSchema(resolvedSchema, rootSchema)) return "entityGroup";
  if (resolvedSchema["movici.type"] === "dataset") return "dataset";
  if (resolvedSchema["movici.type"] === "attribute") return "attribute";

  if (isType(resolvedSchema.type, "object")) {
    const additionalProperties = resolvedSchema.additionalProperties;
    if (
      isJsonSchemaObject(additionalProperties) &&
      getSchemaKind(additionalProperties, rootSchema) === "attribute"
    ) {
      return "attributeMap";
    }

    return "object";
  }

  return isType(resolvedSchema.type, "array") ? "array" : "value";
}

function hasRenderableShape(schema: JsonSchema): boolean {
  return (
    schema.type !== undefined ||
    schema.properties !== undefined ||
    schema.items !== undefined ||
    schema.additionalProperties !== undefined
  );
}

export function isEntityGroupSchema(schema: JsonSchema, rootSchema: JsonSchema): boolean {
  if (!isType(schema.type, "array")) return false;
  if (!Array.isArray(schema.items) || schema.items.length !== 2) return false;

  const [datasetSchema, entityGroupSchema] = schema.items;
  if (!datasetSchema || !entityGroupSchema) return false;

  return (
    getSchemaKind(datasetSchema, rootSchema) === "dataset" &&
    resolveSchema(entityGroupSchema, rootSchema)["movici.type"] === "entityGroup"
  );
}

export function isJsonSchemaObject(value: unknown): value is JsonSchema {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isType(value: unknown, type: string) {
  return Array.isArray(value) ? value.includes(type) : value === type;
}
