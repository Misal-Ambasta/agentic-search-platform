import axios from 'axios';
import * as cheerio from 'cheerio';
import { queryDocuments } from './vectorDb.service.js';
import { downloadFile } from './googleDrive.service.js';
import { parseFiles } from './parser.service.js';
import type { ToolName, ToolResult } from '../types/index.js';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export async function executeTool(tool: ToolName, args?: any): Promise<ToolResult> {
  switch (tool) {
    case 'web_search':
      return await handleWebSearch(args?.query);
    case 'web_scrape':
      return await handleWebScrape(args?.url);
    case 'vector_search':
      return await handleVectorSearch(args?.query);
    case 'drive_retrieve':
      return await handleDriveRetrieve(args?.tokens, args?.fileId);
    default:
      return { tool, output: 'Unsupported tool', meta: {} };
  }
}

async function handleWebSearch(query: string): Promise<ToolResult> {
  if (!TAVILY_API_KEY) {
    return {
      tool: 'web_search',
      output: 'TAVILY_API_KEY not configured. Cannot perform web search.',
      meta: { error: 'Missing API Key' },
    };
  }

  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: TAVILY_API_KEY,
      query,
      search_depth: 'advanced',
      include_answer: true,
      max_results: 5,
    });

    const results = response.data.results.map((r: any) => `[${r.title}](${r.url}): ${r.content}`).join('\n\n');
    return {
      tool: 'web_search',
      output: results || 'No results found.',
      meta: { results: response.data.results },
    };
  } catch (error) {
    return {
      tool: 'web_search',
      output: `Web search failed: ${String(error)}`,
      meta: { error },
    };
  }
}

async function handleWebScrape(url: string): Promise<ToolResult> {
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(html);
    $('script, style, nav, footer, header').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 10000);

    return {
      tool: 'web_scrape',
      output: text,
      meta: { url },
    };
  } catch (error) {
    return {
      tool: 'web_scrape',
      output: `Scraping failed: ${String(error)}`,
      meta: { error },
    };
  }
}

async function handleVectorSearch(query: string): Promise<ToolResult> {
  try {
    // Assuming 'documents' is the default collection
    const results = await queryDocuments('documents', query);
    
    if (!results.documents || results.documents.length === 0) {
      return { tool: 'vector_search', output: 'No relevant documents found in private files.', meta: {} };
    }

    const output = (results.documents[0] as string[]).map((doc, i) => {
      const metadata = (results.metadatas[0] as any[])[i];
      return `Source: ${metadata?.fileName || 'Unknown'} (File ID: ${metadata?.fileId || 'N/A'})\nContent: ${doc}`;
    }).join('\n\n---\n\n');

    return {
      tool: 'vector_search',
      output,
      meta: { results },
    };
  } catch (error) {
    return {
      tool: 'vector_search',
      output: `Vector search failed: ${String(error)}`,
      meta: { error },
    };
  }
}

async function handleDriveRetrieve(tokens: any, fileId: string): Promise<ToolResult> {
  if (!tokens) {
    return { tool: 'drive_retrieve', output: 'Drive tokens missing. Connect Google Drive first.', meta: {} };
  }

  try {
    const content = await downloadFile(tokens, fileId);
    // Rough way to get filename, though usually we'd pass it in or fetch metadata
    const text = await parseFiles('file.bin', content); 

    return {
      tool: 'drive_retrieve',
      output: text.slice(0, 5000), // Return a chunk
      meta: { fileId },
    };
  } catch (error) {
    return {
      tool: 'drive_retrieve',
      output: `Drive retrieval failed: ${String(error)}`,
      meta: { error },
    };
  }
}
