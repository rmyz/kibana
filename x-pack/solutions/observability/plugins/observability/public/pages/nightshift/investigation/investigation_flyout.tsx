/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBadgeGroup,
  EuiButtonIcon,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiHorizontalRule,
  EuiIcon,
  EuiLoadingSpinner,
  EuiNotificationBadge,
  EuiPanel,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
  useGeneratedHtmlId,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import type { InvestigationStatus } from '@kbn/investigation-output';
import type {
  InvestigationState,
  SignificantEventInvestigation,
} from '@kbn/significant-events-schema';
import { AiButton } from '@kbn/shared-ux-ai-components';
import { useKibana } from '../../../utils/kibana_react';
import { buildInvestigationConversationChatOptions } from '../chat/open_significant_event_in_chat';
import {
  buildBlindSpotChatOptions,
  buildHypothesisChatOptions,
  buildRecommendationChatOptions,
} from './open_investigation_item_in_chat';
import { useFormatTimestamp } from '../common/format_timestamp';
import { InvestigationFormattedText } from './investigation_formatted_text';
import { TruncatableSummary } from '../common/truncatable_summary';
import {
  GradientOutlinedStatusBadge,
  InvestigationCompleteCheckIcon,
  InvestigationGradientLabel,
} from './investigation_status_badge';
import { InvestigationItemChatButton } from './investigation_item_chat_button';
import {
  nightshiftBackgroundTransition,
  nightshiftOpacityTransition,
  nightshiftReducedMotionStyles,
  nightshiftTransformTransition,
} from '../common/nightshift_transition';
import {
  formatBlindSpotMarkdown,
  getConclusionBody,
  getHypothesisStatusLabel,
  getInvestigationGoalText,
  getInvestigationHeadline,
  getInvestigationStatusLabel,
  getInvestigationTimeLabel,
  mapBlindSpots,
  parseInvestigationRecommendations,
  type InvestigationRecommendation,
} from './investigation_presentation';

export type InvestigationFlyoutTabId = 'recommendations' | 'blindSpots' | 'hypotheses';

type CompletedTabId = InvestigationFlyoutTabId;

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

const hypothesisChatTooltip = i18n.translate(
  'xpack.observability.nightshift.investigation.hypothesisChatTooltip',
  {
    defaultMessage: 'Ask agent about this hypothesis',
  }
);

const hypothesisConfirmedAriaLabel = i18n.translate(
  'xpack.observability.nightshift.investigation.hypothesisConfirmedAriaLabel',
  {
    defaultMessage: 'Hypothesis confirmed',
  }
);

const investigationFlyoutRowActionClassName = 'nightshiftInvestigationFlyoutRowAction';

