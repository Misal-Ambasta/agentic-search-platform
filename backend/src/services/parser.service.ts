import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';

export async function parseText(content: string): Promise<string> {
  return content;
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    await parser.load();
    const result: any = await parser.getText();
    return result.text || '';
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function parseHtml(html: string): Promise<string> {
  const $ = cheerio.load(html);
  // Remove script and style elements
  $('script, style').remove();
  return $('body').text().replace(/\s+/g, ' ').trim();
}

export async function parseFiles(filename: string, content: Buffer | string): Promise<string> {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (typeof content === 'string') {
    if (extension === 'html' || extension === 'htm') {
      return parseHtml(content);
    }
    return parseText(content);
  }

  if (extension === 'pdf') {
    return parsePdf(content);
  }

  return content.toString('utf-8');
}
