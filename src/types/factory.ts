/**
 * Factory types
 */

export interface Factory {
  id: number;
  workspace_id: number;
  name: string;
  abbreviation: string;
}

export interface CreateFactoryRequest {
  name: string;
  abbreviation: string;
}

export interface UpdateFactoryRequest {
  name?: string;
  abbreviation?: string;
}

export interface ListFactoriesParams {
  skip?: number;
  limit?: number;
  search?: string;
}
