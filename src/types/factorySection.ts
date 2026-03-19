/**
 * Factory Section types
 */

export interface FactorySection {
  id: number;
  workspace_id: number;
  name: string;
  factory_id: number;
}

export interface CreateFactorySectionRequest {
  name: string;
  factory_id: number;
}

export interface UpdateFactorySectionRequest {
  name?: string;
  factory_id?: number;
}

export interface ListFactorySectionsParams {
  skip?: number;
  limit?: number;
  factory_id?: number;
  search?: string;
}
