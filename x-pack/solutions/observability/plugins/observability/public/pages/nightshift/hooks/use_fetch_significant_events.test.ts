/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { renderHook } from '@testing-library/react';
import { NIGHTSHIFT_LANDING_SEVERITY } from '../common/nightshift_constants';
import { useFetchSignificantEvents } from './use_fetch_significant_events';

const mockHttpGet = jest.fn();

jest.mock('../../../utils/kibana_react', () => ({
  useKibana: () => ({
    services: {
      http: {
        get: mockHttpGet,
      },
    },
  }),
}));

let capturedQueryFn: ((args: { signal?: AbortSignal }) => Promise<unknown>) | undefined;

jest.mock('@kbn/react-query', () => ({
  useQuery: (params: {
    queryKey: string[];
    queryFn: (args: { signal?: AbortSignal }) => Promise<unknown>;
  }) => {
    capturedQueryFn = params.queryFn;
    return {
      data: undefined,
      isLoading: true,
    };
  },
}));

describe('useFetchSignificantEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpGet.mockResolvedValue({
      hits: [],
      page: 1,
      perPage: 1000,
      total: 0,
    });
  });

  it('requests critical-severity events for the landing page', async () => {
    renderHook(() => useFetchSignificantEvents());

    await capturedQueryFn!({ signal: undefined });

    expect(mockHttpGet).toHaveBeenCalledWith(
      '/internal/significant_events/events',
      expect.objectContaining({
        query: expect.objectContaining({
          severity: NIGHTSHIFT_LANDING_SEVERITY,
        }),
      })
    );
  });
});
