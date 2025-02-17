/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import { sign } from 'jsonwebtoken';
import startOfToday from 'date-fns/startOfToday';
import { StatusCodes } from 'http-status-codes';
import fetchMocker from 'fetch-mock';

import secretOrPrivateKey from '../secretOrPrivateKey';
import { cleanup, setup } from './questionnaires.spec.data/setup.helper';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import {
  Questionnaire,
  QuestionnaireRequest,
  QuestionnaireResponse,
} from '../../src/models/questionnaire';
import { Question, QuestionRequest } from '../../src/models/question';
import {
  AnswerOption,
  AnswerOptionRequest,
} from '../../src/models/answerOption';
import { db } from '../../src/db';
import sinon from 'sinon';
import { HttpClient } from '@pia-system/lib-http-clients-internal';

chai.use(chaiHttp);

const apiAddress =
  'http://localhost:' + config.public.port.toString() + '/questionnaire';

const probandSession1 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband1',
  groups: ['ApiTestStudy1'],
};
const probandSession2 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband2',
  groups: ['ApiTestStudy2'],
};
const probandSession3 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband3',
  groups: ['ApiTestStudy1'],
};
const probandSession4 = {
  id: 1,
  role: 'Proband',
  username: 'QTestProband4',
  groups: ['ApiTestStudy3'],
};
const forscherSession1 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher1',
  groups: ['ApiTestStudy1', 'ApiTestStudy3'],
};
const forscherSession2 = {
  id: 1,
  role: 'Forscher',
  username: 'QTestForscher2',
  groups: ['ApiTestStudy2'],
};

