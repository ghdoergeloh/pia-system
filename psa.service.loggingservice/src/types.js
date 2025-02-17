/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * General
 *
 * @typedef {{
 *     id: number,
 *     role: string,
 *     username: string,
 *     locale: string,
 *     app: string,
 *     iat: number,
 *     exp: number
 * }} DecodedToken
 */
/**
 * System logs
 *
 * @typedef {{
 *     requestedBy: string,
 *     requestedFor: string,
 *     type: string
 * }} SystemLogReq
 *
 * @typedef {{
 *     requestedBy: string,
 *     requestedFor: string,
 *     timestamp: Date,
 *     type: string
 * }} SystemLogRes
 *
 * @typedef {{
 *     requested_by: string,
 *     requested_for: string,
 *     timestamp: string,
 *     type: string
 * }} SystemLogDb
 *
 * @typedef {{
 *     fromTime: Date,
 *     toTime: Date,
 *     types: string[]
 * }} SystemLogFilter
 */
