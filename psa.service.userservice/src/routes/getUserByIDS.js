/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const { UsersHandler } = require('../handlers/usersHandler');

module.exports = {
  path: '/user/users/ids/{ids}',
  method: 'GET',
  handler: UsersHandler.getUserByIDS,
  config: {
    description: 'get a user by his ids',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        ids: Joi.string().description('the ids/uuid of the user').required(),
      }).unknown(),
    },
  },
};
