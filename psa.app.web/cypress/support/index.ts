/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/// <reference types="cypress" />
// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

import {
  login,
  createProfessionalUser,
  createProband,
  createRandomProband,
  deleteProfessionalUser,
  deleteProband,
} from './user.commands';
import {
  createStudy,
  disableFourEyesOpposition,
  createRandomStudy,
} from './study.commands';
import { expectLocation } from './helper.commands';

declare global {
  namespace Cypress {
    interface Chainable {
      // user commands
      login: typeof login;
      createProfessionalUser: typeof createProfessionalUser;
      createProband: typeof createProband;
      createRandomProband: typeof createRandomProband;
      deleteProfessionalUser: typeof deleteProfessionalUser;
      deleteProband: typeof deleteProband;
      // study commands
      createStudy: typeof createStudy;
      createRandomStudy: typeof createRandomStudy;
      disableFourEyesOpposition: typeof disableFourEyesOpposition;
      // helper commands
      expectPathname: typeof expectLocation;
    }
  }
}

// user commands
Cypress.Commands.add('createProfessionalUser', createProfessionalUser);
Cypress.Commands.add('login', login);
Cypress.Commands.add('createProband', createProband);
Cypress.Commands.add('createRandomProband', createRandomProband);
Cypress.Commands.add('deleteProfessionalUser', deleteProfessionalUser);
Cypress.Commands.add('deleteProband', deleteProband);
// study commands
Cypress.Commands.add('createStudy', createStudy);
Cypress.Commands.add('createRandomStudy', createRandomStudy);
Cypress.Commands.add('disableFourEyesOpposition', disableFourEyesOpposition);
// helper commands
Cypress.Commands.add('expectPathname', expectLocation);
