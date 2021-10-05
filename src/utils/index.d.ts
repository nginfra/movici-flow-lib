import { ComponentProperty, DatasetSummary, EntityGroupSummary, ShortScenario, Simulation } from '@/types';
/**
 * Shorthand for checking the existence of a property on an object. Use the
 * Object prototype to prevent overridden usage, and potential security issues
 * when performing this on a (user-provided) JSON loaded object
 * @param obj
 * @param property
 * @returns {boolean}
 */
export declare function hasOwnProperty<O extends any, K extends PropertyKey>(obj: O, property: K): obj is O & Record<K, unknown>;
export declare function propertyString(property: ComponentProperty): string;
export declare function parsePropertyString(val: string): ComponentProperty;
export declare function getEntitySummary(entityType: string, summary: DatasetSummary): EntityGroupSummary | null;
export declare function copyToClipboard(text: string): void;
export declare function getBaseURL(): string;
/**
 * Receives a scenario status and returns a Bulma class for the color
 * @param status
 */
export declare function getClassFromStatus(status: string): string;
export declare function getStatusFromScenarioAndSimulation(scenario: ShortScenario, simulation: Simulation): string;
