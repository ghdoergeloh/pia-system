/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const laboratoryResultsHandler = require('../handlers/laboratoryResultsHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/sample/labResults/{result_id}',
  method: 'GET',
  handler: laboratoryResultsHandler.getOneResultWitSampleID,
  options: {
    description: 'returns single laboratory result',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        result_id: Joi.string()
          .uppercase()
          .description('the id of the labresult')
          .required(),
      }).unknown(),
    },
  },
};
