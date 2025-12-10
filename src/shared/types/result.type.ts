/**
 * Result monad for explicit error handling
 * Eliminates try-catch spreading and makes errors explicit in function signatures
 *
 * @example
 * ```typescript
 * function divide(a: number, b: number): Result<number, Error> {
 *   if (b === 0) {
 *     return failure(new Error('Division by zero'));
 *   }
 *   return success(a / b);
 * }
 *
 * const result = divide(10, 2);
 * if (result.isSuccess) {
 *   console.log(result.value); // 5
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */

export type Result<T, E = Error> = Success<T, E> | Failure<T, E>;

/**
 * Represents a successful operation result
 */
export class Success<T, E> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;

  constructor(public readonly value: T) {}

  /**
   * Transform the success value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Success(fn(this.value));
  }

  /**
   * Chain another Result-returning operation
   */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  /**
   * Get the value or return a default
   */
  getOrElse(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Get the value or throw the error
   */
  getOrThrow(): T {
    return this.value;
  }

  /**
   * Convert to Promise (useful for async operations)
   */
  toPromise(): Promise<T> {
    return Promise.resolve(this.value);
  }
}

/**
 * Represents a failed operation result
 */
export class Failure<T, E> {
  readonly isSuccess = false as const;
  readonly isFailure = true as const;

  constructor(public readonly error: E) {}

  /**
   * Transform does nothing for Failure
   */
  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Failure(this.error);
  }

  /**
   * Chain does nothing for Failure
   */
  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Failure(this.error);
  }

  /**
   * Get the default value since this is a failure
   */
  getOrElse(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Throw the error
   */
  getOrThrow(): never {
    throw this.error;
  }

  /**
   * Convert to rejected Promise
   */
  toPromise(): Promise<never> {
    return Promise.reject(this.error);
  }
}

// Factory functions for creating Results
export const success = <T, E = Error>(value: T): Result<T, E> =>
  new Success(value);

export const failure = <T, E = Error>(error: E): Result<T, E> =>
  new Failure(error);

// Type guards for checking Result type
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T, E> =>
  result.isSuccess;

export const isFailure = <T, E>(result: Result<T, E>): result is Failure<T, E> =>
  result.isFailure;

/**
 * Combines multiple Results into a single Result containing an array
 * If any Result is a Failure, returns the first Failure
 *
 * @example
 * ```typescript
 * const r1 = success(1);
 * const r2 = success(2);
 * const r3 = success(3);
 * const combined = combine([r1, r2, r3]); // Success([1, 2, 3])
 * ```
 */
export const combine = <T, E>(
  results: Array<Result<T, E>>
): Result<T[], E> => {
  const values: T[] = [];

  for (const result of results) {
    if (result.isFailure) {
      return failure(result.error);
    }
    values.push(result.value);
  }

  return success(values);
};

/**
 * Wrap a Promise in a Result type
 * Catches any errors and returns them as Failure
 *
 * @example
 * ```typescript
 * const result = await fromPromise(fetch('/api/data'));
 * if (result.isSuccess) {
 *   console.log(result.value);
 * }
 * ```
 */
export const fromPromise = async <T>(
  promise: Promise<T>
): Promise<Result<T, Error>> => {
  try {
    const value = await promise;
    return success(value);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Try to execute a function and wrap the result
 * Catches any synchronous errors
 *
 * @example
 * ```typescript
 * const result = tryCatch(() => JSON.parse(jsonString));
 * ```
 */
export const tryCatch = <T>(fn: () => T): Result<T, Error> => {
  try {
    return success(fn());
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};
