import { PolyanetModel, SoloonModel, ComethModel } from './models';

/** Public interface for Crossmint client used by orchestrator and tests */
export interface ValidationResult {
  solved: boolean;
}

export interface ICrossmintClient {
  createPolyanetAt(polyanet: PolyanetModel): Promise<void>;
  removePolyanetAt(polyanet: PolyanetModel): Promise<void>;
  createSoloonAt(soloon: SoloonModel): Promise<void>;
  removeSoloonAt(soloon: SoloonModel): Promise<void>;
  createComethAt(cometh: ComethModel): Promise<void>;
  removeComethAt(cometh: ComethModel): Promise<void>;
  fetchGoalMap(): Promise<string[][]>;
  validateSolution(): Promise<ValidationResult>;
}


