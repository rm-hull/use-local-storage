export class LocalStorageError extends Error {
  cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = 'LocalStorageError';
    this.cause = cause;
  }
}
