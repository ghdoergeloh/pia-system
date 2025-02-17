/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { createSandbox } from 'sinon';
import chai, { expect } from 'chai';

import { QuestionnaireInstancesService } from './questionnaireInstancesService';
import { addDays, addHours, startOfToday, subDays } from 'date-fns';
import { db } from '../db';
import { Questionnaire } from '../models/questionnaire';
import { Proband } from '../models/proband';
import { Answer } from '../models/answer';
import { Condition } from '../models/condition';
import sinonChai from 'sinon-chai';
import { zonedTimeToUtc } from 'date-fns-tz';
import { config } from '../config';

chai.use(sinonChai);

const sandbox = createSandbox();

/* eslint-disable @typescript-eslint/no-magic-numbers */
describe('questionnaireInstancesService', function () {
  afterEach(function () {
    sandbox.restore();
  });

  describe('checkAndUpdateQuestionnaireInstancesStatus', function () {
    it('should not activate qis if their date is in the future', async function () {
      const qInstances = [
        {
          id: 1,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: addDays(startOfToday(), 1),
          status: 'inactive',
        },
        {
          id: 2,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: addDays(startOfToday(), 2),
          status: 'inactive',
        },
      ];
      const dbStub = stubDb(qInstances);

      await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

      expect(dbStub.manyOrNone).to.have.callCount(1);
      expect(dbStub.many).to.have.callCount(0);
    });

    it('should activate all qis if all their dates are in the past or today', async function () {
      const qInstances = [
        {
          id: 1,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: subDays(startOfToday(), 1),
          status: 'inactive',
        },
        {
          id: 2,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: startOfToday(),
          status: 'inactive',
        },
      ];
      const dbStub = stubDb(qInstances);

      await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

      expect(dbStub.manyOrNone).to.have.callCount(1);
      expect(dbStub.many).to.have.callCount(1);
      expect(dbStub.many).to.have.been.calledWith(
        '2WHERE v.id = t.id RETURNING *'
      );
    });

    it('should activate only the qis whos dates are in the past or today', async function () {
      const qInstances = [
        {
          id: 1,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: subDays(startOfToday(), 1),
          status: 'inactive',
        },
        {
          id: 2,
          study_id: 1,
          questionnaire_id: 1,
          questionnaire_name: 'Testname',
          user_id: 'Testuser',
          date_of_issue: addDays(startOfToday(), 1),
          status: 'inactive',
        },
      ];
      const dbStub = stubDb(qInstances);

      await QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus();

      expect(dbStub.manyOrNone).to.have.callCount(1);
      expect(dbStub.many).to.have.callCount(1);
      expect(dbStub.many).to.have.been.calledWith(
        '1WHERE v.id = t.id RETURNING *'
      );
    });
  });

  describe('createQuestionnaireInstances', function () {
    it('should return correct questionnaire instances', function () {
      const date = subDays(startOfToday(), 1);
      const user: Proband = createUser('Testuser1', date);

      const questionnaire: Questionnaire = createQuestionnaire({
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 2,

        created_at: date,
        updated_at: date,
      });

      const res = QuestionnaireInstancesService.createQuestionnaireInstances(
        questionnaire,
        user,
        false
      );

      expect(res.length).to.equal(3);
      expect(res[0]?.study_id).to.equal('Study1');
      expect(res[0]?.questionnaire_id).to.equal(99999);
      expect(res[0]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[0]?.user_id).to.equal('Testuser1');
      expect(res[0]?.date_of_issue.toString()).to.equal(
        zonedTimeToUtc(
          addHours(addDays(date, 0), 8),
          config.timeZone
        ).toString()
      );
      expect(res[0]?.status).to.equal('active');

      expect(res[1]?.study_id).to.equal('Study1');
      expect(res[1]?.questionnaire_id).to.equal(99999);
      expect(res[1]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[1]?.user_id).to.equal('Testuser1');
      expect(res[1]?.date_of_issue.toString()).to.equal(
        zonedTimeToUtc(
          addHours(addDays(date, 1), 8),
          config.timeZone
        ).toString()
      );
      // the status of the second instance may change with the time that the test is executed

      expect(res[2]?.study_id).to.equal('Study1');
      expect(res[2]?.questionnaire_id).to.equal(99999);
      expect(res[2]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[2]?.user_id).to.equal('Testuser1');
      expect(res[2]?.date_of_issue.toString()).to.equal(
        zonedTimeToUtc(
          addHours(addDays(date, 2), 8),
          config.timeZone
        ).toString()
      );
      expect(res[2]?.status).to.equal('inactive');
    });

    it('should return correct questionnaire instances for one time questionnaire', function () {
      const date = subDays(startOfToday(), 1);
      const user: Proband = createUser('Testuser1', date);
      const questionnaire: Questionnaire = createQuestionnaire({
        no_questions: 2,
        cycle_amount: 0,
        cycle_unit: 'once',
        activate_after_days: 1,
        deactivate_after_days: 0,

        created_at: date,
        updated_at: date,
      });

      const res = QuestionnaireInstancesService.createQuestionnaireInstances(
        questionnaire,
        user,
        false
      );

      expect(res.length).to.equal(1);
      expect(res[0]?.study_id).to.equal('Study1');
      expect(res[0]?.questionnaire_id).to.equal(99999);
      expect(res[0]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[0]?.user_id).to.equal('Testuser1');
      expect(res[0]?.date_of_issue.toString()).to.equal(
        zonedTimeToUtc(
          addHours(addDays(date, 1), 8),
          config.timeZone
        ).toString()
      );
      expect(res[0]?.status).to.equal('active');
    });

    it('should be able to keep the time correct when timeZone changes to DST', function () {
      const date = new Date(Date.UTC(2021, 2, 27));
      const user: Proband = createUser('Testuser1', date);

      const questionnaire: Questionnaire = createQuestionnaire({
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 2,

        created_at: date,
        updated_at: date,
      });

      const res = QuestionnaireInstancesService.createQuestionnaireInstances(
        questionnaire,
        user,
        false
      );

      expect(res.length).to.equal(3);
      expect(res[0]?.study_id).to.equal('Study1');
      expect(res[0]?.questionnaire_id).to.equal(99999);
      expect(res[0]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[0]?.user_id).to.equal('Testuser1');
      expect(res[0]?.date_of_issue.toString()).to.equal(
        new Date(Date.UTC(2021, 2, 27, 7)).toString()
      );
      expect(res[0]?.status).to.equal('expired');

      expect(res[1]?.study_id).to.equal('Study1');
      expect(res[1]?.questionnaire_id).to.equal(99999);
      expect(res[1]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[1]?.user_id).to.equal('Testuser1');
      expect(res[1]?.date_of_issue.toString()).to.equal(
        new Date(Date.UTC(2021, 2, 28, 6)).toString()
      );
      expect(res[1]?.status).to.equal('expired');

      expect(res[2]?.study_id).to.equal('Study1');
      expect(res[2]?.questionnaire_id).to.equal(99999);
      expect(res[2]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[2]?.user_id).to.equal('Testuser1');
      expect(res[2]?.date_of_issue.toString()).to.equal(
        new Date(Date.UTC(2021, 2, 29, 6)).toString()
      );
      expect(res[2]?.status).to.equal('expired');
    });

    it('should be able to keep the time correct when timeZone changes from DST', function () {
      const date = new Date(Date.UTC(2020, 9, 24));
      const user: Proband = createUser('Testuser1', date);

      const questionnaire: Questionnaire = createQuestionnaire({
        cycle_amount: 1,
        cycle_unit: 'day',
        activate_after_days: 0,
        deactivate_after_days: 2,

        created_at: date,
        updated_at: date,
      });

      const res = QuestionnaireInstancesService.createQuestionnaireInstances(
        questionnaire,
        user,
        false
      );

      expect(res.length).to.equal(3);
      expect(res[0]?.study_id).to.equal('Study1');
      expect(res[0]?.questionnaire_id).to.equal(99999);
      expect(res[0]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[0]?.user_id).to.equal('Testuser1');
      expect(res[0]?.date_of_issue.toString()).to.equal(
        new Date(Date.UTC(2020, 9, 24, 6)).toString()
      );
      expect(res[0]?.status).to.equal('expired');

      expect(res[1]?.study_id).to.equal('Study1');
      expect(res[1]?.questionnaire_id).to.equal(99999);
      expect(res[1]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[1]?.user_id).to.equal('Testuser1');
      expect(res[1]?.date_of_issue.toString()).to.equal(
        new Date(Date.UTC(2020, 9, 25, 7)).toString()
      );
      expect(res[1]?.status).to.equal('expired');

      expect(res[2]?.study_id).to.equal('Study1');
      expect(res[2]?.questionnaire_id).to.equal(99999);
      expect(res[2]?.questionnaire_name).to.equal('TestQuestionnaire1');
      expect(res[2]?.user_id).to.equal('Testuser1');
      expect(res[2]?.date_of_issue.toString()).to.equal(
        new Date(Date.UTC(2020, 9, 26, 7)).toString()
      );
      expect(res[2]?.status).to.equal('expired');
    });
  });

  describe('isConditionMet', function () {
    it('1 answer value, 1 condition value, operand ===, no link, positive example', function () {
      const answer = createAnswer('Ja');
      const condition = createCondition({
        condition_value: 'Ja',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition value, operand ===, no link, negative example', function () {
      const answer = createAnswer('Ja');
      const condition = createCondition({
        condition_value: 'Nein',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 1 condition value, operand ===, no link, positive example', function () {
      const answer = createAnswer('ans1;ans2;ans3');
      const condition = createCondition({
        condition_value: 'ans2',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 1 condition value, operand ===, no link, negative example', function () {
      const answer = createAnswer('ans1;ans2;ans3');
      const condition = createCondition({
        condition_value: 'ans4',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, no link, positive example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ===, no link, negative example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans2;ans3;ans4',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, OR link, positive example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ===, OR link, negative example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans2;ans3;ans4',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, AND link, negative example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ===, XOR link, positive example', function () {
      const answer = createAnswer('ans1');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, no link, positive example', function () {
      const answer = createAnswer('ans2;ans4;ans5');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, no link, negative example', function () {
      const answer = createAnswer('ans4;ans5;ans6');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, OR link, positive example', function () {
      const answer = createAnswer('ans2;ans4;ans5');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, OR link, negative example', function () {
      const answer = createAnswer('ans4;ans5;ans6');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, AND link, positive example', function () {
      const answer = createAnswer('ans1;ans2;ans3');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, AND link, negative example', function () {
      const answer = createAnswer('ans1;ans2;ans4');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'AND',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, positive example', function () {
      const answer = createAnswer('ans0;ans2;ans5');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, negative example too many matches', function () {
      const answer = createAnswer('ans1;ans2;ans4');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, negative example no match', function () {
      const answer = createAnswer('ans4;ans5;ans6');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(false);
    });

    it('3 answer values, 3 condition values, operand ===, XOR link, positive example with ; at the end of values', function () {
      const answer = createAnswer('ans0;ans2;ans5;');
      const condition = createCondition({
        condition_value: 'ans1;ans2;ans3;',
        condition_operand: '==',
        condition_link: 'XOR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        1
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand ===, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '8',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand ===, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '12',
        condition_operand: '==',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand <, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '8',
        condition_operand: '<',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand <, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '22',
        condition_operand: '<',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand >, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '22',
        condition_operand: '>',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand >, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '8',
        condition_operand: '>',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand <=, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '8',
        condition_operand: '<=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand <=, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '12',
        condition_operand: '<=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand >=, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '13',
        condition_operand: '>=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand >=, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '12',
        condition_operand: '>=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 1 condition values, operand \\=, OR link, number, negative example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '12',
        condition_operand: '\\=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 1 condition values, operand \\=, OR link, number, positive example', function () {
      const answer = createAnswer('12');
      const condition = createCondition({
        condition_value: '11',
        condition_operand: '\\=',
        condition_link: 'OR',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        3
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand ==, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: addDays(startOfToday(), 1).toDateString(),
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand ==, date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '==',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand <, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '<',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand < date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: addDays(startOfToday(), 1).toDateString(),
        condition_operand: '<',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand >, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '>',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand > date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: subDays(startOfToday(), 1).toDateString(),
        condition_operand: '>',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand <=, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: subDays(startOfToday(), 1).toDateString(),
        condition_operand: '<=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand <= date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '<=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand >=, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: addDays(startOfToday(), 1).toDateString(),
        condition_operand: '>=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand >= date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '>=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });

    it('1 answer value, 3 condition values, operand \\=, date, negative example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: startOfToday().toDateString(),
        condition_operand: '\\=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(false);
    });

    it('1 answer value, 3 condition values, operand \\= date, positive example', function () {
      const answer = createAnswer(startOfToday().toDateString());
      const condition = createCondition({
        condition_value: addDays(startOfToday(), 1).toDateString(),
        condition_operand: '\\=',
      });

      const actual = QuestionnaireInstancesService.isConditionMet(
        answer,
        condition,
        5
      );

      expect(actual).to.equal(true);
    });
  });

  describe('isExpired', () => {
    it('should return false if questionnaire expiration date is not reached', () => {
      // Arrange
      const curDate = new Date();
      const dateOfIssue = subDays(new Date(), 15);
      const expires_after_days = 30;

      // Act
      const result = QuestionnaireInstancesService.isExpired(
        curDate,
        dateOfIssue,
        expires_after_days
      );

      expect(result).to.equal(false);
    });

    it('should return true if questionnaire expiration date is reached', () => {
      // Arrange
      const curDate = new Date();
      const dateOfIssue = subDays(new Date(), 31);
      const expires_after_days = 30;

      // Act
      const result = QuestionnaireInstancesService.isExpired(
        curDate,
        dateOfIssue,
        expires_after_days
      );

      expect(result).to.equal(true);
    });
  });

  function createUser(
    pseudonym: string,
    first_logged_in_at: Date | null
  ): Proband {
    return {
      pseudonym: pseudonym,
      first_logged_in_at: first_logged_in_at,
      compliance_labresults: true,
      compliance_samples: true,
      compliance_bloodsamples: true,
      needs_material: false,
      study_center: 'string',
      examination_wave: 1,
      is_test_proband: false,
      status: 'active',
      ids: null,
      study: 'TestStudy',
    };
  }

  function createQuestionnaire(
    questionnaire: Partial<Questionnaire>
  ): Questionnaire {
    return {
      id: 99999,
      study_id: 'Study1',
      name: 'TestQuestionnaire1',
      no_questions: 2,
      cycle_amount: 0,
      cycle_unit: 'once',
      activate_after_days: 1,
      deactivate_after_days: 0,
      notification_tries: 1,
      notification_title: 'string',
      notification_body_new: 'string',
      notification_body_in_progress: 'string',
      notification_weekday: 'sunday',
      notification_interval: 2,
      notification_interval_unit: 'days',
      activate_at_date: 'string',
      compliance_needed: false,
      expires_after_days: 14,
      finalises_after_days: 2,
      cycle_per_day: 1,
      cycle_first_hour: 1,
      created_at: new Date(),
      updated_at: new Date(),
      type: 'for_probands',
      version: 1,
      publish: 'string',
      notify_when_not_filled: false,
      notify_when_not_filled_time: '08:00',
      notify_when_not_filled_day: 3,
      keep_answers: false,
      active: true,
      ...questionnaire,
    };
  }

  function createAnswer(value: string): Answer {
    return {
      question_id: 1,
      questionnaire_instance_id: 2,
      answer_option_id: 3,
      value: value,
    };
  }

  function createCondition(conditionOverwrite: Partial<Condition>): Condition {
    return {
      condition_type: 'external',
      condition_answer_option_id: 1,
      condition_question_id: 1,
      condition_questionnaire_id: 1,
      condition_questionnaire_version: 1,
      condition_target_questionnaire: 1,
      condition_target_questionnaire_version: 1,
      condition_target_answer_option: 1,
      condition_target_question_pos: 1,
      condition_target_answer_option_pos: 1,
      condition_value: 'string',
      condition_operand: '==',
      condition_link: null,
      ...conditionOverwrite,
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  function stubDb<T>(returnValues: T[]) {
    const dbStub = {
      manyOrNone: sandbox.stub(db, 'manyOrNone').resolves(returnValues),
      many: sandbox.stub(db, 'many').resolves(),
      tx: sandbox
        .stub(db, 'tx')
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .callsFake((cb: (t: unknown) => void): void => cb(dbStub)),
      $config: {
        pgp: {
          helpers: sandbox.stub(db.$config.pgp.helpers).update.callsFake(
            // eslint-disable-next-line @typescript-eslint/ban-types
            (dummy1: object | object[]) =>
              Array.isArray(dummy1) ? dummy1.length : 0
          ),
        },
      },
    };
    return dbStub;
  }
});
