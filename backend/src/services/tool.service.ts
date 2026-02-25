import axios from 'axios';
import * as cheerio from 'cheerio';
import { queryDocuments } from './vectorDb.service.js';
import { downloadFile, exportGoogleDoc } from './googleDrive.service.js';
import { parseFiles } from './parser.service.js';
import { getTokens } from '../db/tokenStore.js';
import type { ToolName, ToolResult } from '../types/index.js';


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
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      tool: 'web_search',
      output: 'TAVILY_API_KEY not configured. Cannot perform web search.',
      meta: { error: 'Missing API Key' },
    };
  }

  try {
    const response = await axios.post('https://api.tavily.com/search', {
      api_key: apiKey,
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
      timeout: 10000
    });

    const $ = cheerio.load(html);
    
    // Performance: remove unnecessary tags
    $('script, style, nav, footer, header, noscript, iframe, .ad, .sidebar, details').remove();
    
    // Target main content if possible
    const contentSelectors = ['main', 'article', '.content', '#content', '.post-content', 'body'];
    let text = '';
    
    for (const selector of contentSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        text = el.text();
        break;
      }
    }

    if (!text) text = $('body').text();

    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 15000);

    return {
      tool: 'web_scrape',
      output: cleanText || 'Could not extract text content from the URL.',
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
      return `Source: ${metadata?.fileName || 'Unknown'} 
File ID: ${metadata?.fileId || 'N/A'}
Type: ${metadata?.mimeType || 'Unknown'}
Content: ${doc}`;
    }).join('\n\n---\n\n');

    return {
      tool: 'vector_search',
      output,
      meta: { results, metadatas: results.metadatas[0] },
    };
  } catch (error) {
    return {
      tool: 'vector_search',
      output: `Vector search failed: ${String(error)}`,
      meta: { error },
    };
  }
}

async function handleDriveRetrieve(tokens: any, args: { fileId: string; fileName?: string; mimeType?: string }): Promise<ToolResult> {
  const { fileId, fileName, mimeType } = args;
  const effectiveTokens = tokens || getTokens();
  
  if (!effectiveTokens) {
    return { tool: 'drive_retrieve', output: 'Drive tokens missing. Connect Google Drive first.', meta: {} };
  }

  try {
    let content: Buffer;
    if (mimeType === 'application/vnd.google-apps.document') {
      content = await exportGoogleDoc(effectiveTokens, fileId);
    } else {
      content = await downloadFile(effectiveTokens, fileId);
    }
    
    const text = await parseFiles(fileName || 'file.bin', content); 

    return {
      tool: 'drive_retrieve',
      output: text.slice(0, 10000), // Return a larger chunk for deep reading
      meta: { fileId, fileName },
    };
  } catch (error) {
    return {
      tool: 'drive_retrieve',
      output: `Drive retrieval failed: ${String(error)}`,
      meta: { error },
    };
  }
}
