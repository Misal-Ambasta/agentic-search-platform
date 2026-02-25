import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl() {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function getTokens(code: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getDriveClient(tokens: any) {
  const client = getOAuth2Client();
  client.setCredentials(tokens);
  return google.drive({ version: 'v3', auth: client });
}

export async function listFolders(tokens: any) {
  const drive = await getDriveClient(tokens);
  const response = await drive.files.list({
    q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false",
    fields: 'files(id, name)',
  });
  return response.data.files || [];
}

export async function listFiles(tokens: any, folderId?: string) {
  const drive = await getDriveClient(tokens);
  let q = 'trashed = false';
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }
  const response = await drive.files.list({
    q,
    fields: 'files(id, name, mimeType)',
  });
  return response.data.files || [];
}

export async function downloadFile(tokens: any, fileId: string) {
  const drive = await getDriveClient(tokens);
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(response.data as ArrayBuffer);
}

export async function exportGoogleDoc(tokens: any, fileId: string, mimeType: string = 'text/plain') {
  const drive = await getDriveClient(tokens);
  const response = await drive.files.export(
    { fileId, mimeType },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(response.data as ArrayBuffer);
}
