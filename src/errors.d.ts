export declare class MoviciError extends Error {
    constructor(message: string);
    get name(): string;
}
export declare class ValidationError extends MoviciError {
    constructor(message: string);
    get name(): string;
}
