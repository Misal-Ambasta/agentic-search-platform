import { ChromaClient } from 'chromadb';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8000';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
let client: ChromaClient | null = null;

export async function getChromaClient() {
  if (!client) {
    client = new ChromaClient({ path: CHROMA_URL });
  }
  return client;
}

async function generateEmbeddings(texts: string[]) {
  const batchSize = 100; // Small batch size to stay safe
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    allEmbeddings.push(...response.data.map((item) => item.embedding));
  }

  return allEmbeddings;
}

export async function getCollection(name: string = 'documents') {
  const chroma = await getChromaClient();
  try {
    return await chroma.getOrCreateCollection({
      name,
    });
  } catch (error) {
    console.error('Error getting/creating collection:', error);
    throw error;
  }
}

export async function addDocuments(
  collectionName: string,
  documents: string[],
  metadatas: any[],
  ids: string[]
) {
  const collection = await getCollection(collectionName);
  const embeddings = await generateEmbeddings(documents);
  
  await collection.add({
    ids,
    metadatas,
    documents,
    embeddings,
  });
}

export async function queryDocuments(
  collectionName: string,
  query: string,
  nResults: number = 5
) {
  const collection = await getCollection(collectionName);
  const queryEmbeddings = await generateEmbeddings([query]);
  
  const embedding = queryEmbeddings[0];
  if (!embedding) throw new Error('Failed to generate query embedding');

  return await collection.query({
    queryEmbeddings: [embedding],
    nResults,
  });
}

export async function deleteByFileId(collectionName: string, fileId: string) {
  const collection = await getCollection(collectionName);
  await collection.delete({
    where: { fileId: { $eq: fileId } } as any,
  });
}

export async function fileExists(collectionName: string, fileId: string): Promise<boolean> {
  const collection = await getCollection(collectionName);
  const result = await collection.get({
    where: { fileId: { $eq: fileId } } as any,
    limit: 1,
  });
  return result.ids.length > 0;
}
