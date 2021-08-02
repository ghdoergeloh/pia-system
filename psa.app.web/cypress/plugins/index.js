/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const cypressTypeScriptPreprocessor = require('./cy-ts-preprocessor');
const cypressLogToOutput = require('cypress-log-to-output');
const { rmdir } = require('fs');

module.exports = (on) => {
  on('file:preprocessor', cypressTypeScriptPreprocessor);
  cypressLogToOutput.install(on);

  on('task', {
    deleteFolder(folderName) {
      return new Promise((resolve, reject) => {
        rmdir(folderName, { maxRetries: 10, recursive: true }, (err) => {
          if (err) {
            console.error(err);

            return reject(err);
          }

          resolve(null);
        });
      });
    },
  });
};
