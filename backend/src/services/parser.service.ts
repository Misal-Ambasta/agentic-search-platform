import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import * as cheerio from 'cheerio';

export async function parseText(content: string): Promise<string> {
  return content;
}

export async function parsePdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
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
