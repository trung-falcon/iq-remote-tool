import { Router, type Request, type Response, type NextFunction } from 'express';
import type { Version } from 'firebase-admin/remote-config';
import { HttpError, rc } from './firebase';
import { applyChanges, extractParams, validateChanges, type Changes } from './template-utils';

const h =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

function versionInfo(version: Version | undefined) {
  if (!version) return undefined;
  return {
    versionNumber: version.versionNumber,
    updateTime: version.updateTime,
    updateUser: version.updateUser?.email,
    description: version.description,
  };
}

function parseChanges(body: unknown): Changes {
  const changes = (body as { changes?: unknown })?.changes;
  if (
    !changes ||
    typeof changes !== 'object' ||
    Array.isArray(changes) ||
    Object.values(changes).some(v => typeof v !== 'string')
  ) {
    throw new HttpError(400, 'Body must be { changes: { [paramKey]: string } }');
  }
  if (Object.keys(changes).length === 0) {
    throw new HttpError(400, 'No changes provided');
  }
  return changes as Changes;
}

export const routes = Router();

routes.get(
  '/template',
  h(async (_req, res) => {
    const template = await rc().getTemplate();
    res.json({
      etag: template.etag,
      version: versionInfo(template.version),
      params: extractParams(template),
    });
  }),
);

routes.post(
  '/validate',
  h(async (req, res) => {
    const changes = parseChanges(req.body);
    const errors = validateChanges(changes);
    if (errors.length) {
      res.status(400).json({ valid: false, errors });
      return;
    }
    const template = await rc().getTemplate();
    applyChanges(template, changes);
    try {
      await rc().validateTemplate(template);
    } catch (e) {
      res.status(400).json({
        valid: false,
        errors: [{ param: '*', message: `Firebase rejected the template: ${(e as Error).message}` }],
      });
      return;
    }
    res.json({ valid: true });
  }),
);

routes.post(
  '/publish',
  h(async (req, res) => {
    const { etag } = req.body as { etag?: unknown };
    if (typeof etag !== 'string' || !etag) throw new HttpError(400, 'Missing etag');
    const changes = parseChanges(req.body);
    const errors = validateChanges(changes);
    if (errors.length) {
      res.status(400).json({ errors });
      return;
    }
    const template = await rc().getTemplate();
    if (template.etag !== etag) {
      res.status(409).json({ error: 'etag-conflict' });
      return;
    }
    applyChanges(template, changes);
    const validated = await rc().validateTemplate(template);
    const published = await rc().publishTemplate(validated);
    res.json({
      etag: published.etag,
      versionNumber: published.version?.versionNumber,
    });
  }),
);

routes.get(
  '/versions',
  h(async (_req, res) => {
    const result = await rc().listVersions({ pageSize: 10 });
    res.json({ versions: (result.versions ?? []).map(versionInfo) });
  }),
);

routes.post(
  '/rollback',
  h(async (req, res) => {
    const { versionNumber } = req.body as { versionNumber?: unknown };
    if (typeof versionNumber !== 'string' || !versionNumber) {
      throw new HttpError(400, 'Missing versionNumber');
    }
    const template = await rc().rollback(versionNumber);
    res.json({
      etag: template.etag,
      versionNumber: template.version?.versionNumber,
    });
  }),
);
