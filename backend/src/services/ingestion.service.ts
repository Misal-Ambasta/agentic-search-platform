import { listFiles, downloadFile, exportGoogleDoc } from './googleDrive.service.js';
import { parseFiles } from './parser.service.js';
import { addDocuments, fileExists } from './vectorDb.service.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Recursive character text splitting implementation.
 * Splits text into chunks of roughly chunkSize, trying to split at logical points (paragraphs, sentences).
 */
export function recursiveChunkText(
  text: string,
  chunkSize: number = 2000,
  chunkOverlap: number = 400,
  separators: string[] = ['\n\n', '\n', '. ', '? ', '! ', '; ', ', ', ' ', '']
): string[] {
  const finalChunks: string[] = [];

  function splitRecursive(content: string, currentSeparators: string[]): void {
    if (content.length <= chunkSize) {
      if (content.trim()) finalChunks.push(content.trim());
      return;
    }

    // Find the first separator that exists in the content
    let selectedSeparator = '';

    for (const sep of currentSeparators) {
      if (content.includes(sep)) {
        selectedSeparator = sep;
        break;
      }
    }

    if (selectedSeparator === '') {
      // No more separators, just force split
      let start = 0;
      while (start < content.length) {
        let end = Math.min(start + chunkSize, content.length);
        finalChunks.push(content.slice(start, end).trim());
        start += chunkSize - chunkOverlap;
      }
      return;
    }

    const parts = content.split(selectedSeparator);
    const remainingSeparators = currentSeparators.slice(currentSeparators.indexOf(selectedSeparator) + 1);

    let currentChunk = '';

    for (const part of parts) {
      if ((currentChunk + selectedSeparator + part).length <= chunkSize) {
        currentChunk += (currentChunk ? selectedSeparator : '') + part;
      } else {
        if (currentChunk) {
          finalChunks.push(currentChunk.trim());
          // Keep overlap from previous chunk
          const overlapText = currentChunk.slice(-(chunkOverlap));
          currentChunk = overlapText + selectedSeparator + part;
        } else {
          // Part itself is too big, recurse on it
          splitRecursive(part, remainingSeparators);
        }
      }
    }

    if (currentChunk.trim()) {
      finalChunks.push(currentChunk.trim());
    }
  }

  splitRecursive(text, separators);
  
  // Post-process to ensure no chunk exceeds chunkSize (final safety net)
  const result: string[] = [];
  for (const chunk of finalChunks) {
    if (chunk.length <= chunkSize) {
      result.push(chunk);
    } else {
      let start = 0;
      while (start < chunk.length) {
        result.push(chunk.slice(start, start + chunkSize));
        start += chunkSize - chunkOverlap;
      }
    }
  }

  return result;
}

export async function ingestFolder(
  tokens: any, 
  folderId: string, 
  collectionName: string = 'documents',
  incremental: boolean = false
) {
  const files = await listFiles(tokens, folderId);
  const results = [];

  for (const file of files) {
    if (!file.id || !file.name) continue;

    try {
      if (incremental) {
        const alreadyIngested = await fileExists(collectionName, file.id);
        if (alreadyIngested) {
          results.push({ fileName: file.name, status: 'skipped', reason: 'already_ingested' });
          continue;
        }
      }

      let content: Buffer;
      if (file.mimeType === 'application/vnd.google-apps.document') {
        content = await exportGoogleDoc(tokens, file.id);
      } else {
        content = await downloadFile(tokens, file.id);
      }

      const parsedText = await parseFiles(file.name, content);
      const chunks = recursiveChunkText(parsedText);

      const ids = chunks.map(() => uuidv4());
      const metadatas = chunks.map((_: string, i: number) => ({
        fileId: file.id,
        fileName: file.name,
        chunkIndex: i,
        mimeType: file.mimeType,
      }));

      await addDocuments(collectionName, chunks, metadatas, ids);
      results.push({ fileName: file.name, status: 'success', chunks: chunks.length });
    } catch (error) {
      console.error(`Failed to ingest file ${file.name}:`, error);
      results.push({ fileName: file.name, status: 'error', error: String(error) });
    }
  }

  return results;
}
