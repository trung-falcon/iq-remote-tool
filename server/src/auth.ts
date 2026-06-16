import type { NextFunction, Request, Response } from 'express';

// Shared access password. Set RC_PASSWORD in the environment when hosting;
// falls back to this default for local dev. Anyone with this password can read
// AND publish production Remote Config, so treat it like a deploy key.
export const ACCESS_PASSWORD = process.env.RC_PASSWORD || 'Falcon@IQ2026';

// Pull the password from either `Authorization: Bearer <pw>` or `x-rc-password`.
function provided(req: Request): string {
  const auth = req.header('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice('Bearer '.length);
  return req.header('x-rc-password') ?? '';
}

// Gate every protected route. The web client stores the password and sends it on
// each request; a missing/wrong password yields 401 so the UI can re-prompt.
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (provided(req) === ACCESS_PASSWORD) {
    next();
    return;
  }
  res.status(401).json({ error: 'unauthorized' });
}
