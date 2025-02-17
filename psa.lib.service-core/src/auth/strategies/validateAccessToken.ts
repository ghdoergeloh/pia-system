/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import pgPromise from 'pg-promise';
import {
  AccessToken,
  AuthToken,
  isAccessToken,
  TokenValidationFn,
  ValidationResult,
} from '../authModel';

/**
 * Factory for AccessToken validator function
 * @param db qPIA DB connection
 */
export function validateAccessToken(
  db?: pgPromise.IDatabase<unknown>
): TokenValidationFn<AccessToken> {
  if (!db) {
    console.warn(
      'validateAccessToken: ' +
        'AccessToken will be checked without database access. ' +
        'This is not allowed for services with qPIA DB access!'
    );
  }
  return async function (decoded: AuthToken): Promise<ValidationResult> {
    if (!isAccessToken(decoded)) {
      return { isValid: false };
    }
    if (!db) {
      return { isValid: true };
    }
    try {
      const result = await db.oneOrNone<unknown>(
        'SELECT username FROM accounts WHERE username=${username} AND role=${role}',
        {
          username: decoded.username,
          role: decoded.role,
        }
      );
      return { isValid: result !== null && result !== undefined };
    } catch (err) {
      console.log(err);
      return { isValid: false };
    }
  };
}
