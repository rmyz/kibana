/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SignificantEvent } from '@kbn/significant-events-schema';
import {
  buildBlastRadiusChips,
  eventHasBlastRadiusChip,
  filterEventsByBlastRadiusChip,
  getBlastRadiusEntryChipName,
} from './blast_radius_chips';

const mockEvent = (overrides: Partial<SignificantEvent> = {}): SignificantEvent => ({
  '@timestamp': '2026-01-01T00:00:00.000Z',
  event_id: 'evt-1',
  event_uuid: 'evt-uuid-1',
  status: 'open',
  stream_names: ['service-a'],
  title: 'Event',
  summary: 'Summary',
  severity: '40-medium',
  confidence: 0.9,
  ...overrides,
});

describe('blast_radius_chips', () => {
  it('builds chips from blast_radius entries on need-action events', () => {
    const chips = buildBlastRadiusChips([
      mockEvent({
        severity: '80-critical',
        blast_radius: [
          {
            type: 'entity',
            feature_id: 'feat-1',
            name: 'checkout-api',
            stream_name: 'logs.checkout',
          },
        ],
      }),
    ]);

    expect(chips).toEqual([{ count: 1, name: 'checkout-api' }]);
  });

  it('falls back to stream_names when blast_radius is empty', () => {
    const chips = buildBlastRadiusChips([
      mockEvent({ stream_names: ['service-a', 'service-b'] }),
      mockEvent({ event_id: '2', event_uuid: 'uuid-2', stream_names: ['service-a'] }),
    ]);

    expect(chips).toEqual([
      { count: 2, name: 'service-a' },
      { count: 1, name: 'service-b' },
    ]);
  });

  it('filters events by blast radius chip name', () => {
    const events = [
      mockEvent({
        event_id: '1',
        blast_radius: [
          {
            type: 'entity',
            feature_id: 'f1',
            name: 'checkout-api',
            stream_name: 'logs.checkout',
          },
        ],
      }),
      mockEvent({
        event_id: '2',
        event_uuid: 'uuid-2',
        stream_names: ['other-service'],
      }),
    ];

    expect(filterEventsByBlastRadiusChip(events, 'checkout-api')).toHaveLength(1);
    expect(eventHasBlastRadiusChip(events[1], 'other-service')).toBe(true);
  });

  it('names infrastructure chips from workloads before title', () => {
    expect(
      getBlastRadiusEntryChipName({
        type: 'infrastructure',
        feature_id: 'infra-1',
        title: 'Elasticsearch data nodes',
        workloads: ['data-node-1'],
        stream_name: 'metrics.elasticsearch',
      })
    ).toBe('data-node-1');
  });
});
