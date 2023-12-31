import upperFirst from "lodash/upperFirst";
import type { DataAttribute, ShortScenario, Simulation, UUID } from "../types";

/**
 * Shorthand for checking the existence of a property on an object. Use the
 * Object prototype to prevent overridden usage, and potential security issues
 * when performing this on a (user-provided) JSON loaded object
 * @param obj
 * @param property
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasOwnProperty<O, K extends PropertyKey>(
  obj: O,
  property: K
): obj is O & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

export function hasUUID<T>(obj: T): obj is T & { uuid: UUID } {
  return hasOwnProperty(obj, "uuid") && typeof obj.uuid === "string";
}

export function excludeKeys<T, K extends (keyof T)[]>(obj: T, keys: K): Omit<T, K[number]> {
  const ret = {} as {
    [K in keyof T]: T[K];
  };
  let key: keyof T;
  for (key in obj) {
    if (!keys.includes(key)) {
      ret[key] = obj[key];
    }
  }
  return ret;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function excludeKey<T>(k: keyof T, { [k]: _, ...o }: T) {
  return o;
}

export function attributeString(property: DataAttribute | string): string {
  return typeof property === "string" ? property : property.name;
}

export function parseattributeString(val: string): DataAttribute {
  return { name: val };
}

export function getBaseURL(): string {
  return (
    window.location.protocol +
    "//" +
    window.location.hostname +
    (window.location.port ? `:${window.location.port}` : "") +
    window.location.pathname
  );
}

export function buildFlowUrl(name: string, query: Record<string, string | undefined> = {}) {
  return {
    name,
    query: extractDefinedValues(query) as Record<string, string>,
  };
}

function extractDefinedValues(obj: Record<string, string | undefined>) {
  return Object.entries(obj).reduce((prev, [key, val]) => {
    if (val) {
      prev[key] = val;
    }
    return prev;
  }, {} as Record<string, string>);
}

/**
 * Receives a dataset, scenario or dataset generator status and returns a Bulma class for the color
 * @param status
 */
export function getClassFromStatus(status: string): string {
  return "is-" + getVariantFromStatus(status);
}
export function getVariantFromStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "empty":
      return "warning";
    case "failed":
    case "unknown":
    case "invalid":
    case "cancelled":
      return "danger";
    case "ready":
    case "running":
    case "pending":
      return "info";
    case "succeeded":
    case "done":
      return "primary";
    default:
      return "white";
  }
}
export function getStatusFromScenarioAndSimulation(
  scenario: ShortScenario,
  simulation: Simulation
) {
  const allStatuses = ["failed", "invalid", "pending", "running", "succeeded", "ready", "unknown"];
  const scenarioStatus = getStatusOrUnknown(scenario).toLowerCase();
  const simulationStatus = getStatusOrUnknown(simulation).toLowerCase();
  for (let i = 0; i < allStatuses.length; i++) {
    const status = allStatuses[i];
    if (scenarioStatus === status || simulationStatus === status) {
      return upperFirst(status);
    }
  }
  return "unknown"; // should not get here
}

function getStatusOrUnknown(obj: ShortScenario | Simulation) {
  return obj.status ? obj.status : "Unknown";
}

/**
 * Sorts an array by a series of keys, ascending or descending
 * @param keys string[] - a string array of attributes of K, but appended with a minus (-) and (maybe) a plus (+) sign
 * @param allowNull boolean - if false will trigger error if the value of a key is null or undefined
 * @returns sorting order function
 */
export function sortByKeys<K>(keys: string[], allowNull = true) {
  const order: number[] = [];
  // remapping the keys, slicing the - or + sign if needed
  // also determines the order they will sorted by pushing into order
  keys = keys.map((key) => {
    const substr = key.substring(0, 1);
    if (["-", "+"].includes(substr)) {
      key = key.substring(1);
    }
    order.push(substr === "-" ? -1 : 1);
    return key;
  });

  return (a: K, b: K) => {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // checks if key exists
      if (hasOwnProperty(a, key) && hasOwnProperty(b, key)) {
        const rawValueA = a[key],
          rawValueB = b[key],
          isNullA = rawValueA == null,
          isNullB = rawValueB == null;

        // checks for null on each value
        if (!isNullA && !isNullB) {
          const getParsedValue = (val: unknown): string | number =>
              typeof val === "string" ? val.toUpperCase() : Number(val),
            valueA = getParsedValue(rawValueA),
            valueB = getParsedValue(rawValueB);

          // compares values
          if (valueA > valueB) {
            return order[i];
          }
          if (valueA < valueB) {
            return -order[i];
          }
        } else {
          // if there is a null, either trigger an error
          if (!allowNull) throw new Error(`Value is null on key ${key}`);
          //  or see which is null, and pull it to the bottom
          if (isNullA && !isNullB) return order[i];
          if (!isNullA && isNullB) return -order[i];
        }
      } else {
        // if there is an item without key, either trigger an error
        if (!allowNull) throw new Error(`Key ${key} does not exist on a item in the array`);
      }
    }

    return 0;
  };
}

export function arrayToMap<T>(items: T[], key: (i: T) => string): Record<string, T> {
  return items.reduce((result, item) => {
    result[key(item)] = item;
    return result;
  }, {} as Record<string, T>);
}
