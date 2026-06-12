import fs from 'node:fs';
import path from 'node:path';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getRemoteConfig, type RemoteConfig } from 'firebase-admin/remote-config';

// Service account key lives at the repo root (gitignored, user-provided).
const KEY_PATH = path.resolve(process.cwd(), 'service-account.json');

export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

function ensureApp() {
  const existing = getApps()[0];
  if (existing) return existing;
  if (!fs.existsSync(KEY_PATH)) {
    throw new HttpError(
      500,
      `service-account.json not found at ${KEY_PATH}. ` +
        'Download it: Firebase Console → Project Settings → Service accounts → Generate new private key, ' +
        'then save it as service-account.json at the repo root.',
    );
  }
  const serviceAccount = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export function rc(): RemoteConfig {
  return getRemoteConfig(ensureApp());
}
