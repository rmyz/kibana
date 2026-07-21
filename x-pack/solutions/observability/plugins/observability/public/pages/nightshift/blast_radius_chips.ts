/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { BlastRadiusEntry, Feature, SignificantEvent } from '@kbn/significant-events-schema';

export interface BlastRadiusChip {
  count: number;
  name: string;
}

export const getFeatureDisplayName = (feature: Feature): string => {
  const propertyName = feature.properties?.name;
  if (typeof propertyName === 'string' && propertyName.length > 0) {
    return propertyName;
  }
  return feature.title ?? feature.id;
};

export const getBlastRadiusEntryChipName = (entry: BlastRadiusEntry): string => {
  switch (entry.type) {
    case 'dependency':
      return entry.target;
    case 'infrastructure':
      return entry.workloads?.[0] ?? entry.title ?? entry.stream_name;
    case 'entity':
      return entry.name;
  }
};

const getBlastRadiusEntryChipKey = (entry: BlastRadiusEntry): string =>
  `${entry.type}:${entry.feature_id}:${getBlastRadiusEntryChipName(entry)}`;

export const eventHasBlastRadiusChip = (event: SignificantEvent, chipName: string): boolean => {
  const blastRadius = event.blast_radius ?? [];
  if (blastRadius.length > 0) {
    return blastRadius.some((entry) => getBlastRadiusEntryChipName(entry) === chipName);
  }
  return (event.stream_names ?? []).includes(chipName);
};

/** Landing blast-radius pills from `blast_radius[]` on need-action events (falls back to `stream_names`). */
export const buildBlastRadiusChips = (events: SignificantEvent[]): BlastRadiusChip[] => {
  const byChip = new Map<string, { count: number; maxSeverity: string }>();

  events.forEach((event) => {
    const blastRadius = event.blast_radius ?? [];
    const chipKeys =
      blastRadius.length > 0
        ? blastRadius.map((entry) => ({
            key: getBlastRadiusEntryChipKey(entry),
            name: getBlastRadiusEntryChipName(entry),
          }))
        : (event.stream_names ?? []).map((name) => ({ key: name, name }));

    const seenOnEvent = new Set<string>();
    chipKeys.forEach(({ key, name }) => {
      if (seenOnEvent.has(key)) {
        return;
      }
      seenOnEvent.add(key);
      const current = byChip.get(name) ?? { count: 0, maxSeverity: '' };
      byChip.set(name, {
        count: current.count + 1,
        maxSeverity: event.severity > current.maxSeverity ? event.severity : current.maxSeverity,
      });
    });
  });

  return Array.from(byChip, ([name, { count, maxSeverity }]) => ({
    count,
    maxSeverity,
    name,
  }))
    .sort(
      (first, second) =>
        second.maxSeverity.localeCompare(first.maxSeverity) ||
        second.count - first.count ||
        first.name.localeCompare(second.name)
    )
    .map(({ count, name }) => ({ count, name }));
};

export const filterEventsByBlastRadiusChip = (
  events: SignificantEvent[],
  chipName: string | undefined
): SignificantEvent[] =>
  chipName ? events.filter((event) => eventHasBlastRadiusChip(event, chipName)) : events;
