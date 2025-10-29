/** Minimal logger interface used across services */
export interface ILogger {
  logInfo(message: string): void;
  logError(message: string, error?: unknown): void;
}


