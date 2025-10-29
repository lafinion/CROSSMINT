import dotenv from 'dotenv';

// Load environment variables from .env.local when present (test-time configuration)
// Tests and local runs should place configuration in `.env.local` (not committed).
dotenv.config({ path: '.env.local' });

/**
 * Base URL for the API used in tests. Can be overridden with BASE_URL env.
 */
export const API_BASE_URL = process.env.BASE_URL || 'https://challenge.crossmint.com';

/**
 * Candidate identifier used by test clients. Override with CANDIDATE_ID env.
 */
export const CANDIDATE_ID = process.env.CANDIDATE_ID || '0f8c74ac-53a1-4b9b-87c1-c43acad78a3d';

/**
 * Default maximum concurrency used by helpers; override with CONCURRENCY env.
 */
export const MAX_CONCURRENCY = Number(process.env.CONCURRENCY || '5');

// Retry/backoff defaults (configurable via .env.local)
export const RETRY_MAX_ATTEMPTS = Number(process.env.RETRY_MAX_ATTEMPTS || '5');
export const RETRY_BASE_DELAY_MS = Number(process.env.RETRY_BASE_DELAY_MS || '200');


