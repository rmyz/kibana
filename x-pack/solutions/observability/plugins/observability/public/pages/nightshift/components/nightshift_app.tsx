/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
  EuiPanel,
  EuiText,
  useEuiTheme,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import type { SignificantEvent } from '@kbn/significant-events-schema';
import { BlastRadiusEntities } from './blast_radius_entities';
import { EventFlyout } from './event_flyout';
import { NightshiftTitle } from './nightshift_title';
import { SignificantEventList } from './significant_event_list';
import { SignificantEventStatuses } from './significant_event_statuses';
import { useKibana } from '../../../utils/kibana_react';
import { useFetchSignificantEvents } from '../hooks/use_fetch_significant_events';
import {
  byCriticalityAndUpdatedAtDesc,
  getNeedsActionEvents,
  getResolvedEvents,
} from '../significant_event_status';
import { buildBlastRadiusChips, filterEventsByBlastRadiusChip } from '../blast_radius_chips';
import { buildNewSignificantEventChatOptions } from '../open_significant_event_in_chat';

// Kept in the URL so a refresh or a shared link restores the open flyout.
const SELECTED_EVENT_QUERY_PARAM = 'eventUuid';

export function NightshiftApp(): React.ReactElement {
  const { euiTheme } = useEuiTheme();
  const { agentBuilder, application } = useKibana().services;
  const [selectedStreamName, setSelectedStreamName] = useState<string>();
  const history = useHistory();
  const { search } = useLocation();
  const needsActionSectionRef = useRef<HTMLElement>(null);
  const resolvedSectionRef = useRef<HTMLElement>(null);

  const { data, error: eventsError, isLoading, refetch } = useFetchSignificantEvents();

  const events = useMemo(() => data?.hits ?? [], [data]);

  // Derived from the freshest fetched list (not a click-time snapshot), so
  // background refetches keep the open flyout current.
  const selectedEventUuid = useMemo(
    () => new URLSearchParams(search).get(SELECTED_EVENT_QUERY_PARAM) ?? undefined,
    [search]
  );
  const selectedEvent = useMemo(
    () => events.find(({ event_uuid: eventUuid }) => eventUuid === selectedEventUuid),
    [events, selectedEventUuid]
  );
  const [eventNotFound, setEventNotFound] = useState(false);

  const showAllEventsHref = application.getUrlForApp('streams', {
    deepLinkId: 'significantEventsEvents',
  });

  const handleChatClick = useCallback(
    (event: SignificantEvent) => {
      agentBuilder?.openChat(buildNewSignificantEventChatOptions(event));
    },
    [agentBuilder]
  );
  const onChatClick = agentBuilder ? handleChatClick : undefined;

  const handleEventClick = useCallback(
    (event: SignificantEvent) => {
      const params = new URLSearchParams(history.location.search);
      params.set(SELECTED_EVENT_QUERY_PARAM, event.event_uuid);
      history.replace({ search: params.toString() });
    },
    [history]
  );

  const handleFlyoutClose = useCallback(() => {
    const params = new URLSearchParams(history.location.search);
    params.delete(SELECTED_EVENT_QUERY_PARAM);
    history.replace({ search: params.toString() });
  }, [history]);

  // Highest-severity events first so critical items are never buried below older, lower-impact ones.
  const needsActionEvents = useMemo(
    () => getNeedsActionEvents(events).sort(byCriticalityAndUpdatedAtDesc),
    [events]
  );
  const resolvedEvents = useMemo(
    () => getResolvedEvents(events).sort(byCriticalityAndUpdatedAtDesc),
    [events]
  );

  // The events we display drive the empty state.
  const shownEvents = useMemo(
    () => [...needsActionEvents, ...resolvedEvents],
    [needsActionEvents, resolvedEvents]
  );

  // Blast radius pills come from each event's `blast_radius[]` (stream_names only when absent).
  const blastRadius = useMemo(() => buildBlastRadiusChips(needsActionEvents), [needsActionEvents]);

  const activeBlastRadiusChip = blastRadius.some(({ name }) => name === selectedStreamName)
    ? selectedStreamName
    : undefined;

  const visibleNeedsActionEvents = useMemo(
    () => filterEventsByBlastRadiusChip(needsActionEvents, activeBlastRadiusChip),
    [needsActionEvents, activeBlastRadiusChip]
  );
  const visibleResolvedEvents = useMemo(
    () => filterEventsByBlastRadiusChip(resolvedEvents, activeBlastRadiusChip),
    [resolvedEvents, activeBlastRadiusChip]
  );

  const selectedEventVisible = useMemo(() => {
    if (!selectedEvent) {
      return false;
    }
    return (
      needsActionEvents.some(
        ({ event_uuid: eventUuid }) => eventUuid === selectedEvent.event_uuid
      ) ||
      resolvedEvents.some(({ event_uuid: eventUuid }) => eventUuid === selectedEvent.event_uuid)
    );
  }, [needsActionEvents, resolvedEvents, selectedEvent]);

  useEffect(() => {
    if (selectedEventUuid && !selectedEvent && !isLoading) {
      setEventNotFound(true);
      handleFlyoutClose();
      return;
    }
    setEventNotFound(false);
  }, [handleFlyoutClose, isLoading, selectedEvent, selectedEventUuid]);

  useEffect(() => {
    if (selectedEvent && activeBlastRadiusChip && !selectedEventVisible) {
      handleFlyoutClose();
    }
  }, [activeBlastRadiusChip, handleFlyoutClose, selectedEvent, selectedEventVisible]);
  const scrollToSection = (sectionRef: React.RefObject<HTMLElement>) => {
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToNeedsAction = useCallback(() => {
    scrollToSection(needsActionSectionRef);
  }, []);

  const scrollToResolved = useCallback(() => {
    scrollToSection(resolvedSectionRef);
  }, []);

  const hasEvents = shownEvents.length > 0;
  const hasNeedsAction = needsActionEvents.length > 0;

  // Only treat a load failure as fatal when there is nothing to show; a failed
  // background refetch that still has cached data degrades to a non-blocking warning.
  if (eventsError && !hasEvents && !isLoading) {
    return <LoadingErrorCallout onRetry={() => refetch()} />;
  }

  return (
    <EuiFlexGroup
      direction="column"
      gutterSize="none"
      responsive={false}
      css={css`
        background: ${euiTheme.colors.backgroundBaseSubdued};
        margin-top: ${euiTheme.size.l};
        padding: ${euiTheme.size.xxl} 0 calc(${euiTheme.size.xxl} * 1.5);
      `}
    >
      <NightshiftTitle
        isLoading={isLoading}
        hasNeedsAction={hasNeedsAction}
        showAllEventsHref={showAllEventsHref}
      />

      {isLoading ? (
        <EuiFlexItem
          css={css`
            margin-top: ${euiTheme.size.l};
          `}
        >
          <EuiFlexGroup
            alignItems="center"
            justifyContent="center"
            responsive={false}
            css={css`
              min-height: calc(${euiTheme.size.xxl} * 4);
            `}
          >
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner
                size="xl"
                aria-label={i18n.translate('xpack.observability.nightshift.loadingLabel', {
                  defaultMessage: 'Loading significant events',
                })}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      ) : !hasEvents ? (
        <>
          <EuiFlexItem
            css={css`
              margin-top: ${euiTheme.size.l};
            `}
          >
            <EuiPanel hasBorder hasShadow={false} paddingSize="l" color="subdued">
              <EuiText textAlign="center" color="subdued" size="s">
                <p>
                  {i18n.translate('xpack.observability.nightshift.allClearDescription', {
                    defaultMessage:
                      'No significant events were detected. Nothing needs your attention.',
                  })}
                </p>
              </EuiText>
            </EuiPanel>
          </EuiFlexItem>
        </>
      ) : (
        <>
          {eventsError && (
            <EuiFlexItem
              css={css`
                margin-top: ${euiTheme.size.m};
              `}
            >
              <EuiCallOut
                announceOnMount
                color="warning"
                iconType="warning"
                size="s"
                title={i18n.translate('xpack.observability.nightshift.refreshWarningTitle', {
                  defaultMessage: 'Showing the last loaded results; refreshing failed.',
                })}
              >
                <EuiButtonEmpty
                  color="warning"
                  data-test-subj="nightshiftRefreshRetryButton"
                  flush="left"
                  iconType="refresh"
                  onClick={() => refetch()}
                  size="s"
                >
                  {i18n.translate('xpack.observability.nightshift.retryButtonText', {
                    defaultMessage: 'Retry',
                  })}
                </EuiButtonEmpty>
              </EuiCallOut>
            </EuiFlexItem>
          )}

          {eventNotFound && (
            <EuiFlexItem
              css={css`
                margin-top: ${euiTheme.size.m};
              `}
            >
              <EuiCallOut
                announceOnMount
                color="warning"
                iconType="warning"
                size="s"
                title={i18n.translate('xpack.observability.nightshift.eventNotFoundTitle', {
                  defaultMessage: 'Significant Event not found',
                })}
              >
                <EuiText size="s">
                  {i18n.translate('xpack.observability.nightshift.eventNotFoundDescription', {
                    defaultMessage:
                      'The event in this link is no longer in the current results. The URL has been cleared.',
                  })}
                </EuiText>
              </EuiCallOut>
            </EuiFlexItem>
          )}

          <SignificantEventStatuses
            needsActionCount={needsActionEvents.length}
            onNeedsActionClick={scrollToNeedsAction}
            onResolvedClick={scrollToResolved}
            resolvedCount={resolvedEvents.length}
          />

          <BlastRadiusEntities
            entities={blastRadius}
            onSelect={(name) => {
              setSelectedStreamName((current) => (current === name ? undefined : name));
            }}
            selectedEntity={activeBlastRadiusChip}
          />

          <EuiFlexItem
            css={css`
              margin-top: ${euiTheme.size.l};
            `}
          >
            <EuiFlexGroup direction="column" gutterSize="l" responsive={false}>
              {needsActionEvents.length > 0 && (
                <EuiFlexItem>
                  <SignificantEventList
                    events={visibleNeedsActionEvents}
                    onChatClick={onChatClick}
                    onEventClick={handleEventClick}
                    sectionRef={needsActionSectionRef}
                    selectedEventUuid={selectedEventUuid}
                    statusColor="danger"
                    title={i18n.translate('xpack.observability.nightshift.list.needsActionTitle', {
                      defaultMessage: 'Needs action',
                    })}
                  />
                </EuiFlexItem>
              )}
              {resolvedEvents.length > 0 && (
                <EuiFlexItem>
                  <SignificantEventList
                    events={visibleResolvedEvents}
                    onChatClick={onChatClick}
                    onEventClick={handleEventClick}
                    sectionRef={resolvedSectionRef}
                    selectedEventUuid={selectedEventUuid}
                    statusColor="success"
                    title={i18n.translate('xpack.observability.nightshift.list.resolvedTitle', {
                      defaultMessage: 'Resolved',
                    })}
                  />
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </>
      )}

      {selectedEvent && selectedEventVisible && (
        <EventFlyout
          key={selectedEvent.event_uuid}
          event={selectedEvent}
          onClose={handleFlyoutClose}
        />
      )}
    </EuiFlexGroup>
  );
}

function LoadingErrorCallout({ onRetry }: { onRetry: () => void }): React.ReactElement {
  const { euiTheme } = useEuiTheme();

  return (
    <EuiCallOut
      color="danger"
      iconType="warning"
      announceOnMount
      title={i18n.translate('xpack.observability.nightshift.loadingErrorTitle', {
        defaultMessage: 'Unable to load significant events',
      })}
      css={css`
        margin-top: ${euiTheme.size.l};
      `}
    >
      <EuiButton
        color="danger"
        data-test-subj="nightshiftLoadingErrorRetryButton"
        iconType="refresh"
        onClick={onRetry}
        size="s"
      >
        {i18n.translate('xpack.observability.nightshift.retryButtonText', {
          defaultMessage: 'Retry',
        })}
      </EuiButton>
    </EuiCallOut>
  );
}
