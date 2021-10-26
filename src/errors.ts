export class MoviciError extends Error {
  constructor(message: string) {
    super(message);
  }

  get name() {
    return 'MoviciError';
  }
}

export class ValidationError extends MoviciError {
  constructor(message: string) {
    super(message);
  }

  get name() {
    return 'ValidationError';
  }
}
