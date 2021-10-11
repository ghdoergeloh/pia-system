/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const { UsersHandler } = require('../handlers/usersHandler');

module.exports = {
  path: '/user/users/{username}',
  method: 'GET',
  handler: UsersHandler.getOne,
  config: {
    description: 'get a user',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the username of the user')
          .required(),
      }).unknown(),
    },
  },
};
