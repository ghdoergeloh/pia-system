/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const schedule = require('node-schedule');

const { LabResultImportHelper } = require('./labResultImportHelper');

/**
 * @description helper methods to schedule recurring tasks
 */
const taskScheduleHelper = (function () {
  /**
   * @function
   * @description schedules the daily HL7 import
   * @memberof module:taskScheduleHelper
   */
  function scheduleDailyHL7Import() {
    // Once a day at 3 am
    const rule = new schedule.RecurrenceRule();
    rule.hour = 3;
    rule.minute = 0;

    return schedule.scheduleJob(rule, function () {
      void LabResultImportHelper.importHl7FromMhhSftp();
    });
  }

  /**
   * @function
   * @description schedules the daily CSV import
   * @memberof module:taskScheduleHelper
   */
  function scheduleDailyCsvImport() {
    // Once a day at 4 am
    const rule = new schedule.RecurrenceRule();
    rule.hour = 4;
    rule.minute = 0;

    return schedule.scheduleJob(rule, function () {
      void LabResultImportHelper.importCsvFromHziSftp();
    });
  }

  return {
    /**
     * @function
     * @description schedules the daily HL7 import
     * @memberof module:taskScheduleHelper
     */
    scheduleDailyHL7Import: scheduleDailyHL7Import,

    /**
     * @function
     * @description schedules the daily CSV import
     * @memberof module:taskScheduleHelper
     */
    scheduleDailyCsvImport: scheduleDailyCsvImport,
  };
})();

module.exports = taskScheduleHelper;
