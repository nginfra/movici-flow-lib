import {
  ComponentProperty,
  DatasetSummary,
  EntityGroupSummary,
  ShortScenario,
  Simulation
} from '@/flow/src/types';
import upperFirst from 'lodash/upperFirst';

/**
 * Shorthand for checking the existence of a property on an object. Use the
 * Object prototype to prevent overridden usage, and potential security issues
 * when performing this on a (user-provided) JSON loaded object
 * @param obj
 * @param property
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasOwnProperty<O extends any, K extends PropertyKey>(
  obj: O,
  property: K
): obj is O & Record<K, unknown> {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

export function propertyString(property: ComponentProperty): string {
  const base = property.component ? property.component + '/' : '';
  return base + property.name;
}

export function parsePropertyString(val: string): ComponentProperty {
  const parts = val.split('/');
  if (parts.length === 1) {
    return { name: parts[0], component: null };
  }
  if (parts.length === 2) {
    return { component: parts[0], name: parts[1] };
  }
  throw new Error(`Couldn't parse '${val}' as a valid property identifier`);
}

export function getEntitySummary(
  entityType: string,
  summary: DatasetSummary
): EntityGroupSummary | null {
  const index = summary.entity_groups.map(e => e.name).indexOf(entityType);
  if (index === -1) {
    return null;
  }
  return summary.entity_groups[index];
}

export function copyToClipboard(text: string) {
  const el = document.createElement('textarea');
  el.value = text;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

export function getBaseURL(): string {
  return (
    window.location.protocol +
    '//' +
    window.location.hostname +
    (window.location.port ? `:${window.location.port}` : '') +
    window.location.pathname
  );
}

/**
 * Receives a scenario status and returns a Bulma class for the color
 * @param status
 */
export function getClassFromStatus(status: string): string {
  let statusClass = 'is-';
  switch (status) {
    case 'Failed':
    case 'Unknown':
    case 'Invalid':
    case 'Cancelled':
      statusClass += 'danger';
      break;
    case 'Ready':
    case 'Running':
    case 'Pending':
      statusClass += 'info';
      break;
    case 'Succeeded':
      statusClass += 'primary';
      break;
  }
  return statusClass;
}

export function getStatusFromScenarioAndSimulation(
  scenario: ShortScenario,
  simulation: Simulation
) {
  const allStatuses = ['failed', 'invalid', 'pending', 'running', 'succeeded', 'ready', 'unknown'];
  const scenarioStatus = getStatusOrUnknown(scenario).toLowerCase();
  const simulationStatus = getStatusOrUnknown(simulation).toLowerCase();
  for (let i = 0; i < allStatuses.length; i++) {
    const status = allStatuses[i];
    if (scenarioStatus === status || simulationStatus === status) {
      return upperFirst(status);
    }
  }
  return 'unknown'; // should not get here
}

function getStatusOrUnknown(obj: ShortScenario | Simulation) {
  return obj.status ? obj.status : 'Unknown';
}
