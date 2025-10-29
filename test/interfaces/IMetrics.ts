/** Simple metrics interface for build operations */
export interface IMetrics {
  incCreated(): void;
  incSkipped(): void;
  incFailed(): void;
  snapshot(): { created: number; skipped: number; failed: number };
  reset(): void;
}