function InvestigationFlyoutListPanel({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const { euiTheme } = useEuiTheme();

  return (
    <EuiPanel
      hasBorder
      paddingSize="none"
      css={css`
        background: ${euiTheme.colors.backgroundBasePlain};
        transition: ${nightshiftBackgroundTransition(euiTheme)};

        &:hover {
          background: ${euiTheme.colors.backgroundBaseSubdued};
        }

        &:hover
          .${investigationFlyoutRowActionClassName},
          &:focus-within
          .${investigationFlyoutRowActionClassName} {
          opacity: 1;
        }
      `}
    >
      {children}
    </EuiPanel>
  );
}

function InvestigationFlyoutRow({
  testSubj,
  expandableContent,
  action,
  showExpandedSeparator = false,
  children,
}: {
  testSubj?: string;
  expandableContent?: React.ReactNode;
  action?: React.ReactNode;
  showExpandedSeparator?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  const { euiTheme } = useEuiTheme();
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useGeneratedHtmlId({ prefix: 'nightshiftInvestigationFlyoutRow' });
  const isExpandable = expandableContent != null;
  const expandRowLabel = isOpen
    ? i18n.translate('xpack.observability.nightshift.investigation.collapseRow', {
        defaultMessage: 'Collapse row',
      })
    : i18n.translate('xpack.observability.nightshift.investigation.expandRow', {
        defaultMessage: 'Expand row',
      });

  return (
    <div
      data-test-subj={testSubj}
      css={css`
        padding: ${euiTheme.size.m};
      `}
    >
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        {isExpandable && (
          <EuiFlexItem grow={false}>
            <EuiToolTip content={expandRowLabel} disableScreenReaderOutput>
              <EuiButtonIcon
                iconType="arrowRight"
                aria-label={expandRowLabel}
                aria-expanded={isOpen}
                aria-controls={contentId}
                color="text"
                data-test-subj={testSubj ? `${testSubj}Toggle` : undefined}
                onClick={() => setIsOpen((open) => !open)}
                css={css`
                  transform: rotate(${isOpen ? '90deg' : '0deg'});
                  transition: ${nightshiftTransformTransition(euiTheme)};
                  ${nightshiftReducedMotionStyles}
                `}
              />
            </EuiToolTip>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow>{children}</EuiFlexItem>
        {action && (
          <EuiFlexItem
            grow={false}
            className={investigationFlyoutRowActionClassName}
            css={css`
              opacity: 0;
              transition: ${nightshiftOpacityTransition(euiTheme)};

              @media (prefers-reduced-motion: reduce) {
                opacity: 1;
              }

              ${nightshiftReducedMotionStyles}
            `}
          >
            {action}
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      {isExpandable && isOpen && (
        <>
          <EuiSpacer size="s" />
          {showExpandedSeparator && <EuiHorizontalRule margin="none" />}
          <EuiSpacer size="s" />
          <div
            id={contentId}
            css={css`
              padding-left: calc(${euiTheme.size.l} + ${euiTheme.size.s});
            `}
          >
            {expandableContent}
          </div>
        </>
      )}
    </div>
  );
}

function InvestigationFlyoutBadge({ status }: { status: InvestigationStatus }): React.ReactElement {
  const isRunning = status === 'running' || status === 'loading';

  if (status === 'complete') {
    return (
      <GradientOutlinedStatusBadge
        label={getInvestigationStatusLabel(status)}
        testSubj="nightshiftInvestigationFlyoutCompleteBadge"
      />
    );
  }

  return (
    <EuiBadge color="hollow" data-test-subj="nightshiftInvestigationFlyoutProgressBadge">
      {isRunning
        ? i18n.translate('xpack.observability.nightshift.investigation.flyoutInProgress', {
            defaultMessage: 'In progress ...',
          })
        : getInvestigationStatusLabel(status)}
    </EuiBadge>
  );
}

function RecommendationRow({
  recommendation,
  index,
  onOpenInChat,
}: {
  recommendation: InvestigationRecommendation;
  index: number;
  onOpenInChat: () => void;
}): React.ReactElement {
  const hasExpandableContent = Boolean(recommendation.description || recommendation.code);

  return (
    <InvestigationFlyoutRow
      testSubj={`nightshiftInvestigationFlyoutRecommendation-${index}`}
      expandableContent={
        hasExpandableContent ? (
          <>
            {recommendation.description && (
              <InvestigationFormattedText text={recommendation.description} />
            )}
            {recommendation.code && (
              <>
                {recommendation.description && <EuiSpacer size="s" />}
                <EuiCodeBlock language="shell" isCopyable fontSize="s">
                  {recommendation.code}
                </EuiCodeBlock>
              </>
            )}
          </>
        ) : undefined
      }
      action={
        <InvestigationItemChatButton
          tooltip={recommendationChatTooltip}
          testSubj={`nightshiftInvestigationFlyoutRecommendationChatButton-${index}`}
          onClick={onOpenInChat}
        />
      }
    >
      <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
        <EuiFlexItem grow>
          <InvestigationFormattedText text={recommendation.title} />
        </EuiFlexItem>
        {recommendation.confidence != null && (
          <EuiFlexItem grow={false}>
            <EuiBadge color={recommendation.confidence >= 0.9 ? 'success' : 'hollow'}>
              <FormattedMessage
                id="xpack.observability.nightshift.investigation.recommendationConfidence"
                defaultMessage="{confidence, number, percent}"
                values={{ confidence: recommendation.confidence }}
              />
            </EuiBadge>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    </InvestigationFlyoutRow>
  );
}

function HypothesisStatusRow({
  status,
}: {
  status: InvestigationState['hypotheses'][number]['status'];
}): React.ReactElement {
  const iconSlotCss = css`
    align-items: center;
    display: inline-flex;
    flex-shrink: 0;
    height: 16px;
    justify-content: center;
    width: 16px;

    .euiIcon,
    .euiLoadingSpinner {
      height: 16px;
      width: 16px;
    }
  `;

  return (
    <div
      css={css`
        align-items: center;
        display: inline-flex;
        gap: 6px;
      `}
    >
      {status === 'investigating' ? (
        <span css={iconSlotCss}>
          <EuiLoadingSpinner
            size="s"
            css={css`
              height: 16px;
              width: 16px;
            `}
          />
        </span>
      ) : status === 'confirmed' ? (
        <InvestigationCompleteCheckIcon
          ariaLabel={hypothesisConfirmedAriaLabel}
          testSubj="nightshiftInvestigationFlyoutHypothesisConfirmedIcon"
          size="compact"
        />
      ) : status === 'dismissed' ? (
        <span css={iconSlotCss}>
          <EuiIcon
            type="trash"
            size="s"
            color="subdued"
            aria-hidden={true}
            data-test-subj="nightshiftInvestigationFlyoutHypothesisRejectedIcon"
            css={css`
              height: 16px;
              width: 16px;
            `}
          />
        </span>
      ) : null}
      {status === 'confirmed' ? (
        <InvestigationGradientLabel testSubj="nightshiftInvestigationFlyoutHypothesisConfirmedLabel">
          {getHypothesisStatusLabel(status)}
        </InvestigationGradientLabel>
      ) : (
        <EuiText
          size="xs"
          color="subdued"
          css={css`
            line-height: 1;
          `}
        >
          {getHypothesisStatusLabel(status)}
        </EuiText>
      )}
    </div>
  );
}

function HypothesisRow({
  candidate,
  confidence,
  status,
  reason,
  index,
  isConfidenceWinner,
  onOpenInChat,
}: {
  candidate: string;
  confidence: number;
  status: InvestigationState['hypotheses'][number]['status'];
  reason?: string;
  index: number;
  isConfidenceWinner: boolean;
  onOpenInChat: () => void;
}): React.ReactElement {
  return (
    <InvestigationFlyoutRow
      testSubj={`nightshiftInvestigationFlyoutHypothesis-${index}`}
      showExpandedSeparator={Boolean(reason)}
      expandableContent={reason ? <InvestigationFormattedText text={reason} /> : undefined}
      action={
        <InvestigationItemChatButton
          tooltip={hypothesisChatTooltip}
          testSubj={`nightshiftInvestigationFlyoutHypothesisChatButton-${index}`}
          onClick={onOpenInChat}
        />
      }
    >
      <EuiFlexGroup direction="column" gutterSize="xs" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup alignItems="center" gutterSize="s" responsive={false}>
            <EuiFlexItem grow>
              <InvestigationFormattedText text={candidate} bold />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color={isConfidenceWinner ? 'success' : 'default'}>
                <FormattedMessage
                  id="xpack.observability.nightshift.investigation.hypothesisConfidence"
                  defaultMessage="{confidence, number, percent}"
                  values={{ confidence }}
                />
              </EuiBadge>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <HypothesisStatusRow status={status} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </InvestigationFlyoutRow>
  );
}

export interface InvestigationFlyoutProps {
  eventTitle: string;
  investigation: SignificantEventInvestigation;
  status: InvestigationStatus;
  state?: InvestigationState;
  error?: string;
  conversationId?: string;
  onClose: () => void;
}

export function InvestigationFlyout({
  eventTitle,
  investigation,
  status,
  state,
  error,
  conversationId,
  onClose,
}: InvestigationFlyoutProps): React.ReactElement {
  const { euiTheme } = useEuiTheme();
  const { agentBuilder } = useKibana().services;
  const formatTimestamp = useFormatTimestamp();
  const [selectedTab, setSelectedTab] = useState<CompletedTabId>('recommendations');
  const isRunning = status === 'running' || status === 'loading';
  const headline = getInvestigationHeadline({ eventTitle, state, status });
  const goalText = getInvestigationGoalText(state);
  const conclusionBody = getConclusionBody(state?.conclusion);
  const recommendations = useMemo(() => parseInvestigationRecommendations(state), [state]);
  const blindSpots = useMemo(() => mapBlindSpots(state?.gaps_found), [state?.gaps_found]);
  const hypotheses = state?.hypotheses ?? [];
  const topHypothesisConfidence = useMemo(() => {
    const list = state?.hypotheses ?? [];
    return list.length > 0 ? Math.max(...list.map((hypothesis) => hypothesis.confidence)) : 0;
  }, [state?.hypotheses]);
  const timeLabel = getInvestigationTimeLabel({
    startedAt: investigation.started_at,
    endedAt: investigation.completed_at,
    isRunning,
    formatTimestamp,
  });

  const handleOpenInChat = useCallback(() => {
    if (!conversationId) {
      return;
    }
    agentBuilder?.openChat(buildInvestigationConversationChatOptions(conversationId));
  }, [agentBuilder, conversationId]);

  const investigationChatUnavailableLabel = i18n.translate(
    'xpack.observability.nightshift.flyout.openInChatInvestigationUnavailable',
    {
      defaultMessage: 'Investigation chat is still loading',
    }
  );

  const openInChatLabel = i18n.translate(
    'xpack.observability.nightshift.flyout.openInChatButtonLabel',
    {
      defaultMessage: 'Open in chat',
    }
  );

  const openBlindSpotInChat = useCallback(
    (blindSpot: { title: string; description: string }, index: number) => {
      agentBuilder?.openChat(
        buildBlindSpotChatOptions(blindSpot, `nightshift-flyout-blind-spot-${index}`)
      );
    },
    [agentBuilder]
  );

  const openRecommendationInChat = useCallback(
    (recommendation: InvestigationRecommendation, index: number) => {
      agentBuilder?.openChat(
        buildRecommendationChatOptions(recommendation, `nightshift-flyout-recommendation-${index}`)
      );
    },
    [agentBuilder]
  );

  const openHypothesisInChat = useCallback(
    (hypothesis: InvestigationState['hypotheses'][number], index: number) => {
      agentBuilder?.openChat(
        buildHypothesisChatOptions(hypothesis, `nightshift-flyout-hypothesis-${index}`)
      );
    },
    [agentBuilder]
  );

  const tabs = [
    {
      id: 'recommendations' as const,
      name: i18n.translate('xpack.observability.nightshift.investigation.recommendationsTab', {
        defaultMessage: 'Recommendations',
      }),
      count: recommendations.length,
    },
    {
      id: 'blindSpots' as const,
      name: i18n.translate('xpack.observability.nightshift.investigation.blindSpotsTab', {
        defaultMessage: 'Blind spots',
      }),
      count: blindSpots.length,
    },
    {
      id: 'hypotheses' as const,
      name: i18n.translate('xpack.observability.nightshift.investigation.hypothesesTab', {
        defaultMessage: 'Hypotheses',
      }),
      count: hypotheses.length,
    },
  ];

  return (
    <EuiFlyout
      onClose={onClose}
      size="s"
      session="inherit"
      type="push"
      hasAnimation={false}
      resizable
      data-test-subj="nightshiftInvestigationFlyout"
      aria-labelledby="nightshiftInvestigationFlyoutTitle"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2 id="nightshiftInvestigationFlyoutTitle">{headline}</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiBadgeGroup gutterSize="xs">
          <EuiBadge color="default" data-test-subj="nightshiftInvestigationFlyoutTypeBadge">
            {i18n.translate('xpack.observability.nightshift.investigation.flyoutBadge', {
              defaultMessage: 'Investigation',
            })}
          </EuiBadge>
          <InvestigationFlyoutBadge status={status} />
        </EuiBadgeGroup>
        <EuiSpacer size="s" />
        <EuiText size="xs" color="subdued" data-test-subj="nightshiftInvestigationFlyoutTimeLabel">
          {timeLabel}
        </EuiText>
      </EuiFlyoutHeader>

      <EuiFlyoutBody>
        {isRunning ? (
          <>
            <EuiTitle size="xs">
              <h3>
                {i18n.translate('xpack.observability.nightshift.investigation.goalTitle', {
                  defaultMessage: 'Goal',
                })}
              </h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <InvestigationFormattedText text={goalText ?? eventTitle} subdued />
            <EuiSpacer size="l" />
            <EuiTitle size="xs">
              <h3>
                {i18n.translate('xpack.observability.nightshift.investigation.hypothesesTitle', {
                  defaultMessage: 'Hypotheses',
                })}
              </h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiFlexGroup direction="column" gutterSize="s">
              {hypotheses.map((hypothesis, index) => (
                <EuiFlexItem key={hypothesis.candidate} grow={false}>
                  <InvestigationFlyoutListPanel>
                    <HypothesisRow
                      candidate={hypothesis.candidate}
                      confidence={hypothesis.confidence}
                      status={hypothesis.status}
                      reason={hypothesis.reason}
                      index={index}
                      isConfidenceWinner={hypothesis.confidence === topHypothesisConfidence}
                      onOpenInChat={() => openHypothesisInChat(hypothesis, index)}
                    />
                  </InvestigationFlyoutListPanel>
                </EuiFlexItem>
              ))}
            </EuiFlexGroup>
          </>
        ) : (
          <>
            <EuiTitle size="xs">
              <h3>
                {i18n.translate('xpack.observability.nightshift.investigation.conclusionTitle', {
                  defaultMessage: 'Conclusion',
                })}
              </h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            {conclusionBody ? (
              <TruncatableSummary
                summary={conclusionBody}
                testSubj="nightshiftInvestigationFlyoutConclusion"
              />
            ) : (
              <EuiText
                size="s"
                color="subdued"
                data-test-subj="nightshiftInvestigationFlyoutConclusion"
              >
                {eventTitle}
              </EuiText>
            )}
            <EuiSpacer size="l" />
            <EuiTabs data-test-subj="nightshiftInvestigationFlyoutTabs">
              {tabs.map((tab) => (
                <EuiTab
                  key={tab.id}
                  isSelected={selectedTab === tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  data-test-subj={`nightshiftInvestigationFlyoutTab-${tab.id}`}
                  append={
                    <EuiNotificationBadge color="subdued" aria-hidden={true}>
                      {tab.count}
                    </EuiNotificationBadge>
                  }
                >
                  {tab.name}
                </EuiTab>
              ))}
            </EuiTabs>
            <EuiSpacer size="m" />
            {selectedTab === 'recommendations' && (
              <EuiFlexGroup
                direction="column"
                gutterSize="s"
                data-test-subj="nightshiftInvestigationFlyoutRecommendations"
              >
                {recommendations.map((recommendation, index) => (
                  <EuiFlexItem key={`${recommendation.title}-${index}`} grow={false}>
                    <InvestigationFlyoutListPanel>
                      <RecommendationRow
                        recommendation={recommendation}
                        index={index}
                        onOpenInChat={() => openRecommendationInChat(recommendation, index)}
                      />
                    </InvestigationFlyoutListPanel>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            )}
            {selectedTab === 'blindSpots' && (
              <EuiFlexGroup
                direction="column"
                gutterSize="s"
                data-test-subj="nightshiftInvestigationFlyoutBlindSpots"
              >
                {blindSpots.map((item, index) => (
                  <EuiFlexItem key={`${item.title}-${index}`} grow={false}>
                    <InvestigationFlyoutListPanel>
                      <InvestigationFlyoutRow
                        testSubj={`nightshiftInvestigationFlyoutBlindSpot-${index}`}
                        action={
                          <InvestigationItemChatButton
                            tooltip={blindSpotChatTooltip}
                            testSubj={`nightshiftInvestigationFlyoutBlindSpotChatButton-${index}`}
                            onClick={() => openBlindSpotInChat(item, index)}
                          />
                        }
                      >
                        <InvestigationFormattedText text={formatBlindSpotMarkdown(item)} />
                      </InvestigationFlyoutRow>
                    </InvestigationFlyoutListPanel>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            )}
            {selectedTab === 'hypotheses' && (
              <EuiFlexGroup
                direction="column"
                gutterSize="s"
                data-test-subj="nightshiftInvestigationFlyoutHypotheses"
              >
                {hypotheses.map((hypothesis, index) => (
                  <EuiFlexItem key={hypothesis.candidate} grow={false}>
                    <InvestigationFlyoutListPanel>
                      <HypothesisRow
                        candidate={hypothesis.candidate}
                        confidence={hypothesis.confidence}
                        status={hypothesis.status}
                        reason={hypothesis.reason}
                        index={index}
                        isConfidenceWinner={hypothesis.confidence === topHypothesisConfidence}
                        onOpenInChat={() => openHypothesisInChat(hypothesis, index)}
                      />
                    </InvestigationFlyoutListPanel>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            )}
          </>
        )}

        {error && (
          <>
            <EuiSpacer size="m" />
            <EuiText size="s" color="danger" data-test-subj="nightshiftInvestigationFlyoutError">
              {error}
            </EuiText>
          </>
        )}
      </EuiFlyoutBody>

      {agentBuilder && (
        <EuiFlyoutFooter
          css={css`
            background: ${euiTheme.colors.backgroundBasePlain};
            border-top: ${euiTheme.border.thin};
          `}
        >
          <EuiFlexGroup justifyContent="flexEnd" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiToolTip content={conversationId ? undefined : investigationChatUnavailableLabel}>
                <span tabIndex={conversationId ? undefined : 0}>
                  <AiButton
                    variant="empty"
                    size="s"
                    iconType="productAgent"
                    iconSide="left"
                    data-test-subj="nightshiftInvestigationFlyoutChatButton"
                    disabled={!conversationId}
                    onClick={handleOpenInChat}
                  >
                    {openInChatLabel}
                  </AiButton>
                </span>
              </EuiToolTip>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      )}
    </EuiFlyout>
  );
}
