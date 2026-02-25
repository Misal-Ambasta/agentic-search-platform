import type { ToolResult } from '../types/index.js';

export interface Citation {
  id: number;
  source: string;
  url?: string;
}

export function normalizeCitations(text: string, observations: ToolResult[]): { text: string; citations: Citation[] } {
  const citations: Citation[] = [];
  let citationCount = 0;

  // Extract sources from observations
  const sourceMap = new Map<string, number>();

  observations.forEach((obs) => {
    let source = obs.tool;
    let url = obs.meta?.url || '';

    if (obs.tool === 'web_search' && obs.meta?.results) {
      // Tavily results might have multiple sources
      obs.meta.results.forEach((r: any) => {
        if (!sourceMap.has(r.url)) {
          citationCount++;
          sourceMap.set(r.url, citationCount);
          citations.push({ id: citationCount, source: r.title || 'Web Search', url: r.url });
        }
      });
    } else if (obs.tool === 'vector_search' && obs.meta?.results?.metadatas) {
      // Chroma results
      const metadatas = obs.meta.results.metadatas[0] || [];
      metadatas.forEach((m: any) => {
        const key = m.fileId || m.fileName;
        if (!sourceMap.has(key)) {
          citationCount++;
          sourceMap.set(key, citationCount);
          citations.push({ id: citationCount, source: m.fileName || 'Private Document', url: `google-drive://${m.fileId}` });
        }
      });
    } else {
      const key = url || source;
      if (!sourceMap.has(key)) {
        citationCount++;
        sourceMap.set(key, citationCount);
        citations.push({ id: citationCount, source: obs.meta?.title || source, url });
      }
    }
  });

  // Simple post-processing to ensure citations are bracketed [1], [2], etc.
  // This is a basic implementation. A more advanced one would look for matches in text.
  // For now, let's just append the formatted citations list if not already present.
  
  let formattedText = text;
  if (!formattedText.includes('Sources:') && !formattedText.includes('Citations:') && citations.length > 0) {
    formattedText += '\n\n### Sources\n' + citations.map(c => `[${c.id}] ${c.source}${c.url ? ` (${c.url})` : ''}`).join('\n');
  }

  return { text: formattedText, citations };
}