const invalidToken = sign(probandSession1, 'thisIsNotAValidPrivateKey', {
  algorithm: 'HS256',
  expiresIn: '24h',
});
const probandToken1 = sign(probandSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken2 = sign(probandSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken3 = sign(probandSession3, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const probandToken4 = sign(probandSession4, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken1 = sign(forscherSession1, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const forscherToken2 = sign(forscherSession2, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});

const invalidHeader = { authorization: invalidToken };
const probandHeader1 = { authorization: probandToken1 };
const probandHeader2 = { authorization: probandToken2 };
const probandHeader3 = { authorization: probandToken3 };
const probandHeader4 = { authorization: probandToken4 };
const forscherHeader1 = { authorization: forscherToken1 };
const forscherHeader2 = { authorization: forscherToken2 };

const existingQuestionnaire2v1 = {
  id: 100200,
  version: 1,
  questionId1: 1002101,
  answerOptionId1_1: 1002111,
  answerOptionId1_2: 1002121,
};

const existingQuestionnaire2v2 = {
  id: 100200,
  version: 2,
  questionId1: 1002102,
  answerOptionId1_1: 1002112,
  answerOptionId1_2: 1002122,
};

const existingQuestionnaire4 = {
  study: 'ApiTestStudy1',
  id: 100400,
  version: 1,
  questionId1: 1004101,
  answerOptionId1_1: 1004111,
  answerOptionId1_2: 1004121,
  questionId2: 1004201,
  answerOptionId2_1: 1004211,
};

const existingQuestionnaire5 = {
  id: 100500,
  version: 1,
  questionId1: 1005101,
};

const conditionSourceQuestionnaire = {
  id: 200200,
  version: 1,
};

const sandbox = sinon.createSandbox();
const fetchMock = fetchMocker.sandbox();

describe('/questionnaires', function () {
  before(async () => {
    await Server.init();
  });

  after(async () => {
    await Server.stop();
  });

  beforeEach(async () => {
    await setup();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    sandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
  });

  afterEach(async () => {
    await cleanup();

    sandbox.restore();
    fetchMock.restore();
  });

  describe('POST /questionnaire/questionnaires', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(invalidHeader)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(probandHeader1)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 400 if the questionnaire is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(getMissingFieldQuestionnaire());
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 400 if the questionnaire has wrong value in field', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(getWrongNotificationQuestionnaire());
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 403 if the study_id is invalid', async function () {
      const wrongStudyQuestionnaire = getValidQuestionnaire1();
      wrongStudyQuestionnaire.study_id = 'noValidStudy';
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(wrongStudyQuestionnaire);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if the user has no write access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader2)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the posted questionnaire if the request is valid', async function () {
      const questionnaireRequest = getValidQuestionnaire1();
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(questionnaireRequest);
      expect(result).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        questionnaireRequest,
        result.body
      );

      expect(result.body.id).to.not.be.oneOf([undefined, null]);
      expect(result.body.version).to.equal(1);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' +
          String(result.body.id) +
          '/' +
          String(result.body.version)
      );
    });

    it('should return HTTP 200 with the posted questionnaire and conditions if the request is valid', async function () {
      const questionnaireRequest = getValidQuestionnaire2();
      const conditionTarget = {
        questionnaireId: 100200,
        answerOptionId: 1002111,
      };
      questionnaireRequest.condition = {
        condition_type: 'external',
        condition_target_questionnaire: conditionTarget.questionnaireId,
        condition_target_answer_option: conditionTarget.answerOptionId,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      // If you do changes here, please have a look if these conditions are correct
      // I think, internal conditions should not reference an external answer option
      questionnaireRequest.questions[0].condition = {
        condition_type: 'internal_last',
        condition_target_questionnaire: conditionTarget.questionnaireId,
        condition_target_answer_option: conditionTarget.answerOptionId,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      questionnaireRequest.questions[0].answer_options[0].condition = {
        condition_type: 'internal_this',
        condition_target_questionnaire: conditionTarget.questionnaireId,
        condition_target_answer_option: conditionTarget.answerOptionId,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(questionnaireRequest);
      expect(result, result.text).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        questionnaireRequest,
        result.body
      );
      expect(result.body.id).to.not.be.oneOf([undefined, null]);
      expect(result.body.condition.condition_target_questionnaire).to.equal(
        conditionTarget.questionnaireId
      );
      expect(
        result.body.condition.condition_target_questionnaire_version
      ).to.equal(1);
      expect(result.body.condition.condition_questionnaire_id).to.equal(
        result.body.id
      );
      expect(result.body.condition.condition_question_id).to.equal(null);
      expect(result.body.condition.condition_answer_option_id).to.equal(null);
      expect(result.body.condition.error).to.equal(undefined);
      expect(result.body.compliance_needed).to.be.false;
      expect(result.body.keep_answers).to.be.false;

      expect(result.body.questions[0].condition).to.not.equal(undefined);
      expect(
        result.body.questions[0].condition.condition_target_questionnaire
      ).to.equal(result.body.id);
      expect(
        result.body.questions[0].condition.condition_target_answer_option
      ).to.equal(conditionTarget.answerOptionId);
      expect(
        result.body.questions[0].condition.condition_questionnaire_id
      ).to.equal(null);
      expect(result.body.questions[0].condition.condition_question_id).to.equal(
        result.body.questions[0].id
      );
      expect(
        result.body.questions[0].condition.condition_answer_option_id
      ).to.equal(null);
      expect(result.body.questions[0].condition.error).to.equal(undefined);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_target_questionnaire
      ).to.equal(result.body.id);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_target_answer_option
      ).to.equal(conditionTarget.answerOptionId);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_questionnaire_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_question_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_answer_option_id
      ).to.equal(result.body.questions[0].answer_options[0].id);
      expect(
        result.body.questions[0].answer_options[0].condition.error
      ).to.equal(undefined);
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?2'
      );
      expect(result.body.questions[0].answer_options[1].text).to.equal(
        'Kopfschmerzen?2'
      );
      expect(result.body.questions[1].answer_options.length).to.equal(1);
      expect(result.body.questions[1].answer_options[0].values.length).to.equal(
        4
      );
      expect(
        result.body.questions[1].answer_options[0].values_code.length
      ).to.equal(4);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + String(result.body.id) + '/1'
      );
    });

    it('should return HTTP 200 with the imported questionnaire and conditions if the request is valid', async function () {
      const conditionTarget = {
        questionnaireId: 100200,
        answerOptionId: 1002111,
      };

      const questionnaireImported = getQuestionnaireImported();
      questionnaireImported.condition = {
        condition_type: 'external',
        condition_target_questionnaire: 838383838,
        condition_target_answer_option: conditionTarget.answerOptionId,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      questionnaireImported.questions[0].condition = {
        condition_type: 'external',
        condition_target_questionnaire: conditionTarget.questionnaireId,
        condition_target_answer_option: 7474747474,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      questionnaireImported.questions[0].answer_options[0].condition = {
        condition_type: 'internal_this',
        condition_target_question_pos: 1,
        condition_target_answer_option_pos: 2,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(questionnaireImported);
      expect(result).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        questionnaireImported,
        result.body
      );

      expect(result.body.id).to.not.equal(undefined);
      expect(result.body.id).to.not.equal(null);
      expect(result.body.name).to.equal('Testfragebogenname5');
      expect(result.body.condition).to.not.equal(undefined);
      expect(result.body.condition.error).to.equal(StatusCodes.NOT_FOUND);
      expect(result.body.compliance_needed).to.equal(false);
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].condition).to.not.equal(undefined);
      expect(result.body.questions[0].condition.error).to.equal(
        StatusCodes.NOT_FOUND
      );
      expect(result.body.questions[0].is_mandatory).to.be.true;
      expect(result.body.questions[1].is_mandatory).to.be.true;
      expect(result.body.questions[0].text).to.equal(
        'Welche Symptome haben Sie?2'
      );
      expect(result.body.questions[1].text).to.equal('Wie geht es Ihnen?2');
      expect(result.body.questions[0].answer_options.length).to.equal(2);
      expect(result.body.questions[0].answer_options[0].condition).to.not.equal(
        undefined
      );
      expect(
        result.body.questions[0].answer_options[0].condition.error
      ).to.equal(undefined);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_target_questionnaire
      ).to.equal(result.body.id);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_target_answer_option
      ).to.equal(result.body.questions[0].answer_options[1].id);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_questionnaire_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_question_id
      ).to.equal(null);
      expect(
        result.body.questions[0].answer_options[0].condition
          .condition_answer_option_id
      ).to.equal(result.body.questions[0].answer_options[0].id);
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?2'
      );
      expect(result.body.questions[0].answer_options[1].text).to.equal(
        'Kopfschmerzen?2'
      );
      expect(result.body.questions[1].answer_options.length).to.equal(1);
      expect(result.body.questions[1].answer_options[0].values.length).to.equal(
        4
      );
      expect(
        result.body.questions[1].answer_options[0].values_code.length
      ).to.equal(4);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + String(result.body.id) + '/1'
      );
    });

    it('should return HTTP 200 with the posted questionnaire if the questionnaire has no answer options', async function () {
      const questionnaireRequest = getValidQuestionnaireEmptyQuestion();
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(questionnaireRequest);
      expect(result).to.have.status(StatusCodes.OK);
      checkIfResponseMatchesRequestQuestionnaire(
        questionnaireRequest,
        result.body
      );
      expect(result.body.id).to.not.equal(undefined);
      expect(result.body.id).to.not.equal(null);
      expect(result.body.name).to.equal('Testfragebogenname3');
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].text).to.equal('Dies ist ein Info Text1');
      expect(result.body.questions[1].text).to.equal('Dies ist ein Info Text2');
      expect(result.body.questions[0].is_mandatory).to.be.false;
      expect(result.body.questions[1].is_mandatory).to.be.false;
      expect(result.body.questions[0].answer_options.length).to.equal(0);
      expect(result.body.questions[1].answer_options.length).to.equal(0);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + String(result.body.id) + '/1'
      );
    });

    it('should return HTTP 200 with the posted questionnaire of cycle_unit =  spontan', async function () {
      const questionnaireRequest = getValidQuestionnaireSpontan();
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(questionnaireRequest);
      checkIfResponseMatchesRequestQuestionnaire(
        questionnaireRequest,
        result.body
      );
      expect(result, result.text).to.have.status(StatusCodes.OK);
      expect(result.body.id).to.not.equal(undefined);
      expect(result.body.id).to.not.equal(null);
      expect(result.body.name).to.equal('Testfragebogenname4');
      expect(result.body.cycle_unit).to.equal('spontan');
      expect(result.body.publish).to.equal('allaudiences');
      expect(result.body.expires_after_days).to.equal(5);
      expect(result.body.questions.length).to.equal(2);
      expect(result.body.questions[0].text).to.equal(
        'Welche Symptome haben Sie?1'
      );
      expect(result.body.questions[1].text).to.equal('Wie geht es Ihnen?1');
      expect(result.body.questions[0].is_mandatory).to.be.true;
      expect(result.body.questions[1].is_mandatory).to.be.true;
      expect(result.body.questions[0].answer_options.length).to.equal(2);
      expect(result.body.questions[0].answer_options[0].text).to.equal(
        'Fieber?1'
      );
      expect(result.body.questions[0].answer_options[1].text).to.equal(
        'Kopfschmerzen?1'
      );
      expect(result.body.questions[1].answer_options.length).to.equal(1);
      expect(result.body.questions[1].answer_options[0].values.length).to.equal(
        4
      );
      expect(
        result.body.questions[1].answer_options[0].values_code.length
      ).to.equal(4);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' + String(result.body.id) + '/1'
      );
    });
    it('should return HTTP 200 with the posted questionnaire if the questionnaire answer options answer_type_id = 9(date_time)', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/questionnaires')
        .set(forscherHeader1)
        .send(getValidQuestionnaireEmptyQuestion());
      expect(result).to.have.status(StatusCodes.OK);
    });
  });

  describe('POST /questionnaire/revisequestionnaire/{id}', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/100100')
        .set(invalidHeader)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/100100')
        .set(probandHeader1)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 400 if the questionnaire is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/100100')
        .set(forscherHeader1)
        .send(getMissingFieldQuestionnaire());
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 403 if the study_id is invalid', async function () {
      const wrongStudyQuestionnaire = getValidQuestionnaire1();
      wrongStudyQuestionnaire.study_id = 'noValidStudy';
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/100100')
        .set(forscherHeader1)
        .send(wrongStudyQuestionnaire);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if the user has no write access to old study', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/100100')
        .set(forscherHeader2)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the questionnaire id is wrong and it cannot be found', async function () {
      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/99999999')
        .set(forscherHeader1)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 with the new version of questionnaire if the request is valid, copy questions and answer_options and do not modify old version of questionnaire', async function () {
      const questionnaireRequest = getValidQuestionnaire1();

      questionnaireRequest.questions = [questionnaireRequest.questions[0]];
      questionnaireRequest.questions[0].answer_options = [
        questionnaireRequest.questions[0].answer_options[0],
        questionnaireRequest.questions[0].answer_options[1],
      ];
      questionnaireRequest.cycle_amount = 5;
      questionnaireRequest.keep_answers = true;
      delete questionnaireRequest.condition;

      const result = await chai
        .request(apiAddress)
        .post('/revisequestionnaire/' + existingQuestionnaire4.id.toString())
        .set(forscherHeader1)
        .send(questionnaireRequest);
      expect(result).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        questionnaireRequest,
        result.body
      );

      expect(result.body.id).to.equal(existingQuestionnaire4.id);
      expect(result.body.version).to.equal(2);
      expect(result.body.cycle_amount).to.equal(5);
      expect(result.body.keep_answers).to.be.true;
      expect(result.body.cycle_per_day).to.equal(2);
      expect(result.body.cycle_first_hour).to.equal(6);
      expect(result.body.questions[0].id).to.not.equal(
        existingQuestionnaire4.questionId1
      );
      expect(result.body.questions[0].answer_options[0].id).to.not.equal(
        existingQuestionnaire4.answerOptionId1_1
      );

      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' +
          String(result.body.id) +
          '/' +
          String(result.body.version)
      );

      const result2 = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(probandHeader1);

      const existingQuestionnaireRequest = getExistingQuestionnaire4();

      checkIfResponseMatchesRequestQuestionnaire(
        existingQuestionnaireRequest,
        result2.body
      );

      expect(result2.body.id).to.equal(existingQuestionnaire4.id);
      expect(result2.body.version).to.equal(1);
      expect(result2.body.questions[0].id).to.equal(
        existingQuestionnaire4.questionId1
      );
      expect(result2.body.questions[0].answer_options[0].id).to.equal(
        existingQuestionnaire4.answerOptionId1_1
      );
    });
  });

  describe('PUT /questionnaire/questionnaires/{id}/{version}', () => {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(invalidHeader)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(probandHeader1)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 400 if the questionnaire is invalid', async function () {
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1)
        .send(getMissingFieldQuestionnaire());
      expect(result).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should return HTTP 403 if the study_id is invalid', async function () {
      const wrongStudyQuestionnaire = getValidQuestionnaire1();
      wrongStudyQuestionnaire.study_id = 'noValidStudy';
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1)
        .send(wrongStudyQuestionnaire);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if the user has no write access to old study', async function () {
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader2)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 404 if the questionnaire id is wrong and it cannot be found', async function () {
      const result = await chai
        .request(apiAddress)
        .put('/questionnaires/99999999/1')
        .set(forscherHeader1)
        .send(getValidQuestionnaire1());
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 412 if the condition has invalid answer_option_id', async function () {
      const wrongConditionQuestionnaire = getValidQuestionnaire2();
      wrongConditionQuestionnaire.condition = {
        condition_type: 'external',
        condition_target_questionnaire: existingQuestionnaire4.id,
        condition_target_answer_option: 9999999,
        condition_operand: '==',
        condition_value: 'Ja',
      };
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1)
        .send(wrongConditionQuestionnaire);
      expect(result).to.have.status(412);
    });

    it('should return HTTP 200 with the changed questionnaire and condition if the request is valid and update is_condition_target of target answer option', async () => {
      const changedConditionQuestionnaire = getExistingQuestionnaire4();
      changedConditionQuestionnaire.condition = {
        condition_type: 'external',
        condition_target_questionnaire: existingQuestionnaire2v2.id,
        condition_target_questionnaire_version:
          existingQuestionnaire2v2.version,
        condition_target_answer_option:
          existingQuestionnaire2v2.answerOptionId1_1,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      changedConditionQuestionnaire.questions[0].answer_options[1].condition = {
        condition_type: 'internal_this',
        condition_target_questionnaire: existingQuestionnaire4.id,
        condition_target_questionnaire_version: existingQuestionnaire4.version,
        condition_target_answer_option:
          existingQuestionnaire4.answerOptionId1_1,
        condition_operand: '==',
        condition_value: 'Ja',
      };

      changedConditionQuestionnaire.name = 'Testfragebogenname2Geändert';
      changedConditionQuestionnaire.compliance_needed = true;
      changedConditionQuestionnaire.keep_answers = true;
      changedConditionQuestionnaire.questions[0].label = 'q1changed';
      changedConditionQuestionnaire.questions[0].answer_options[0].text =
        'Fieber?2Geändert';
      changedConditionQuestionnaire.questions[0].answer_options[0].label =
        'ao1changed';
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1)
        .send(changedConditionQuestionnaire);
      expect(result, result.text).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        changedConditionQuestionnaire,
        result.body
      );

      expect(result.body.id).to.equal(existingQuestionnaire4.id);
      expect(result.body.version).to.equal(existingQuestionnaire4.version);
      expect(result.body.cycle_per_day).to.be.null;
      expect(result.body.cycle_first_hour).to.be.null;

      expect(result.body.questions[0].condition).to.be.undefined;
      expect(result.body.questions[0].answer_options[0].condition).to.be
        .undefined;

      const ao2Condition = result.body.questions[0].answer_options[1].condition;
      expect(ao2Condition.condition_questionnaire_id).to.be.null;
      expect(ao2Condition.condition_question_id).to.be.null;
      expect(ao2Condition.condition_answer_option_id).to.equal(
        result.body.questions[0].answer_options[1].id
      );
      expect(
        ao2Condition.condition_target_answer_option,
        JSON.stringify(ao2Condition)
      ).to.equal(result.body.questions[0].answer_options[0].id);

      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' +
          existingQuestionnaire4.id.toString() +
          '/' +
          existingQuestionnaire4.version.toString()
      );

      mockHasAgreedToCompliance('QTestProband1', 'ApiTestStudy1');

      const result2 = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(probandHeader1);
      expect(result2).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        changedConditionQuestionnaire,
        result2.body
      );

      expect(result2.body.questions[0].answer_options[0].is_condition_target).to
        .be.true;
      expect(result2.body.questions[0].answer_options[1].is_condition_target).to
        .be.false;
    });

    it('should return HTTP 200, delete the question and delete the condition of secondary questionnaire', async function () {
      const result0 = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire5.id.toString() +
            '/' +
            existingQuestionnaire5.version.toString()
        )
        .set(probandHeader1);
      expect(result0).to.have.status(StatusCodes.OK);
      expect((result0.body as QuestionnaireResponse).condition).to.not.equal(
        null
      );

      const questionnaireRequest = getExistingQuestionnaire4();
      questionnaireRequest.questions.pop();

      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1)
        .send(questionnaireRequest);
      expect(result).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        questionnaireRequest,
        result.body
      );

      const result2 = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1);
      expect(result2).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        questionnaireRequest,
        result2.body
      );

      expect(result2.body.version).to.equal(1);

      const result3 = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire5.id.toString() +
            '/' +
            existingQuestionnaire5.version.toString()
        )
        .set(probandHeader1);
      expect(result3).to.have.status(StatusCodes.OK);
      expect((result3.body as QuestionnaireResponse).condition).to.equal(null);
    });

    it('should return HTTP 200 with the changed questionnaire with empty questions', async function () {
      const changedQuestionnaire = getValidQuestionnaireEmptyQuestion();
      changedQuestionnaire.questions.pop();
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1)
        .send(changedQuestionnaire);
      expect(result).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        changedQuestionnaire,
        result.body
      );
    });

    it('should return HTTP 200 and update version 2 of questionnaire without changing version 1', async function () {
      const changedQuestionnaire = getExistingQuestionnaire2v2();
      changedQuestionnaire.name = 'TestfragebogenVersion2';
      changedQuestionnaire.cycle_amount = 2;
      changedQuestionnaire.cycle_unit = 'month';
      changedQuestionnaire.questions = [
        {
          text: 'Version2 question',
          position: 1,
          is_mandatory: false,
          label: 'v2 question',
          answer_options: [
            {
              answer_type_id: 2,
              values: [
                { value: 'Nein' },
                { value: 'Ja' },
                { value: 'Keine Angabe' },
              ],
              values_code: [{ value: 1 }, { value: 2 }, { value: 0 }],
              position: 1,
              label: 'v2 ao',
            },
          ],
        },
      ];

      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            existingQuestionnaire2v2.id.toString() +
            '/' +
            existingQuestionnaire2v2.version.toString()
        )
        .set(forscherHeader1)
        .send(changedQuestionnaire);
      expect(result).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        changedQuestionnaire,
        result.body
      );

      expect(result.body.id).to.equal(existingQuestionnaire2v2.id);
      expect(result.body.version).to.equal(existingQuestionnaire2v2.version);
      expect(result.body.questions[0].id).to.not.equal(
        existingQuestionnaire2v1.questionId1
      );
      expect(result.body.questions[0].questionnaire_version).to.equal(2);
      expect(result.body.questions[0].answer_options[0].id).to.not.equal(
        existingQuestionnaire2v1.answerOptionId1_1
      );

      const result2 = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire2v1.id.toString() +
            '/' +
            existingQuestionnaire2v1.version.toString()
        )
        .set(forscherHeader1);
      const unchangedVerion1 = getExistingQuestionnaire2v1();
      expect(result2).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        unchangedVerion1,
        result2.body
      );

      expect(result2.body.id).to.equal(existingQuestionnaire2v1.id);
      expect(result2.body.version).to.equal(existingQuestionnaire2v1.version);
    });

    it('should return HTTP 200 with the unchanged questionnaire if update is the same as existing', async function () {
      const unchangedQuestionnaire = getConditionSourceQuestionnaire();
      const result = await chai
        .request(apiAddress)
        .put(
          '/questionnaires/' +
            conditionSourceQuestionnaire.id.toString() +
            '/' +
            conditionSourceQuestionnaire.version.toString()
        )
        .set(forscherHeader2)
        .send(unchangedQuestionnaire);
      expect(result, result.text).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        unchangedQuestionnaire,
        result.body
      );
      expect(result.body.id).to.equal(conditionSourceQuestionnaire.id);
      expect(result.body.version).to.equal(
        conditionSourceQuestionnaire.version
      );
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' +
          conditionSourceQuestionnaire.id.toString() +
          '/' +
          conditionSourceQuestionnaire.version.toString()
      );
    });
  });

  describe('GET /questionnaire/questionnaires', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires')
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if a proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires')
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the correct questionnaires for Forscher', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires')
        .set(forscherHeader1);

      expect(result).to.have.status(StatusCodes.OK);
      const questionnairesResponse = result.body as {
        questionnaires: Questionnaire[];
        links: {
          self: {
            href: string;
          };
        };
      };
      expect(questionnairesResponse.questionnaires.length).to.equal(6);
      questionnairesResponse.questionnaires.forEach((q) => {
        expect(q.study_id).to.equal('ApiTestStudy1');
      });
      expect(questionnairesResponse.links.self.href).to.equal(
        '/questionnaires'
      );
    });
  });

  describe('GET /questionnaire/questionnaires/{id}/{version}', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 404 if the questionnaire id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/999999/1')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 404 if the version of questionnaire does not exist', async function () {
      const result = await chai
        .request(apiAddress)
        .get('/questionnaires/' + existingQuestionnaire4.id.toString() + '/99')
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 if the user has no read access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(probandHeader4);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if proband tries to get questionnaire he did not comply to get', async function () {
      mockHasAgreedToCompliance('QTestProband3', 'ApiTestStudy1', false);

      const result = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire2v2.id.toString() +
            '/' +
            existingQuestionnaire2v2.version.toString()
        )
        .set(probandHeader3);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 with the correct questionnaire and version 1', async function () {
      mockHasAgreedToCompliance('QTestProband1', 'ApiTestStudy1');

      const result = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire2v1.id.toString() +
            '/' +
            existingQuestionnaire2v1.version.toString()
        )
        .set(probandHeader1);
      expect(result, result.text).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        getExistingQuestionnaire2v1(),
        result.body
      );

      expect(result.body.id).to.equal(existingQuestionnaire2v1.id);
      expect(result.body.version).to.equal(existingQuestionnaire2v1.version);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' +
          existingQuestionnaire2v1.id.toString() +
          '/' +
          existingQuestionnaire2v1.version.toString()
      );
    });

    it('should return HTTP 200 with the correct questionnaire and version 2', async function () {
      mockHasAgreedToCompliance('QTestProband1', 'ApiTestStudy1');

      const result = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire2v2.id.toString() +
            '/' +
            existingQuestionnaire2v2.version.toString()
        )
        .set(probandHeader1);
      expect(result, result.text).to.have.status(StatusCodes.OK);

      checkIfResponseMatchesRequestQuestionnaire(
        getExistingQuestionnaire2v2(),
        result.body
      );

      expect(result.body.id).to.equal(existingQuestionnaire2v2.id);
      expect(result.body.version).to.equal(existingQuestionnaire2v2.version);
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' +
          existingQuestionnaire2v2.id.toString() +
          '/' +
          existingQuestionnaire2v2.version.toString()
      );
    });

    it('should return HTTP 200 with the correct questionnaire and conditions', async function () {
      const result = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            conditionSourceQuestionnaire.id.toString() +
            '/' +
            conditionSourceQuestionnaire.version.toString()
        )
        .set(probandHeader2);
      expect(result).to.have.status(StatusCodes.OK);
      console.log(JSON.stringify(result.body, null, 2));
      checkIfResponseMatchesRequestQuestionnaire(
        getConditionSourceQuestionnaire(),
        result.body
      );
      expect(result.body.id).to.equal(conditionSourceQuestionnaire.id);
      expect(result.body.version).to.equal(
        conditionSourceQuestionnaire.version
      );
      expect(result.body.links.self.href).to.equal(
        '/questionnaires/' +
          conditionSourceQuestionnaire.id.toString() +
          '/' +
          conditionSourceQuestionnaire.version.toString()
      );
    });

    it('should return HTTP 200 with the correct questionnaire with empty question', async function () {
      const result = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire5.id.toString() +
            '/' +
            existingQuestionnaire5.version.toString()
        )
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.OK);
      const questionnaireResponse = result.body as QuestionnaireResponse;
      expect(questionnaireResponse.name).to.equal('ApiTestQuestionnaire5');
      expect(questionnaireResponse.questions.length).to.equal(1);
      expect(questionnaireResponse.questions[0].answer_options.length).to.equal(
        0
      );
      expect(questionnaireResponse.links.self.href).to.equal(
        '/questionnaires/' +
          existingQuestionnaire5.id.toString() +
          '/' +
          existingQuestionnaire5.version.toString()
      );
    });
  });

  describe('DELETE /questionnaire/questionnaires/{id}/{version}', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(invalidHeader);
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 404 if the questionnaire id is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/questionnaires/999999/1')
        .set(forscherHeader1);
      expect(result).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(probandHeader1);
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 403 if the user has no write access to study', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader2)
        .send({});
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should return HTTP 200 and delete the questionnaire 4 and not get it again', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1);
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);

      const result2 = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1);
      expect(result2, result2.text).to.have.status(StatusCodes.NOT_FOUND);
    });

    it('should return HTTP 200 and delete the questionnaire 5', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            existingQuestionnaire5.id.toString() +
            '/' +
            existingQuestionnaire5.version.toString()
        )
        .set(forscherHeader1);
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should return HTTP 200 and delete the questionnaire 2 version 2', async function () {
      const result = await chai
        .request(apiAddress)
        .delete(
          '/questionnaires/' +
            existingQuestionnaire2v2.id.toString() +
            '/' +
            existingQuestionnaire2v2.version.toString()
        )
        .set(forscherHeader1);
      expect(result, result.text).to.have.status(StatusCodes.NO_CONTENT);
    });

    it('should return HTTP 200 and delete the questionnaire with conditions', async function () {
      const result = await chai
        .request(apiAddress)
        .get(
          '/questionnaires/' +
            conditionSourceQuestionnaire.id.toString() +
            '/' +
            conditionSourceQuestionnaire.version.toString()
        )
        .set(forscherHeader2);
      expect(result, result.text).to.have.status(StatusCodes.OK);
    });

    it('should delete a questionnaire and return HTTP 200', async function () {
      const result = await chai
        .request(apiAddress)
        .delete('/questionnaires/100300/1')
        .set(forscherHeader1);
      const resultFromDatabse = await db.manyOrNone(
        'SELECT id FROM user_files WHERE id=999999'
      );
      expect(result).to.have.status(StatusCodes.NO_CONTENT);
      expect(resultFromDatabse).to.be.empty;
    });
  });

  describe('PATCH /questionnaire/{study}/questionnaires/{id}/{version}', function () {
    it('should return HTTP 401 if the token is wrong', async function () {
      const result = await chai
        .request(apiAddress)
        .patch(
          '/' +
            existingQuestionnaire4.study +
            '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(invalidHeader)
        .send({ active: false });
      expect(result).to.have.status(StatusCodes.UNAUTHORIZED);
    });

    it('should return HTTP 403 if a Proband tries', async function () {
      const result = await chai
        .request(apiAddress)
        .patch(
          '/' +
            existingQuestionnaire4.study +
            '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(probandHeader1)
        .send({ active: false });
      expect(result).to.have.status(StatusCodes.FORBIDDEN);
    });

    it('should deactivate a questionnaire, return HTTP 200 and the changed questionnaire', async function () {
      const result = await chai
        .request(apiAddress)
        .patch(
          '/' +
            existingQuestionnaire4.study +
            '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1)
        .send({ active: false });

      expect(result).to.have.status(StatusCodes.OK);
      checkIfResponseMatchesRequestQuestionnaire(
        getExistingQuestionnaire4(),
        result.body
      );

      expect(result.body.active).to.be.false;
    });

    it('should (currently) not be possible to reactivate a questionnaire', async function () {
      const result = await chai
        .request(apiAddress)
        .patch(
          '/' +
            existingQuestionnaire4.study +
            '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(forscherHeader1)
        .send({ active: false });

      expect(result).to.have.status(StatusCodes.OK);

      const result2 = await chai
        .request(apiAddress)
        .patch(
          '/' +
            existingQuestionnaire4.study +
            '/questionnaires/' +
            existingQuestionnaire4.id.toString() +
            '/' +
            existingQuestionnaire4.version.toString()
        )
        .set(probandHeader1)
        .send({ active: true });
      expect(result2).to.have.status(StatusCodes.BAD_REQUEST);
    });

    it('should deactivate a questionnaire, return HTTP 200 delete all active, inactive or in_progress questionnaire instances but keep answered', async function () {
      const result = await chai
        .request(apiAddress)
        .patch('/ApiTestStudy1/questionnaires/100300/1')
        .set(forscherHeader1)
        .send({ active: false });

      expect(result).to.have.status(StatusCodes.OK);

      const resultFromDatabse = await db.manyOrNone(
        'SELECT id FROM questionnaire_instances WHERE questionnaire_id=100300'
      );
      expect(resultFromDatabse).to.deep.equal([{ id: 140300 }]);
    });
  });

  function mockHasAgreedToCompliance(
    pseudonym: string,
    study: string,
    hasCompliance = true
  ): void {
    fetchMock.get(
      `http://complianceservice:5000/compliance/${study}/agree/${pseudonym}?system=samples`,
      {
        status: StatusCodes.OK,
        body: hasCompliance.toString(),
      }
    );
  }
});

function checkIfResponseMatchesRequestQuestionnaire(
  questionnaireRequest: QuestionnaireRequest,
  questionnaireResponseInput: unknown | undefined
): asserts questionnaireResponseInput is QuestionnaireResponse {
  const questionnaireResponse =
    questionnaireResponseInput as QuestionnaireResponse;
  const { activate_at_date, questions, condition, ...expected } = {
    ...questionnaireRequest,
  };
  if (activate_at_date) {
    (expected as { activate_at_date?: string }).activate_at_date = new Date(
      activate_at_date
    ).toISOString();
  }
  expect(
    questionnaireResponse,
    JSON.stringify(questionnaireResponse, null, 2)
  ).to.deep.include(expected);
  if (condition !== undefined) {
    if (condition.condition_type !== 'external') {
      delete condition.condition_target_questionnaire;
    }
    expect(
      questionnaireResponse.condition,
      JSON.stringify(questionnaireResponse, null, 2)
    ).to.deep.include(condition);
    // expect(
    //   questionnaireResponse.condition.condition_questionnaire_id,
    //   JSON.stringify(questionnaireResponse.condition)
    // ).to.equal(questionnaireResponse.id);
  } else {
    expect(
      questionnaireResponse.condition,
      JSON.stringify(questionnaireResponse, null, 2)
    ).to.be.oneOf([null, undefined]);
  }
  expect(
    questionnaireResponse.questions.length,
    JSON.stringify(questionnaireResponse, null, 2)
  ).to.equal(questions.length);
  questions.forEach((question) =>
    checkIfResponseMatchesRequestQuestion(
      question,
      questionnaireResponse.questions
    )
  );
}

function checkIfResponseMatchesRequestQuestion(
  questionRequest: QuestionRequest,
  questionsResposeInput: unknown | undefined
): asserts questionsResposeInput is Question[] {
  const questionsRespose = questionsResposeInput as Question[];
  const { answer_options, condition, ...expected } = {
    ...questionRequest,
  };
  const foundQuestion = questionsRespose.find(
    (q) => q.position === questionRequest.position
  );
  expect(foundQuestion, JSON.stringify(foundQuestion, null, 2)).to.deep.include(
    expected
  );
  if (condition !== undefined) {
    if (condition.condition_type !== 'external') {
      delete condition.condition_target_questionnaire;
    }
    expect(
      foundQuestion.condition,
      JSON.stringify(foundQuestion, null, 2)
    ).to.deep.include(condition);
    // expect(foundQuestion.condition.condition_question_id).to.equal(
    //   foundQuestion.id
    // );
  } else {
    expect(
      foundQuestion.condition,
      JSON.stringify(foundQuestion, null, 2)
    ).to.be.oneOf([null, undefined]);
  }
  expect(
    foundQuestion.answer_options.length,
    JSON.stringify(foundQuestion, null, 2)
  ).to.equal(answer_options.length);
  answer_options.forEach((ao) =>
    checkIfResponseMatchesRequestAnswerOption(ao, foundQuestion.answer_options)
  );
}

function checkIfResponseMatchesRequestAnswerOption(
  answerOptionRequest: AnswerOptionRequest,
  answerOptionsResponse?: AnswerOption[]
): void {
  const {
    values,
    values_code,
    restriction_max,
    restriction_min,
    condition,
    ...aoCopy
  } = {
    ...answerOptionRequest,
  };
  const expected = aoCopy as {
    values?: string[];
    values_code?: number[];
    restriction_max?: string;
    restriction_min?: string;
  };
  if (Array.isArray(values)) {
    expect(answerOptionRequest.values.length).to.equal(values.length);
    expected.values = values.map((v) => v.value);
  }
  if (Array.isArray(values_code)) {
    expect(answerOptionRequest.values_code.length).to.equal(values_code.length);
    expected.values_code = values_code.map((vc) => vc.value);
  }
  if (typeof restriction_max === 'number') {
    expected.restriction_max = String(restriction_max);
  }
  if (typeof restriction_min === 'number') {
    expected.restriction_min = String(restriction_min);
  }
  const foundAnswerOption = answerOptionsResponse.find(
    (ao) => ao.position === answerOptionRequest.position
  );
  expect(
    foundAnswerOption,
    JSON.stringify(foundAnswerOption, null, 2)
  ).to.deep.include(expected);
  if (condition !== undefined) {
    delete condition.condition_target_question_pos;
    delete condition.condition_target_answer_option_pos;
    if (condition.condition_type !== 'external') {
      delete condition.condition_target_questionnaire;
    }
    expect(
      foundAnswerOption.condition,
      JSON.stringify(foundAnswerOption, null, 2)
    ).to.deep.include(condition);
    expect(
      foundAnswerOption.condition.condition_answer_option_id,
      JSON.stringify(foundAnswerOption, null, 2)
    ).to.equal(foundAnswerOption.id);
  } else {
    expect(
      foundAnswerOption.condition,
      JSON.stringify(foundAnswerOption, null, 2)
    ).to.be.oneOf([null, undefined]);
  }
}

function getExistingQuestionnaire2v1(): QuestionnaireRequest {
  return {
    study_id: 'ApiTestStudy1',
    name: 'ApiTestQuestionnaire2v1',
    type: 'for_probands',
    cycle_amount: 1,
    cycle_unit: 'week',
    publish: 'allaudiences',
    keep_answers: false,
    activate_after_days: 1,
    deactivate_after_days: 365,
    notification_tries: 3,
    notification_title: 'PIA Fragebogen',
    notification_body_new: 'NeuNachricht',
    notification_body_in_progress: 'AltNachricht',
    notify_when_not_filled: false,
    compliance_needed: true,
    expires_after_days: 5,
    finalises_after_days: 2,
    questions: [
      {
        id: 1002101,
        text: 'Haben Sie Fieber?',
        position: 1,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            id: 1002111,
            text: '',
            answer_type_id: 1,
            values: [
              { value: 'Ja' },
              { value: 'Nein' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 1,
            label: '',
            is_notable: [],
          },
        ],
      },
      {
        id: 1002201,
        text: 'Wie fühlen Sie sich?',
        position: 2,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            id: 1002211,
            text: 'Kopf?',
            answer_type_id: 2,
            values: [
              { value: 'Schlecht' },
              { value: 'Mittel' },
              { value: 'Gut' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 1,
            label: '',
            is_notable: [],
          },
          {
            id: 1002221,
            text: 'Bauch?',
            answer_type_id: 2,
            values: [
              { value: 'Schlecht' },
              { value: 'Mittel' },
              { value: 'Gut' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 2,
            label: '',
            is_notable: [],
          },
          {
            id: 1002231,
            text: 'Sample id einscannen',
            answer_type_id: 6,
            values: [],
            values_code: null,
            position: 3,
            label: '',
            is_notable: [],
          },
          {
            id: 1002241,
            text: 'Bitte laden sie das Bild hoch',
            answer_type_id: 8,
            values: [],
            values_code: null,
            position: 4,
            label: '',
            is_notable: [],
          },
          {
            id: 1002251,
            text: 'Bitte laden sie das zweite Bild hoch',
            answer_type_id: 8,
            values: [],
            values_code: null,
            position: 5,
            label: '',
            is_notable: [],
          },
          {
            id: 1002261,
            text: 'Bitte laden sie das dritte Bild hoch',
            answer_type_id: 8,
            values: [],
            values_code: null,
            position: 6,
            label: '',
            is_notable: [],
          },
          {
            id: 1002271,
            text: 'Bitte laden sie das vierte Bild hoch',
            answer_type_id: 8,
            values: [],
            values_code: null,
            position: 7,
            label: '',
            is_notable: [],
          },
        ],
      },
    ],
  };
}

function getExistingQuestionnaire2v2(): QuestionnaireRequest {
  const questionnaire = getExistingQuestionnaire2v1();
  questionnaire.name = 'ApiTestQuestionnaire2v2';
  questionnaire.questions.forEach((q) => {
    q.id++;
    q.answer_options.forEach((a) => {
      a.id++;
    });
  });
  return questionnaire;
}

function getExistingQuestionnaire4(): QuestionnaireRequest {
  return {
    study_id: 'ApiTestStudy1',
    name: 'ApiTestQuestionnaire4',
    type: 'for_probands',
    cycle_amount: 1,
    cycle_unit: 'week',
    publish: 'allaudiences',
    keep_answers: false,
    activate_after_days: 1,
    deactivate_after_days: 365,
    notification_tries: 3,
    notification_title: 'PIA Fragebogen',
    notification_body_new: 'NeuNachricht',
    notification_body_in_progress: 'AltNachricht',
    notify_when_not_filled: false,
    compliance_needed: false,
    expires_after_days: 5,
    finalises_after_days: 2,
    questions: [
      {
        id: 1004101,
        text: 'Wie fühlen Sie sich?',
        position: 1,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            id: 1004111,
            text: '',
            answer_type_id: 1,
            values: [
              { value: 'Ja' },
              { value: 'Nein' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 1,
            label: '',
            is_notable: [],
          },
          {
            id: 1004121,
            text: 'Kopf?',
            answer_type_id: 2,
            values: [
              { value: 'Schlecht' },
              { value: 'Mittel' },
              { value: 'Gut' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 2,
            label: '',
            is_notable: [],
          },
        ],
      },
      {
        id: 1004201,
        text: 'Haben Sie Fieber?',
        position: 2,
        is_mandatory: true,
        label: '',
        condition: {
          condition_type: 'external',
          condition_value: 'Ja',
          condition_target_answer_option: 1002112,
          condition_target_questionnaire: 100200,
          condition_operand: '==',
          condition_link: 'OR',
        },
        answer_options: [
          {
            id: 1004211,
            text: '',
            answer_type_id: 1,
            values: [
              { value: 'Ja' },
              { value: 'Nein' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 1,
            label: '',
            is_notable: [],
          },
        ],
      },
    ],
  };
}

function getConditionSourceQuestionnaire(): QuestionnaireRequest {
  return {
    study_id: 'ApiTestStudy2',
    name: 'ApiTestConditionSourceQuestionnaire',
    cycle_amount: 1,
    cycle_unit: 'week',
    activate_after_days: 1,
    deactivate_after_days: 365,
    notification_tries: 3,
    notification_title: 'PIA Fragebogen',
    notification_body_new: 'NeuNachrichtSource',
    notification_body_in_progress: 'AltNachrichtSource',
    notification_weekday: null,
    notification_interval: null,
    notification_interval_unit: null,
    compliance_needed: false,
    expires_after_days: 5,
    finalises_after_days: 2,
    type: 'for_probands',
    publish: 'allaudiences',
    notify_when_not_filled: false,
    notify_when_not_filled_time: null,
    notify_when_not_filled_day: null,
    cycle_per_day: null,
    cycle_first_hour: null,
    keep_answers: false,
    condition: {
      condition_type: 'external',
      condition_operand: '==',
      condition_value: 'Ja;Nein;',
      condition_target_answer_option: 2001111,
      condition_target_questionnaire: 200100,
      condition_link: 'OR',
      condition_target_questionnaire_version: 1,
    },
    questions: [
      {
        id: 2002101,
        text: 'Bedingung auf Ja',
        position: 1,
        is_mandatory: true,
        label: '',
        condition: {
          condition_type: 'external',
          condition_operand: '==',
          condition_value: 'Ja;Nein;',
          condition_target_answer_option: 2001111,
          condition_target_questionnaire: 200100,
          condition_link: 'OR',
          condition_target_questionnaire_version: 1,
        },
        answer_options: [
          {
            id: 2002111,
            text: '',
            answer_type_id: 1,
            is_notable: [],
            values: [
              { value: 'Ja' },
              { value: 'Nein' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 1,
            label: '',
          },
          {
            id: 2002121,
            text: '',
            answer_type_id: 1,
            is_notable: [],
            values: [
              { value: 'Ja' },
              { value: 'Nein' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 2,
            label: '',
            condition: {
              condition_type: 'internal_this',
              condition_operand: '\\=',
              condition_value: 'Ja',
              condition_target_answer_option: 2002111,
              condition_target_questionnaire: 200200,
              condition_link: 'OR',
              condition_target_questionnaire_version: 1,
            },
          },
        ],
      },
      {
        id: 2002201,
        text: 'Bedingung auf Nein',
        position: 2,
        is_mandatory: true,
        label: '',
        condition: {
          condition_type: 'internal_last',
          condition_operand: '\\=',
          condition_value: 'Ja',
          condition_target_answer_option: 2001111,
          condition_target_questionnaire: 200100,
          condition_link: 'AND',
          condition_target_questionnaire_version: 1,
        },
        answer_options: [
          {
            id: 2002211,
            text: '',
            answer_type_id: 1,
            is_notable: [],
            values: [
              { value: 'Ja' },
              { value: 'Nein' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 1,
            label: '',
            condition: {
              condition_type: 'internal_this',
              condition_operand: '==',
              condition_value: 'Ja',
              condition_target_answer_option: 2002111,
              condition_target_questionnaire: 200200,
              condition_link: 'OR',
              condition_target_questionnaire_version: 1,
            },
          },
          {
            id: 2002221,
            text: '',
            answer_type_id: 1,
            is_notable: [],
            values: [
              { value: 'Ja' },
              { value: 'Nein' },
              { value: 'Keine Angabe' },
            ],
            values_code: null,
            position: 2,
            label: '',
          },
        ],
      },
      {
        id: 2002301,
        text: 'Frage ohne Unterfrage',
        position: 3,
        is_mandatory: false,
        label: '',
        answer_options: [],
      },
    ],
  };
}

function getMissingFieldQuestionnaire(): Partial<QuestionnaireRequest> {
  return {
    study_id: 'ApiTestStudy1',
    name: 'Testfragebogenname',
    activate_after_days: 1,
    deactivate_after_days: 365,
    notification_tries: 3,
    notification_title: 'PIA Fragebogen',
    notification_body_new: 'Sie haben einen neuen Fragebogen',
    notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
    notification_weekday: 'monday',
    notification_interval: 1,
    notification_interval_unit: 'days',
    questions: [
      {
        text: 'Welche Symptome haben Sie?',
        position: 1,
        answer_options: [
          {
            text: 'Fieber?',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            values_code: [{ value: 1 }, { value: 0 }],
          },
          {
            text: 'Kopfschmerzen?',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            values_code: [{ value: 1 }, { value: 0 }],
          },
        ],
      },
      {
        text: 'Wie geht es Ihnen?',
        position: 2,
        answer_options: [
          {
            answer_type_id: 2,
            values: [
              { value: 'Schlecht' },
              { value: 'Normal' },
              { value: 'Gut' },
              { value: 'Keine Angabe' },
            ],
            values_code: [
              { value: 1 },
              { value: 2 },
              { value: 3 },
              { value: 0 },
            ],
          },
        ],
      },
    ],
  } as unknown as Partial<QuestionnaireRequest>;
}

function getValidQuestionnaire1(): QuestionnaireRequest {
  return {
    study_id: 'ApiTestStudy1',
    name: 'Testfragebogenname1',
    type: 'for_probands',
    cycle_amount: 7,
    cycle_unit: 'hour',
    cycle_per_day: 2,
    cycle_first_hour: 6,
    publish: 'allaudiences',
    keep_answers: false,
    activate_after_days: 1,
    deactivate_after_days: 365,
    notification_tries: 3,
    notification_title: 'PIA Fragebogen',
    notification_body_new: 'Sie haben einen neuen Fragebogen',
    notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
    notification_weekday: 'monday',
    notification_interval: 1,
    notification_interval_unit: 'days',
    activate_at_date: startOfToday(),
    compliance_needed: true,
    expires_after_days: 5,
    questions: [
      {
        text: 'Welche Symptome haben Sie?1',
        position: 1,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            text: 'Fieber?1',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            values_code: null,
            position: 1,
            label: 'ao1',
            is_notable: [],
          },
          {
            text: 'Kopfschmerzen?1',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            position: 2,
            label: 'ao2',
            is_notable: [],
          },
          {
            text: 'Seit wann haben Sie Fieber?2',
            answer_type_id: 5,
            values: [],
            values_code: [],
            restriction_min: -7,
            restriction_max: 7,
            is_decimal: false,
            position: 3,
            label: 'ao3',
            is_notable: [],
          },
          {
            text: 'Wie fühlen Sie sich?2',
            answer_type_id: 3,
            values: [],
            values_code: [],
            restriction_min: 0,
            restriction_max: 100,
            is_decimal: false,
            position: 4,
            label: 'ao4',
            is_notable: [],
          },
        ],
      },
      {
        text: 'Wie geht es Ihnen?1',
        position: 2,
        is_mandatory: true,
        label: 'q1',
        answer_options: [
          {
            answer_type_id: 2,
            values: [
              { value: 'Schlecht' },
              { value: 'Normal' },
              { value: 'Gut' },
              { value: 'Keine Angabe' },
            ],
            values_code: [
              { value: 1 },
              { value: 2 },
              { value: 3 },
              { value: 0 },
            ],
            position: 1,
            label: 'ao1',
            is_notable: [],
          },
        ],
      },
    ],
  };
}

function getValidQuestionnaire2(): QuestionnaireRequest {
  return {
    study_id: 'ApiTestStudy1',
    name: 'Testfragebogenname2',
    type: 'for_research_team',
    cycle_amount: 1,
    cycle_unit: 'once',
    publish: 'allaudiences',
    keep_answers: false,
    activate_after_days: 0,
    deactivate_after_days: 365,
    notification_tries: 0,
    notification_title: '',
    notification_body_new: '',
    notification_body_in_progress: '',
    notification_weekday: '',
    notification_interval: 0,
    notification_interval_unit: '',
    expires_after_days: 5,
    questions: [
      {
        text: 'Welche Symptome haben Sie?2',
        position: 1,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            text: 'Fieber?2',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            values_code: [{ value: 1 }, { value: 0 }],
            position: 1,
            label: '',
            is_notable: [],
          },
          {
            text: 'Kopfschmerzen?2',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            values_code: [{ value: 1 }, { value: 0 }],
            position: 2,
            label: '',
            is_notable: [],
          },
        ],
      },
      {
        text: 'Wie geht es Ihnen?2',
        position: 2,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            answer_type_id: 2,
            values: [
              { value: 'Schlecht' },
              { value: 'Normal' },
              { value: 'Gut' },
              { value: 'Keine Angabe' },
            ],
            values_code: [
              { value: 1 },
              { value: 2 },
              { value: 3 },
              { value: 0 },
            ],
            position: 1,
            label: '',
            is_notable: [],
          },
        ],
      },
    ],
  };
}

function getQuestionnaireImported(): QuestionnaireRequest {
  return {
    study_id: 'ApiTestStudy1',
    name: 'Testfragebogenname5',
    type: 'for_probands',
    cycle_amount: 1,
    cycle_unit: 'week',
    publish: 'allaudiences',
    activate_after_days: 1,
    deactivate_after_days: 365,
    notification_tries: 3,
    notification_title: 'PIA Fragebogen',
    notification_body_new: 'Sie haben einen neuen Fragebogen',
    notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
    notification_weekday: 'monday',
    notification_interval: 1,
    notification_interval_unit: 'days',
    expires_after_days: 5,
    questions: [
      {
        text: 'Welche Symptome haben Sie?2',
        position: 1,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            text: 'Fieber?2',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            values_code: [{ value: 1 }, { value: 0 }],
            position: 1,
            label: '',
            is_notable: [],
          },
          {
            text: 'Kopfschmerzen?2',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            values_code: [{ value: 1 }, { value: 0 }],
            position: 2,
            label: '',
            is_notable: [],
          },
        ],
      },
      {
        text: 'Wie geht es Ihnen?2',
        position: 2,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            answer_type_id: 2,
            values: [
              { value: 'Schlecht' },
              { value: 'Normal' },
              { value: 'Gut' },
              { value: 'Keine Angabe' },
            ],
            values_code: [
              { value: 1 },
              { value: 2 },
              { value: 3 },
              { value: 0 },
            ],
            position: 1,
            label: '',
            is_notable: [],
          },
        ],
      },
    ],
  };
}

function getValidQuestionnaireEmptyQuestion(): QuestionnaireRequest {
  return {
    study_id: 'ApiTestStudy1',
    name: 'Testfragebogenname3',
    type: 'for_probands',
    cycle_amount: 1,
    cycle_unit: 'week',
    publish: 'allaudiences',
    activate_after_days: 1,
    deactivate_after_days: 365,
    notification_tries: 3,
    notification_title: 'PIA Fragebogen',
    notification_body_new: 'Sie haben einen neuen Fragebogen',
    notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
    notification_weekday: 'monday',
    notification_interval: 1,
    notification_interval_unit: 'hours',
    expires_after_days: 5,
    questions: [
      {
        text: 'Dies ist ein Info Text1',
        position: 1,
        is_mandatory: false,
        label: '',
        answer_options: [],
      },
      {
        text: 'Dies ist ein Info Text2',
        position: 2,
        is_mandatory: false,
        label: '',
        answer_options: [],
      },
    ],
  };
}

function getWrongNotificationQuestionnaire(): QuestionnaireRequest {
  return {
    study_id: 'ApiTestStudy1',
    name: 'Testfragebogenname3',
    type: 'for_probands',
    cycle_amount: 1,
    cycle_unit: 'week',
    publish: 'allaudiences',
    activate_after_days: 1,
    deactivate_after_days: 365,
    notification_tries: 3,
    notification_title: 'PIA Fragebogen',
    notification_body_new: 'Sie haben einen neuen Fragebogen',
    notification_body_in_progress: 'Sie haben einen unvollständigen Fragebogen',
    notification_weekday: 'notaweekday',
    notification_interval: 1,
    notification_interval_unit: 'hours',
    expires_after_days: 5,
    questions: [
      {
        text: 'Dies ist ein Info Text1',
        position: 1,
        is_mandatory: false,
        label: '',
        answer_options: [],
      },
      {
        text: 'Dies ist ein Info Text2',
        position: 2,
        is_mandatory: false,
        label: '',
        answer_options: [],
      },
    ],
  };
}

function getValidQuestionnaireSpontan(): QuestionnaireRequest {
  return {
    study_id: 'ApiTestStudy1',
    name: 'Testfragebogenname4',
    type: 'for_probands',
    cycle_amount: 0,
    cycle_unit: 'spontan',
    publish: 'allaudiences',
    activate_after_days: 0,
    deactivate_after_days: 0,
    notification_tries: 0,
    notification_title: '',
    notification_body_new: '',
    notification_body_in_progress: '',
    notification_weekday: '',
    notification_interval: 0,
    notification_interval_unit: '',
    questions: [
      {
        text: 'Welche Symptome haben Sie?1',
        position: 1,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            text: 'Fieber?1',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            values_code: null,
            position: 1,
            label: '',
          },
          {
            text: 'Kopfschmerzen?1',
            answer_type_id: 1,
            values: [{ value: 'Ja' }, { value: 'Nein' }],
            position: 2,
            label: '',
          },
        ],
      },
      {
        text: 'Wie geht es Ihnen?1',
        position: 2,
        is_mandatory: true,
        label: '',
        answer_options: [
          {
            answer_type_id: 2,
            values: [
              { value: 'Schlecht' },
              { value: 'Normal' },
              { value: 'Gut' },
              { value: 'Keine Angabe' },
            ],
            values_code: [
              { value: 1 },
              { value: 2 },
              { value: 3 },
              { value: 0 },
            ],
            position: 1,
            label: '',
            is_notable: [],
          },
        ],
      },
    ],
  };
}
