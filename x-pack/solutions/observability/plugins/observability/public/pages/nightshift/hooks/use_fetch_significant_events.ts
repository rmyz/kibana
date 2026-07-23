/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import moment from 'moment';
import { useQuery, type UseQueryResult } from '@kbn/react-query';
import type { HttpSetup } from '@kbn/core/public';
import type { SignificantEvent } from '@kbn/significant-events-schema';
import { useKibana } from '../../../utils/kibana_react';

/**
 * The significant-events events endpoint returns a paginated envelope. We mirror the
 * shape locally instead of importing it from another plugin so the Observability
 * bundle does not couple to Streams' public contract for a value it only reads.
 */
interface PaginatedResponse<T> {
  hits: T[];
  page: number;
  perPage: number;
  total: number;
}

/** Server allows up to 1000 hits per page (`events` internal route). */
export const NIGHTSHIFT_EVENTS_PAGE_SIZE = 1000;
const NIGHTSHIFT_LOOKBACK_DAYS = 30;
const MAX_FETCH_PAGES = 10;

const fetchAllSignificantEvents = async ({
  http,
  signal,
  from,
  to,
}: {
  http: HttpSetup;
  signal: AbortSignal | undefined;
  from: string;
  to: string;
}): Promise<PaginatedResponse<SignificantEvent>> => {
  const allHits: SignificantEvent[] = [];
  let page = 1;
  let total = 0;

  while (page <= MAX_FETCH_PAGES) {
    const response = await http.get<PaginatedResponse<SignificantEvent>>(
      '/internal/significant_events/events',
      {
        query: {
          page,
          perPage: NIGHTSHIFT_EVENTS_PAGE_SIZE,
          from,
          to,
        },
        signal,
      }
    );

    allHits.push(...response.hits);
    total = response.total;

    if (allHits.length >= total || response.hits.length === 0) {
      break;
    }

    page += 1;
  }

  return {
    hits: allHits,
    page: 1,
    perPage: allHits.length,
    total,
  };
};

export const useFetchSignificantEvents = (): UseQueryResult<
  PaginatedResponse<SignificantEvent>,
  Error
> => {
  const { http } = useKibana().services;

  return useQuery<PaginatedResponse<SignificantEvent>, Error>({
    queryKey: ['nightshift.significantEvents'],
    queryFn: async ({ signal }) => {
      const from = moment().subtract(NIGHTSHIFT_LOOKBACK_DAYS, 'days').toISOString();
      const to = moment().toISOString();

      return fetchAllSignificantEvents({ http, signal, from, to });
    },
  });
};
