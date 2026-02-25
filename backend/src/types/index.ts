export type ToolName = 'web_search' | 'vector_search' | 'drive_retrieve' | 'web_scrape';

export interface ToolResult {
  tool: ToolName;
  output: string;
  meta?: Record<string, any>;
}

export interface PlanStep {
  description: string;
  completed: boolean;
}

export interface HistoryItem {
  role: 'assistant' | 'tool';
  content: string;
  timestamp: string;
}

export interface Session {
  id: string;
  task: string;
  plan: PlanStep[];
  history: HistoryItem[];
  observations: ToolResult[];
  status: 'pending' | 'running' | 'finished' | 'error';
  result?: string;
}
