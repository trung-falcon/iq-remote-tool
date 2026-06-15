import { useCallback, useEffect, useState } from 'react';
import { api, type TemplateResponse } from './api';

// Low-level provider: fetches the whole template once and exposes its data +
// reload. Per-section draft logic lives in use-native-drafts / use-trigger-drafts;
// the publish flow lives in use-publish-flow. All share this single fetch + etag.
export function useTemplate() {
  const [data, setData] = useState<TemplateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setData(await api.getTemplate());
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    loading,
    loadError,
    etag: data?.etag ?? null,
    version: data?.version,
    params: data?.params ?? {},
    triggers: data?.triggers ?? {},
    adsWf: data?.adsWf ?? {},
    nativeAds: data?.nativeAds ?? {},
    reload,
  };
}
