import { App } from 'antd';
import { useMemo, useState } from 'react';
import { api, ApiError, type ParamSummary } from '../api';
import type { DiffItem } from '../components/diff-modal';

type Args = {
  etag: string | null;
  changes: Record<string, string>;
  getSummary: (key: string) => ParamSummary | undefined;
  reload: () => Promise<void> | void;
  deletes?: string[]; // keys to remove from the template entirely (triggers only)
};

// Shared publish flow for any section: validate → diff modal → publish → resync,
// with etag-conflict (409) → reload prompt. Whole-template publish only touches
// the keys in `changes` (set) and `deletes` (removed).
export function usePublishFlow({ etag, changes, getSummary, reload, deletes = [] }: Args) {
  const { message, modal } = App.useApp();
  const [diffOpen, setDiffOpen] = useState(false);
  const [validating, setValidating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const diffItems: DiffItem[] = useMemo(
    () => [
      ...Object.keys(changes).map(key => {
        const s = getSummary(key);
        return { key, oldRaw: s?.defaultValue ?? '', newRaw: changes[key], exists: s?.exists ?? false };
      }),
      ...deletes.map(key => ({
        key,
        oldRaw: getSummary(key)?.defaultValue ?? '',
        newRaw: '',
        exists: true,
        deleted: true,
      })),
    ],
    [changes, deletes, getSummary],
  );

  const openDiff = async () => {
    setValidating(true);
    try {
      await api.validate(changes, deletes);
      setDiffOpen(true);
    } catch (e) {
      message.error(`Validate thất bại: ${(e as Error).message}`);
    } finally {
      setValidating(false);
    }
  };

  const confirmPublish = async () => {
    if (!etag) return;
    setPublishing(true);
    try {
      // Firebase Remote Config has a single template/etag, so publishes are always
      // serialized — concurrent tabs can't write at the same instant, the loser
      // gets a 409. Our publish only merges the keys in `changes`/`deletes` into the
      // latest template, so on conflict we just re-fetch the fresh etag and retry.
      // Looping (not a single retry) lets many tabs publishing at once each succeed
      // in turn (last-write-wins per key); other keys edited elsewhere are kept.
      const MAX_ATTEMPTS = 5;
      let r: Awaited<ReturnType<typeof api.publish>> | undefined;
      let currentEtag = etag;
      for (let attempt = 1; ; attempt++) {
        try {
          r = await api.publish(currentEtag, changes, deletes);
          break;
        } catch (e) {
          if (e instanceof ApiError && e.isEtagConflict && attempt < MAX_ATTEMPTS) {
            currentEtag = (await api.getTemplate()).etag;
            continue;
          }
          throw e;
        }
      }
      setDiffOpen(false);
      message.success(`Đã publish thành công — version ${r?.versionNumber ?? '?'}`);
      await reload();
    } catch (e) {
      if (e instanceof ApiError && e.isEtagConflict) {
        // Two publishes raced even after the retry — fall back to the manual prompt.
        setDiffOpen(false);
        modal.confirm({
          title: 'Template đã bị thay đổi từ nơi khác',
          content:
            'Có người khác vừa sửa Remote Config (etag conflict). Reload để lấy bản mới nhất? Các chỉnh sửa chưa publish sẽ bị mất.',
          okText: 'Reload',
          cancelText: 'Để sau',
          onOk: () => reload(),
        });
      } else {
        message.error(`Publish thất bại: ${(e as Error).message}`);
      }
    } finally {
      setPublishing(false);
    }
  };

  return { diffOpen, validating, publishing, diffItems, openDiff, confirmPublish, cancelDiff: () => setDiffOpen(false) };
}

export type PublishFlow = ReturnType<typeof usePublishFlow>;
