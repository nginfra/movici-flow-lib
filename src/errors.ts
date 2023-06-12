import upperFirst from "lodash/upperFirst";

import type { FlowLocation } from "./types";

type ErrorProps = {
  query?: Record<string, string | undefined>;
  onDone?: () => void;
};

export class MoviciError extends Error {
  id?: string;
  context?: Record<string, string>;
  constructor(message?: string, context?: Record<string, string>) {
    super(message);
    this.context = context;
  }

  get name() {
    return "MoviciError";
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleError(props: ErrorProps) {}
}

export class ValidationError extends MoviciError {
  get name() {
    return "ValidationError";
  }
}
export class FlowRedirect extends MoviciError {
  location: FlowLocation;
  constructor(location: FlowLocation, message?: string, context?: Record<string, string>) {
    super(message, context);
    this.location = location;
  }
}

export class FlowErrorSetup extends MoviciError {
  redirect?: string;

  get name() {
    return "FlowErrorSetup: " + upperFirst(this.id);
  }
}

export class UserNotFound extends FlowErrorSetup {
  id = "userNotFound";
  redirect = "Console";
}

export class ProjectNameNotProvided extends FlowErrorSetup {
  id = "projectNameNotProvided";
  redirect = "FlowProject";
}

export class ProjectInvalid extends FlowErrorSetup {
  id = "projectInvalid";
  redirect = "FlowProject";

  async handleError(props: ErrorProps): Promise<void> {
    delete props.query?.project;
    delete props.query?.scenario;
    super.handleError(props);
  }
}

export class ScenarioNameNotProvided extends FlowErrorSetup {
  id = "scenarioNameNotProvided";
  redirect = "FlowScenario";
}

export class ScenarioInvalid extends FlowErrorSetup {
  id = "scenarioInvalid";
  redirect = "FlowScenario";

  async handleError(props: ErrorProps): Promise<void> {
    delete props.query?.scenario;
    super.handleError(props);
  }
}

export class ViewHasNoScenario extends FlowErrorSetup {
  id = "viewHasNoScenario";
  redirect = "FlowVisualization";
}

export class ViewInvalid extends FlowErrorSetup {
  id = "viewInvalid";
  redirect = "FlowVisualization";

  async handleError(props: ErrorProps): Promise<void> {
    delete props.query?.view;
    super.handleError(props);
  }
}

export class ViewNotInScenario extends FlowErrorSetup {
  id = "viewNotInScenario";
  redirect = "FlowScenario";
}

export class ViewNotInProject extends FlowErrorSetup {
  id = "viewNotInProject";
  redirect = "FlowProject";
}

export class SummaryNotFound extends FlowErrorSetup {
  id = "summaryNotFound";
  redirect = "FlowScenario";
}
