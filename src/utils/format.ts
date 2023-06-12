export type Formatter = (
  val: unknown,
  dataType: string[],
  formatters?: Record<string, Formatter>
) => string;

export function formatValueByDataType(
  value: unknown,
  dataType: string,
  formatters?: Record<string, Formatter>
): string {
  const dt_tokens = parseDataType(dataType);
  const rows = formatValueRecursive(value, dt_tokens, formatters);
  return typeof rows === "string" ? rows : formatRows(rows);
}

function parseDataType(dataType: string): string[] {
  const tokens = dataType.replaceAll(">", "").replaceAll("<", ",").toUpperCase().split(",");
  let dimensions = 0;
  for (const tok of tokens) {
    if ((tok === "TUPLE" || tok === "LIST") && ++dimensions > 2) {
      throw new Error("Unsupported data type, too many dimensions");
    }
  }

  return tokens;
}

type NestedRows = Array<string | NestedRows>;

function formatValueRecursive(
  value: unknown,
  dataType: string[],
  formatters?: Record<string, Formatter>
): NestedRows | string {
  if (value == null) {
    // catches both null and undefined
    return formatters?.NULL?.(value, dataType) ?? "null";
  }
  const customFormatter = formatters ? formatters[dataType[0]] : null;
  if (customFormatter) return customFormatter(value, dataType.splice(1), formatters);

  switch (dataType[0]) {
    case "BOOLEAN":
      return formatBool(value);
    case "INT":
      return formatInt(value, dataType, formatters?.ENUM);
    case "FLOAT":
    case "DOUBLE":
      return formatFloat(value);
    case "LIST":
    case "TUPLE":
      return formatList(value, dataType.splice(1), formatters);
    default:
      return String(value);
  }
}

function formatInt(value: unknown, dataType: string[], formatEnum?: Formatter): string {
  const num = Number(value);
  return formatEnum ? formatEnum(num, dataType) : String(num);
}

function formatBool(value: unknown): string {
  return value ? "true" : "false";
}

function formatFloat(value: unknown): string {
  const num = Number(value);
  if (num !== 0) {
    if (Math.abs(num) < 1e-3 || Math.abs(num) > 1e6) {
      // if value is very small or very big, then show as scientific notation
      const [base, exp] = num.toExponential().replaceAll("+", "").split("e");
      return Number(base).toFixed(3) + "e" + exp;
    } else {
      // float numbers show 3 decimals tops
      // check if decimals are non 0
      const decimals = countDecimals(num, 3);
      return num.toFixed(decimals);
    }
  }
  return String(num);
}

function formatList(
  value: unknown,
  nestedType: string[],
  formatters?: Record<string, Formatter>
): NestedRows {
  if (!Array.isArray(value)) {
    value = [value];
  }
  return (value as unknown[]).map((v) => formatValueRecursive(v, nestedType, formatters));
}

const BRACKET_OPEN = "[";
const BRACKET_CLOSE = "]";
const SPACE = " ";
const NEWLINE = "\n";
const COMMA = ",";
const TRUNCATE = "...";

// Estimate the average character width in number of spaces. Obtained by trial and error. Used
// for right-aligned indentation to determine the (max) line width in number of spaces
const REL_CHAR_WIDTH = 2.3;

function formatRows(rows: NestedRows): string {
  const lines = generateLines(rows);
  return lines.join(NEWLINE);
}

function generateLines(rows: NestedRows): string[] {
  if (!rows.length || typeof rows[0] === "string") {
    return [generateInnerLine(rows as string[])];
  }

  let lines = rows.flatMap((r) => generateLines(r as NestedRows)).map((line) => line + COMMA);
  let truncated = false;
  if (lines.length > 5) {
    lines = lines.slice(0, 4);
    truncated = true;
  }

  const maxLen = Math.max(...lines.map((l) => l.length));
  const trailingSpaces = Math.floor(maxLen * REL_CHAR_WIDTH);
  if (truncated) {
    lines.push(TRUNCATE + SPACE.repeat(Math.floor(trailingSpaces - 3 * REL_CHAR_WIDTH)));
  }
  return [
    BRACKET_OPEN + SPACE.repeat(trailingSpaces),
    ...lines,
    BRACKET_CLOSE + SPACE.repeat(trailingSpaces),
  ];
}

function generateInnerLine(row: string[]): string {
  if (!row.length) {
    return BRACKET_OPEN + SPACE + BRACKET_CLOSE;
  }
  return BRACKET_OPEN + SPACE + row.join(COMMA + SPACE) + SPACE + BRACKET_CLOSE;
}

function countDecimals(value: number, max?: number) {
  if (Math.floor(value) === value) return 0;
  let rv = value.toString().split(".")[1].length || 0;
  if (max !== undefined) {
    rv = Math.min(rv, max);
  }
  return rv;
}
