/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Joi = require('joi');

const internalPersonalDataHandler = require('../../handlers/internal/internalPersonalDataHandler');

/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
/**
 * @type {import('@hapi/hapi').ServerRoute}
 */
module.exports = {
  path: '/personal/personalData/proband/{pseudonym}',
  method: 'PUT',
  handler: internalPersonalDataHandler.createOrUpdate,
  options: {
    description: 'updates or creates personal data for the given proband',
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the name of the user')
          .required()
          .default('Testproband1'),
      }).unknown(),
      payload: Joi.object({
        anrede: Joi.string().allow('', null).default(''),
        titel: Joi.string().allow('', null).default(''),
        name: Joi.string().allow('', null).default(''),
        vorname: Joi.string().allow('', null).default(''),
        strasse: Joi.string().allow('', null).default(''),
        haus_nr: Joi.string().allow('', null).default(''),
        plz: Joi.string()
          .regex(/^[0-9]*$/)
          .allow('', null)
          .default(''),
        landkreis: Joi.string().allow('', null).default(''),
        ort: Joi.string().allow('', null).default(''),
        telefon_privat: Joi.string().allow('', null).default(''),
        telefon_dienst: Joi.string().allow('', null).default(''),
        telefon_mobil: Joi.string().allow('', null).default(''),
        email: Joi.string().email().allow('', null).default(''),
        comment: Joi.string().allow('', null).default(''),
      }).unknown(),
    },
  },
};
