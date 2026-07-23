/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { css } from '@emotion/react';
import React from 'react';
import { EuiMarkdownFormat, useEuiTheme } from '@elastic/eui';

export function InvestigationFormattedText({
  text,
  subdued = false,
  bold = false,
  textSize = 's',
  fontSize,
}: {
  text: string;
  subdued?: boolean;
  bold?: boolean;
  textSize?: 's' | 'xs';
  fontSize?: string;
}): React.ReactElement {
  const { euiTheme } = useEuiTheme();

  return (
    <div
      css={css`
        ${fontSize
          ? `
              font-size: ${fontSize};
              line-height: 1.5;

              .euiMarkdownFormat,
              .euiMarkdownFormat p,
              .euiMarkdownFormat span,
              .euiMarkdownFormat code,
              .euiMarkdownFormat li {
                font-size: inherit;
                line-height: inherit;
              }
            `
          : ''}
        ${bold
          ? `
              font-weight: ${euiTheme.font.weight.bold};

              p,
              span,
              code {
                font-weight: ${euiTheme.font.weight.bold};
              }
            `
          : ''}
      `}
    >
      <EuiMarkdownFormat
        textSize={fontSize ? 'relative' : textSize}
        color={subdued ? 'subdued' : undefined}
      >
        {text}
      </EuiMarkdownFormat>
    </div>
  );
}
