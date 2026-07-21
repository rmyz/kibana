/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import React, { Fragment } from 'react';
import { EuiCode, useEuiFontSize, useEuiTheme } from '@elastic/eui';

export type SummaryInlineSegment =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string };

const INLINE_CODE_PATTERN = /`([^`]+)`/g;

export const parseSummaryInlineCode = (summary: string): SummaryInlineSegment[] => {
  const segments: SummaryInlineSegment[] = [];
  let lastIndex = 0;

  for (const match of summary.matchAll(INLINE_CODE_PATTERN)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      segments.push({ type: 'text', value: summary.slice(lastIndex, matchIndex) });
    }
    segments.push({ type: 'code', value: match[1] });
    lastIndex = matchIndex + match[0].length;
  }

  if (lastIndex < summary.length) {
    segments.push({ type: 'text', value: summary.slice(lastIndex) });
  }

  if (segments.length === 0) {
    segments.push({ type: 'text', value: summary });
  }

  return segments;
};

export function SummaryInlineCodeText({ text }: { text: string }): React.ReactElement {
  const { euiTheme } = useEuiTheme();
  const inlineCodeFontSize = useEuiFontSize('s');
  const segments = parseSummaryInlineCode(text);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <Fragment key={`text-${index}`}>{segment.value}</Fragment>;
        }

        return (
          <EuiCode
            key={`code-${index}-${segment.value}`}
            css={css`
              ${inlineCodeFontSize}
              font-weight: ${euiTheme.font.weight.regular};
              vertical-align: baseline;
              white-space: nowrap;
            `}
          >
            {segment.value}
          </EuiCode>
        );
      })}
    </>
  );
}
