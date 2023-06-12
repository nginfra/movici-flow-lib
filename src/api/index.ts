import Client from "./client";

export enum CAPABILITIES {
  USER = "user",
  GEOCODE = "geocode",
  PROJECTS = "projects",
}

export { Client };
export * from "./requests";
