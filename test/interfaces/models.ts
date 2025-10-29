/**
 * Common model definitions used across tests and the test client.
 * These are lightweight TypeScript types describing grid coordinates and
 * domain entities (polyanets, sloons, comeths).
 */
export type RowIndex = number;
export type ColumnIndex = number;

/**
 * Represents a polyanet's grid position.
 */
export interface PolyanetModel {
  row: RowIndex;
  column: ColumnIndex;
}

/**
 * Allowed colors for a Soloon entity.
 */
export type SoloonColor = 'blue' | 'red' | 'purple' | 'white';

/**
 * Model describing a Soloon placement.
 */
export interface SoloonModel {
  row: RowIndex;
  column: ColumnIndex;
  color: SoloonColor;
}

/**
 * Direction types used by Cometh entities.
 */
export type ComethDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Model describing a Cometh placement and its direction.
 */
export interface ComethModel {
  row: RowIndex;
  column: ColumnIndex;
  direction: ComethDirection;
}


