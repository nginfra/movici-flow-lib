export class MoviciError extends Error {
    constructor(message) {
        super(message);
    }
    get name() {
        return 'MoviciError';
    }
}
export class ValidationError extends MoviciError {
    constructor(message) {
        super(message);
    }
    get name() {
        return 'ValidationError';
    }
}
