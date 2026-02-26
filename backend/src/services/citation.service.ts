import type { ToolResult } from '../types/index.js';

export interface Citation {
  id: number;
  source: string;
  url?: string | undefined;
  tool?: string | undefined;
}

export function getCitations(observations: ToolResult[]): Citation[] {
  const citations: Citation[] = [];
  const sourceMap = new Map<string, number>();
  let citationCount = 0;

  observations.forEach((obs) => {
    const processSource = (sourceTitle: string, url: string) => {
      const dedupeKey = url || sourceTitle;
      if (!sourceMap.has(dedupeKey)) {
        citationCount++;
        sourceMap.set(dedupeKey, citationCount);
        citations.push({
          id: citationCount,
          source: sourceTitle || obs.tool,
          url: url || undefined,
          tool: obs.tool
        });
      }
    };

    if (obs.tool === 'web_search' && obs.meta?.results) {
      obs.meta.results.forEach((r: any) => {
        processSource(r.title || 'Web Search Result', r.url || '');
      });
    } else if (obs.tool === 'vector_search' && obs.meta?.results?.metadatas) {
      const metadatas = obs.meta.results.metadatas[0] || [];
      metadatas.forEach((m: any) => {
        const title = m.fileName || 'Private Document';
        const url = m.fileId ? `google-drive://${m.fileId}` : '';
        processSource(title, url);
      });
    } else {
      const title = obs.meta?.title || obs.tool;
      const url = obs.meta?.url || '';
      processSource(title, url);
    }
  });

  return citations;
}

export function normalizeCitations(text: string, observations: ToolResult[]): { text: string; citations: Citation[] } {
  const citations = getCitations(observations);
  let formattedText = text.trim();
  
  // Robust check for existing citations section
  const citationPatterns = [
    /###?\s*Sources/i,
    /###?\s*Citations/i,
    /###?\s*References/i,
    /\n\s*Sources:/i,
    /\n\s*References:/i
  ];
  
  const hasHeaders = citationPatterns.some(pattern => pattern.test(formattedText));

  // Only include citations that the LLM actually referenced in the text
  const usedCitations = citations.filter(c => formattedText.includes(`[${c.id}]`));

  if (!hasHeaders && usedCitations.length > 0) {
    const sourcesList = usedCitations
      .map(c => {
        const link = c.url ? ` (${c.url})` : '';
        return `[${c.id}] ${c.source}${link}`;
      })
      .join('\n');
    
    formattedText = `${formattedText}\n\n### Sources\n${sourcesList}`;
  }

  return { text: formattedText, citations: usedCitations };
}
