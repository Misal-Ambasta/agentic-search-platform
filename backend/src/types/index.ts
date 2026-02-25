export type ToolName = 'web_search' | 'vector_search' | 'drive_retrieve' | 'web_scrape';

export interface ToolResult {
  tool: ToolName;
  output: string;
  meta?: Record<string, any>;
}

export interface Session {
  id: string;
  task: string;
  plan: string[];
  history: string[];
  observations: ToolResult[];
  status: 'pending' | 'running' | 'finished' | 'error';
  result?: string;
}
