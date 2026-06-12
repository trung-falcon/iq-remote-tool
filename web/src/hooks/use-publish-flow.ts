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
      const r = await api.publish(etag, changes, deletes);
      setDiffOpen(false);
      message.success(`Đã publish thành công — version ${r.versionNumber ?? '?'}`);
      await reload();
    } catch (e) {
      if (e instanceof ApiError && e.isEtagConflict) {
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
