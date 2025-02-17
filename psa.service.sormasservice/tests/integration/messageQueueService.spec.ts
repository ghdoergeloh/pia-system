/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { expect } from 'chai';
import { createSandbox } from 'sinon';
import { StatusCodes } from 'http-status-codes';
import { HttpClient } from '@pia-system/lib-http-clients-internal';
import fetchMocker from 'fetch-mock';
import { getRepository } from 'typeorm';
import {
  MessageQueueClient,
  MessageQueueTestUtils,
  Producer,
} from '@pia/lib-messagequeue';
import { Server } from '../../src/server';
import { config } from '../../src/config';
import { TaskScheduler } from '../../src/services/taskScheduler';
import { messageQueueService } from '../../src/services/messageQueueService';
import { SymptomTransmission } from '../../src/entities/symptomTransmission';
import { FollowUp } from '../../src/entities/followUp';
import {
  MessagePayloadComplianceCreated,
  MessagePayloadProbandDeleted,
} from '../../src/models/messagePayloads';

describe('message queue service', function () {
  const fetchMock = fetchMocker.sandbox();
  const suiteSandbox = createSandbox();
  const testSandbox = createSandbox();
  const mqc = new MessageQueueClient(config.servers.messageQueue);

  before(async function () {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    suiteSandbox.stub(HttpClient, 'fetch').callsFake(fetchMock);
    suiteSandbox.stub(TaskScheduler, 'init');
    suiteSandbox.stub(TaskScheduler, 'stop');
    await mqc.connect(true);
    await Server.init();
  });

  after(async function () {
    await Server.stop();
    await mqc.disconnect();
    suiteSandbox.restore();
  });

  beforeEach(() => {
    fetchMock
      .catch(StatusCodes.SERVICE_UNAVAILABLE)
      .get('express:/sormas-rest/visits-external/version', StatusCodes.OK);
  });

  afterEach(() => {
    fetchMock.restore();
    testSandbox.restore();
  });

  describe('onComplianceCreated', () => {
    let producer: Producer<MessagePayloadComplianceCreated>;
    let processedComplianceCreated: Promise<void>;

    beforeEach(async () => {
      processedComplianceCreated =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          messageQueueService,
          'compliance.created',
          testSandbox
        );

      producer = await mqc.createProducer('compliance.created');

      fetchMock
        .get('express:/user/users/test-pseudonym/ids', 'test-ids')
        .post('express:/sormas-rest/visits-external/person/:uuid/status', {
          body: JSON.stringify(true),
          status: StatusCodes.OK,
        });
    });

    it('should send ACCEPTED status to sormas on compliance.created', async () => {
      // Arrange
      // Act
      await producer.publish({
        pseudonym: 'test-pseudonym',
      });
      await processedComplianceCreated;

      // Assert
      expect(
        fetchMock.called(undefined, {
          matcher: 'express:/sormas-rest/visits-external/person/:uuid/status',
          body: {
            status: 'ACCEPTED',
          },
          params: {
            uuid: 'test-ids',
          },
        })
      );
    });
  });

  describe('onProbandDeleted', () => {
    let processedProbandDeleted: Promise<void>;
    let producer: Producer<MessagePayloadProbandDeleted>;

    beforeEach(async () => {
      processedProbandDeleted =
        MessageQueueTestUtils.injectMessageProcessedAwaiter(
          messageQueueService,
          'proband.deleted',
          testSandbox
        );

      producer = await mqc.createProducer('proband.deleted');

      fetchMock
        .get('express:/user/users/test-pseudonym/ids', 'test-ids')
        .post('express:/sormas-rest/visits-external/person/:uuid/status', {
          body: JSON.stringify(true),
          status: StatusCodes.OK,
        });
    });

    it('should send DELETED status to sormas on proband.deleted', async () => {
      // Arrange
      // Act
      await producer.publish({
        pseudonym: 'test-pseudonym',
      });
      await processedProbandDeleted;

      // Assert
      expect(
        fetchMock.called(undefined, {
          matcher: 'express:/sormas-rest/visits-external/person/:uuid/status',
          body: {
            status: 'DELETED',
          },
          params: {
            uuid: 'test-ids',
          },
        })
      );
    });

    it('should delete the FollowUp and all transmission protocols on proband.deleted', async () => {
      // Arrange
      const pseudonym = 'test-pseudonym';
      const followUp = await getRepository(FollowUp).save({
        pseudonym: pseudonym,
        study: 'Any Study',
        endDate: new Date('2000-01-01'),
      });

      const transmission = await getRepository(SymptomTransmission).save({
        pseudonym: pseudonym,
        study: 'Any Study',
        transmissionDate: new Date(),
        questionnaireInstanceId: 1,
        version: 1,
      });

      // Act
      await producer.publish({
        pseudonym: pseudonym,
      });
      await processedProbandDeleted;

      // Assert
      const followUp2 = await getRepository(FollowUp).findOne(followUp.id);
      expect(followUp2).to.be.undefined;
      const transmission2 = await getRepository(SymptomTransmission).findOne(
        transmission.id
      );
      expect(transmission2).to.be.undefined;
    });
  });
});
