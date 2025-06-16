export interface KpiData {
  kpi_name: string;
  value: number;
  unit: string;
  description: string;
}

export interface OperationResults {
  modified_columns?: string[];
  rows_before?: number;
  rows_after?: number;
  rows_modified?: number;
}

export interface GPTResponse {
  type: 'conversation' | 'action';
  requires_code: boolean;
  message: string;
  code?: string;
  results?: OperationResults;
  kpi_data?: KpiData[];  // Ajout des KPIs directement dans la réponse
}

export type MessageType = {
  role: 'user' | 'assistant';
  content: string;
  response?: GPTResponse;
}; 