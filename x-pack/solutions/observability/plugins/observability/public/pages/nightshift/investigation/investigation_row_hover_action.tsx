/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import React from 'react';
import { useEuiTheme } from '@elastic/eui';
import {
  nightshiftBackgroundColorTransition,
  nightshiftOpacityTransition,
  nightshiftReducedMotionStyles,
} from '../common/nightshift_transition';

const investigationRowHoverActionOverlayClassName = 'nightshiftInvestigationRowHoverActionOverlay';

const createFadeOverlayBackground = (backgroundColor: string): string =>
  `linear-gradient(90deg, transparent 0%, ${backgroundColor} 40%, ${backgroundColor} 100%)`;

export interface InvestigationRowHoverActionProps {
  children: React.ReactNode;
  action?: React.ReactNode;
  overlayBackground?: string;
  hoverOverlayBackground?: string;
}

export function InvestigationRowHoverAction({
  children,
  action,
  overlayBackground,
  hoverOverlayBackground,
}: InvestigationRowHoverActionProps): React.ReactElement {
  const { euiTheme } = useEuiTheme();
  const baseOverlayBackground = overlayBackground ?? euiTheme.colors.backgroundBasePlain;
  const hoverOverlayBackgroundColor =
    hoverOverlayBackground ?? euiTheme.colors.backgroundBaseSubdued;

  return (
    <div
      css={css`
        min-width: 0;
        position: relative;
        width: 100%;

        &:hover
          .${investigationRowHoverActionOverlayClassName},
          &:focus-within
          .${investigationRowHoverActionOverlayClassName} {
          opacity: 1;
          pointer-events: auto;
          background: ${createFadeOverlayBackground(hoverOverlayBackgroundColor)};
        }
      `}
    >
      {children}
      {action && (
        <div
          className={investigationRowHoverActionOverlayClassName}
          css={css`
            align-items: center;
            background: ${createFadeOverlayBackground(baseOverlayBackground)};
            bottom: 0;
            display: flex;
            opacity: 0;
            padding-left: ${euiTheme.size.xl};
            pointer-events: none;
            position: absolute;
            right: 0;
            top: 0;
            transition: ${nightshiftOpacityTransition(euiTheme)},
              ${nightshiftBackgroundColorTransition(euiTheme)};

            @media (prefers-reduced-motion: reduce) {
              opacity: 1;
              pointer-events: auto;
            }

            ${nightshiftReducedMotionStyles}
          `}
        >
          {action}
        </div>
      )}
    </div>
  );
}
