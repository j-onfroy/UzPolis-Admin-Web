'use client';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { api } from './api';
import { PageResult } from './types';

const PAGE_SIZE = 20;

function emptyPage<T>(): PageResult<T> {
  return { content: [], totalElements: 0, totalPages: 0, page: 0, size: PAGE_SIZE };
}

/**
 * Fetches a paginated admin-api resource and refetches whenever `params` change.
 * Stale requests are aborted, so a slow response can never overwrite a newer one.
 */
export function usePagedQuery<T>(url: string, params: Record<string, unknown>) {
  const [version, setVersion] = useState(0);
  const requestKey = JSON.stringify([url, params, version]);
  const [result, setResult] = useState<{ key: string | null; data: PageResult<T> }>({
    key: null,
    data: emptyPage<T>(),
  });

  useEffect(() => {
    const [reqUrl, reqParams] = JSON.parse(requestKey) as [string, Record<string, unknown>];
    const controller = new AbortController();

    api
      .get<PageResult<T>>(reqUrl, { params: { ...reqParams, size: PAGE_SIZE }, signal: controller.signal })
      .then(({ data }) => setResult({ key: requestKey, data }))
      .catch((err) => {
        if (axios.isCancel(err)) return;
        // Keep the previously loaded rows on failure
        setResult((prev) => ({ key: requestKey, data: prev.data }));
      });

    return () => controller.abort();
  }, [requestKey]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data: result.data, loading: result.key !== requestKey, reload };
}
