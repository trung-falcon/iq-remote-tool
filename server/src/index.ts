import express, { type NextFunction, type Request, type Response } from 'express';
import { HttpError } from './firebase';
import { routes } from './routes';

const PORT = 4000;
// Bind to all interfaces by default so the tool can be hosted on a company server;
// override with HOST=127.0.0.1 to keep it local-only. Access is gated by the
// shared password (RC_PASSWORD), so exposing the port still requires the password.
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
app.use(express.json());
app.use('/api', routes);

// Map errors to JSON. Firebase etag races (between our getTemplate and
// publishTemplate) surface as failed-precondition — report them as 409 conflicts.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : String(err);
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: message });
    return;
  }
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code: unknown }).code) : '';
  const type =
    err && typeof err === 'object' && 'type' in err ? String((err as { type: unknown }).type) : '';
  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }
  if (
    code.includes('failed-precondition') ||
    /etag|version[_-]?mismatch|failed[_-]?precondition/i.test(message)
  ) {
    res.status(409).json({ error: 'etag-conflict' });
    return;
  }
  console.error('[api] unhandled error:', err);
  res.status(500).json({ error: message });
});

app.listen(PORT, HOST, () => {
  console.log(`[api] listening on http://${HOST}:${PORT}`);
  console.log('[api] web UI (vite): http://localhost:5173');
});
