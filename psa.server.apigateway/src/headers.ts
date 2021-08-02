/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as http from 'http';

export interface Headers {
  xFrameOptions: string;
  contentSecurityPolicy: string;
}

export class Header {
  public static addHeaders(res: http.ServerResponse, headers: Headers): void {
    if (headers.xFrameOptions !== '') {
      res.setHeader('X-Frame-Options', headers.xFrameOptions);
    }
    if (headers.contentSecurityPolicy !== '') {
      res.setHeader('Content-Security-Policy', headers.contentSecurityPolicy);
    }
  }
}
