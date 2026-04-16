export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface AnalysisReport {
  executiveSummary: string;
  criticalAnomalies: string[];
  theWhy: string;
  actionPlan: string[];
  confidenceScore: number;
  salesReview: string;
  chartData?: ChartDataPoint[];
  chartTitle?: string;
}

export interface DataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface RawData {
  content: string;
  format: 'json' | 'csv' | 'text';
}
