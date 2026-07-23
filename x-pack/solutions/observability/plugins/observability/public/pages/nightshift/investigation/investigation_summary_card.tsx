/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import React, { useCallback } from 'react';
import {
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiIcon,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import type { InvestigationStatus } from '@kbn/investigation-output';
import type { InvestigationState } from '@kbn/significant-events-schema';
import { i18n } from '@kbn/i18n';
import {
  buildBlindSpotChatOptions,
  buildRecommendationChatOptions,
} from './open_investigation_item_in_chat';
import { useKibana } from '../../../utils/kibana_react';
import { InvestigationItemChatButton } from './investigation_item_chat_button';
import { InvestigationCompleteStatus } from './investigation_status_badge';
import { InvestigationFormattedText } from './investigation_formatted_text';
import {
  nightshiftBackgroundTransition,
  nightshiftOpacityTransition,
  nightshiftReducedMotionStyles,
} from '../common/nightshift_transition';
import {
  getConclusionBody,
  getInvestigationGoalText,
  getInvestigationHeadline,
  getInvestigationStatusLabel,
  getInvestigationTimeLabel,
  formatBlindSpotMarkdown,
  getPrimaryRecommendation,
  mapBlindSpots,
  type BlindSpotItem,
  type InvestigationRecommendation,
} from './investigation_presentation';

const INLINE_BLIND_SPOT_LIMIT = 4;
const summaryRowActionClassName = 'nightshiftInvestigationSummaryRowAction';

const blindSpotChatTooltip = i18n.translate(
  'xpack.observability.nightshift.investigation.blindSpotChatTooltip',
  {
    defaultMessage: 'Ask agent about this blind spot',
  }
);

const recommendationChatTooltip = i18n.translate(
  'xpack.observability.nightshift.investigation.recommendationChatTooltip',
  {
    defaultMessage: 'Ask agent about this recommendation',
  }
);

function InvestigationStatusRow({
  status,
  state,
  startedAt,
  endedAt,
  isRunning,
}: {
  status: InvestigationStatus;
  state?: InvestigationState;
  startedAt: string;
  endedAt?: number | string;
  isRunning: boolean;
}): React.ReactElement {
  const statusLabel = getInvestigationStatusLabel(status, state);
  const timeLabel = getInvestigationTimeLabel({
    startedAt,
    endedAt,
    isRunning,
  });

  return (
    <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
      <EuiFlexItem grow={false}>
        {status === 'running' || status === 'loading' ? (
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="m" data-test-subj="nightshiftInvestigationStatusSpinner" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle size="xxs">
                <h4>{statusLabel}</h4>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : status === 'complete' ? (
          <EuiTitle size="xxs">
            <h4>
              <InvestigationCompleteStatus
                label={statusLabel}
                testSubj="nightshiftInvestigationStatusIcon"
              />
            </h4>
          </EuiTitle>
        ) : (
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiIcon
                type="warning"
                color="warning"
                data-test-subj="nightshiftInvestigationStatusIcon"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle size="xxs">
                <h4>{statusLabel}</h4>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiText size="xs" color="subdued" data-test-subj="nightshiftInvestigationTimeLabel">
          {timeLabel}
        </EuiText>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

function BlindSpotsList({ items }: { items: BlindSpotItem[] }): React.ReactElement {
  const { euiTheme } = useEuiTheme();
  const { agentBuilder } = useKibana().services;

  const openBlindSpotInChat = useCallback(
    (blindSpot: BlindSpotItem, index: number) => {
      agentBuilder?.openChat(
        buildBlindSpotChatOptions(blindSpot, `nightshift-blind-spot-${index}`)
      );
    },
    [agentBuilder]
  );

  return (
    <EuiPanel hasBorder paddingSize="m" data-test-subj="nightshiftInvestigationBlindSpotsPanel">
      <EuiTitle size="xxs">
        <h4>
          {i18n.translate('xpack.observability.nightshift.investigation.blindSpotsTitle', {
            defaultMessage: 'Blind spots',
          })}
        </h4>
      </EuiTitle>
      <EuiSpacer size="m" />
      <EuiFlexGroup direction="column" gutterSize="s" responsive={false}>
        {items.map((item, index) => (
          <EuiFlexItem key={`${item.title}-${index}`} grow={false}>
            <EuiPanel
              hasBorder
              paddingSize="m"
              data-test-subj={`nightshiftInvestigationBlindSpotItem-${index}`}
              css={css`
                background: ${euiTheme.colors.backgroundBasePlain};
                transition: ${nightshiftBackgroundTransition(euiTheme)};

                &:hover {
                  background: ${euiTheme.colors.backgroundBaseSubdued};
                }

                &:hover
                  .${summaryRowActionClassName},
                  &:focus-within
                  .${summaryRowActionClassName} {
                  opacity: 1;
                }
              `}
            >
              <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
                <EuiFlexItem>
                  <InvestigationFormattedText text={formatBlindSpotMarkdown(item)} />
                </EuiFlexItem>
                <EuiFlexItem
                  grow={false}
                  className={summaryRowActionClassName}
                  css={css`
                    opacity: 0;
                    transition: ${nightshiftOpacityTransition(euiTheme)};

                    @media (prefers-reduced-motion: reduce) {
                      opacity: 1;
                    }

                    ${nightshiftReducedMotionStyles}
                  `}
                >
                  <InvestigationItemChatButton
                    tooltip={blindSpotChatTooltip}
                    testSubj={`nightshiftInvestigationBlindSpotChatButton-${index}`}
                    onClick={() => openBlindSpotInChat(item, index)}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiPanel>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </EuiPanel>
  );
}

function TryNextPanel({
  recommendation,
  onShowMoreRecommendations,
}: {
  recommendation: InvestigationRecommendation;
  onShowMoreRecommendations?: () => void;
}): React.ReactElement {
  const { euiTheme } = useEuiTheme();
  const { agentBuilder } = useKibana().services;

  const openRecommendationInChat = useCallback(() => {
    agentBuilder?.openChat(buildRecommendationChatOptions(recommendation, 'nightshift-try-next'));
  }, [agentBuilder, recommendation]);

  return (
    <EuiPanel hasBorder paddingSize="m" data-test-subj="nightshiftInvestigationTryNextPanel">
      <EuiFlexGroup alignItems="center" justifyContent="spaceBetween" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiTitle size="xxs">
            <h4>
              {i18n.translate('xpack.observability.nightshift.investigation.tryNextTitle', {
                defaultMessage: 'Try next',
              })}
            </h4>
          </EuiTitle>
        </EuiFlexItem>
        {onShowMoreRecommendations && (
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              size="xs"
              color="primary"
              data-test-subj="nightshiftInvestigationMoreRecommendationsLink"
              onClick={onShowMoreRecommendations}
            >
              {i18n.translate('xpack.observability.nightshift.investigation.moreRecommendations', {
                defaultMessage: 'More recommendations',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiHorizontalRule margin="s" />
      <div
        css={css`
          &:hover .${summaryRowActionClassName}, &:focus-within .${summaryRowActionClassName} {
            opacity: 1;
          }
        `}
      >
        <EuiFlexGroup alignItems="flexStart" justifyContent="spaceBetween" responsive={false}>
          <EuiFlexItem>
            <InvestigationFormattedText text={recommendation.title} />
            {recommendation.description && (
              <>
                <EuiSpacer size="xs" />
                <InvestigationFormattedText text={recommendation.description} />
              </>
            )}
            {recommendation.code && (
              <>
                <EuiSpacer size="s" />
                <EuiCodeBlock language="shell" isCopyable fontSize="s">
                  {recommendation.code}
                </EuiCodeBlock>
              </>
            )}
          </EuiFlexItem>
          <EuiFlexItem
            grow={false}
            className={summaryRowActionClassName}
            css={css`
              opacity: 0;
              transition: ${nightshiftOpacityTransition(euiTheme)};

              @media (prefers-reduced-motion: reduce) {
                opacity: 1;
              }

              ${nightshiftReducedMotionStyles}
            `}
          >
            <InvestigationItemChatButton
              tooltip={recommendationChatTooltip}
              testSubj="nightshiftInvestigationTryNextChatButton"
              onClick={openRecommendationInChat}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </div>
    </EuiPanel>
  );
}

export interface InvestigationSummaryCardProps {
  eventTitle: string;
  status: InvestigationStatus;
  state?: InvestigationState;
  error?: string;
  startedAt: string;
  completedAt?: string;
  onShowMoreRecommendations?: () => void;
}

export function InvestigationSummaryCard({
  eventTitle,
  status,
  state,
  error,
  startedAt,
  completedAt,
  onShowMoreRecommendations,
}: InvestigationSummaryCardProps): React.ReactElement {
  const { euiTheme } = useEuiTheme();
  const isRunning = status === 'running' || status === 'loading';
  const headline = getInvestigationHeadline({ eventTitle, state, status });
  const goalText = getInvestigationGoalText(state);
  const conclusionBody = getConclusionBody(state?.conclusion);
  const primaryRecommendation = status === 'complete' ? getPrimaryRecommendation(state) : undefined;
  const blindSpots =
    status === 'complete' ? mapBlindSpots(state?.gaps_found).slice(0, INLINE_BLIND_SPOT_LIMIT) : [];

  return (
    <>
      <EuiPanel
        hasBorder
        paddingSize="m"
        data-test-subj="nightshiftInvestigationSummaryCard"
        css={css`
          background: ${euiTheme.colors.backgroundBasePlain};
        `}
      >
        <InvestigationStatusRow
          status={status}
          state={state}
          startedAt={startedAt}
          endedAt={completedAt}
          isRunning={isRunning}
        />

        {(status === 'complete' || isRunning || error) && (
          <>
            <EuiHorizontalRule margin="m" />
            <EuiTitle size="xxs">
              <h4 data-test-subj="nightshiftInvestigationHeadline">{headline}</h4>
            </EuiTitle>

            {status === 'complete' && conclusionBody && (
              <>
                <EuiSpacer size="s" />
                <div data-test-subj="nightshiftInvestigationConclusionPreview">
                  <InvestigationFormattedText text={conclusionBody} />
                </div>
              </>
            )}

            {isRunning && goalText && (
              <>
                <EuiSpacer size="s" />
                <div data-test-subj="nightshiftInvestigationGoalPreview">
                  <InvestigationFormattedText text={goalText} subdued />
                </div>
              </>
            )}

            {error && (
              <>
                <EuiSpacer size="s" />
                <EuiText size="s" color="danger" data-test-subj="nightshiftInvestigationError">
                  {error}
                </EuiText>
              </>
            )}
          </>
        )}
      </EuiPanel>

      {status === 'complete' && primaryRecommendation && (
        <>
          <EuiSpacer size="s" />
          <TryNextPanel
            recommendation={primaryRecommendation}
            onShowMoreRecommendations={onShowMoreRecommendations}
          />
        </>
      )}

      {status === 'complete' && blindSpots.length > 0 && (
        <>
          <EuiSpacer size="s" />
          <BlindSpotsList items={blindSpots} />
        </>
      )}
    </>
  );
}
