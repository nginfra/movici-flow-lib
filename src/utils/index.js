"use strict";
exports.__esModule = true;
exports.getStatusFromScenarioAndSimulation = exports.getClassFromStatus = exports.getBaseURL = exports.copyToClipboard = exports.getEntitySummary = exports.parsePropertyString = exports.propertyString = exports.hasOwnProperty = void 0;
var upperFirst_1 = require("lodash/upperFirst");
/**
 * Shorthand for checking the existence of a property on an object. Use the
 * Object prototype to prevent overridden usage, and potential security issues
 * when performing this on a (user-provided) JSON loaded object
 * @param obj
 * @param property
 * @returns {boolean}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasOwnProperty(obj, property) {
    return Object.prototype.hasOwnProperty.call(obj, property);
}
exports.hasOwnProperty = hasOwnProperty;
function propertyString(property) {
    var base = property.component ? property.component + '/' : '';
    return base + property.name;
}
exports.propertyString = propertyString;
function parsePropertyString(val) {
    var parts = val.split('/');
    if (parts.length === 1) {
        return { name: parts[0], component: null };
    }
    if (parts.length === 2) {
        return { component: parts[0], name: parts[1] };
    }
    throw new Error("Couldn't parse '" + val + "' as a valid property identifier");
}
exports.parsePropertyString = parsePropertyString;
function getEntitySummary(entityType, summary) {
    var index = summary.entity_groups.map(function (e) { return e.name; }).indexOf(entityType);
    if (index === -1) {
        return null;
    }
    return summary.entity_groups[index];
}
exports.getEntitySummary = getEntitySummary;
function copyToClipboard(text) {
    var el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
}
exports.copyToClipboard = copyToClipboard;
function getBaseURL() {
    return (window.location.protocol +
        '//' +
        window.location.hostname +
        (window.location.port ? ":" + window.location.port : '') +
        window.location.pathname);
}
exports.getBaseURL = getBaseURL;
/**
 * Receives a scenario status and returns a Bulma class for the color
 * @param status
 */
function getClassFromStatus(status) {
    var statusClass = 'is-';
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
exports.getClassFromStatus = getClassFromStatus;
function getStatusFromScenarioAndSimulation(scenario, simulation) {
    var allStatuses = ['failed', 'invalid', 'pending', 'running', 'succeeded', 'ready', 'unknown'];
    var scenarioStatus = getStatusOrUnknown(scenario).toLowerCase();
    var simulationStatus = getStatusOrUnknown(simulation).toLowerCase();
    for (var i = 0; i < allStatuses.length; i++) {
        var status_1 = allStatuses[i];
        if (scenarioStatus === status_1 || simulationStatus === status_1) {
            return (0, upperFirst_1["default"])(status_1);
        }
    }
    return 'unknown'; // should not get here
}
exports.getStatusFromScenarioAndSimulation = getStatusFromScenarioAndSimulation;
function getStatusOrUnknown(obj) {
    return obj.status ? obj.status : 'Unknown';
}
