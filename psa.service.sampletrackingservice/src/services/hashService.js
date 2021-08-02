/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const crypto = require('crypto');

const hashService = (function () {
  /**
   * Creates a MD5 hash from a string
   * @param string
   * @returns {string} hex value of the hash
   */
  function createMd5Hash(string) {
    return crypto.createHash('md5').update(string).digest('hex');
  }

  return {
    /**
     * @function
     * @description Creates a MD5 hash from a string
     * @memberof module:hashService
     */
    createMd5Hash: createMd5Hash,
  };
})();

module.exports = hashService;
