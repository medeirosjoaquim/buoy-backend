export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: 'not_found' | 'validation_error'; message: string; details?: unknown };
