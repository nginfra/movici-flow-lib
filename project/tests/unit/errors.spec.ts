// @ts-nocheck
import { MoviciError, ValidationError } from '@movici-flow-common/errors';

describe('errors.ts/ValidationError', () => {
  const error = new ValidationError('error message');
  it('is an a instance of MoviciError', () => {
    expect(error).toBeInstanceOf(MoviciError);
  });
  it('has the correct name', () => {
    expect(error.name).toBe('ValidationError');
  });
  it('has the correct message', () => {
    expect(error.message).toBe('error message');
  });
});
