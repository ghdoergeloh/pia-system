/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const chai = require('chai');
const sinon = require('sinon');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const expect = chai.expect;
const Client = require('ssh2-sftp-client');
const secretOrPrivateKey = require('../secretOrPrivateKey');
const JWT = require('jsonwebtoken');

const { config } = require('../../src/config');

const server = require('../../src/server');

const apiAddress = 'http://localhost:' + process.env.PORT + '/sample';

const pmSession = {
  id: 1,
  role: 'ProbandenManager',
  username: 'QTestProbandenManager',
  groups: [],
};
const pmToken = JWT.sign(pmSession, secretOrPrivateKey, {
  algorithm: 'RS512',
  expiresIn: '24h',
});
const pmHeader = { authorization: pmToken };

const { db } = require('../../src/db');
const {
  LabResultImportHelper,
} = require('../../src/services/labResultImportHelper');
const client = new Client();
const sftpConfig = config.servers.hziftpserver;

describe('CSV Labresult import test', function () {
  before(async () => {
    const startServerSandbox = sinon.createSandbox();
    startServerSandbox.stub(LabResultImportHelper, 'importHl7FromMhhSftp');
    startServerSandbox.stub(LabResultImportHelper, 'importCsvFromHziSftp');
    await server.init();
    startServerSandbox.restore();
    await client.connect(sftpConfig).catch((err) => {
      console.error(
        `Could not connect to ${sftpConfig.host}:${sftpConfig.port}`,
        err
      );
    });
  });

  after(async function () {
    await client.end();
    await server.stop();
  });

  beforeEach(async function () {
    await client.put(
      './tests/integration/csvImport.spec.data/Laborergebnis_Bsp.csv',
      '/upload/Laborergebnis_Bsp.csv'
    );

    await db.none("INSERT INTO studies (name) VALUES ('QTestStudy')");
    await db.none(
      "INSERT INTO probands (pseudonym, study) VALUES ('QTestProband1', 'QTestStudy')"
    );
    await db.none(
      "INSERT INTO accounts (username, password, role) VALUES ('QTestProbandenManager', '', 'ProbandenManager')"
    );
    await db.none(
      "INSERT INTO lab_results(id, user_id, status, new_samples_sent) VALUES ('X-1283855', 'QTestProband1', 'new', FALSE)"
    );
    await db.none(
      "INSERT INTO lab_results(id, user_id, status, new_samples_sent) VALUES ('X-1283858', 'QTestProband1', 'new', FALSE)"
    );
  });

  afterEach(async function () {
    await client
      .delete('/upload/Laborergebnis_Bsp.csv', true)
      .catch((err) => console.error(err));

    await db.none(
      "DELETE FROM lab_results WHERE user_id LIKE 'QTest%' OR id='X-1283855'  OR id ='X-1283858'"
    );
    await db.none("DELETE FROM probands WHERE pseudonym LIKE 'QTest%'");
    await db.none("DELETE FROM accounts WHERE username LIKE 'QTest%'");
    await db.none("DELETE FROM studies WHERE name LIKE 'QTest%'");
  });

  it('should import csv files with correct fields and correct Proband into database', async function () {
    this.timeout(10000);

    const result = await chai
      .request(apiAddress)
      .post('/labResultsImport')
      .set(pmHeader);
    expect(result).to.have.status(200);
    expect(result.text).to.equal('success');

    const labResults = await db.manyOrNone(
      "SELECT * FROM lab_results WHERE user_id='QTestProband1' ORDER BY id"
    );
    const lab_observations = await db.manyOrNone(
      "SELECT * FROM lab_observations WHERE lab_result_id IN (SELECT id FROM lab_results WHERE user_id='QTestProband1') ORDER BY lab_result_id, name_id"
    );

    expect(labResults.length).to.equal(2);

    expect(labResults[0].id).to.equal('X-1283855');
    expect(labResults[0].user_id).to.equal('QTestProband1');
    expect(labResults[0].status).to.equal('analyzed');

    expect(labResults[1].id).to.equal('X-1283858');
    expect(labResults[1].user_id).to.equal('QTestProband1');
    expect(labResults[1].status).to.equal('analyzed');

    expect(lab_observations.length).to.equal(7);

    expect(lab_observations[0].id).to.not.equal(undefined);
    expect(lab_observations[0].id).to.not.equal(null);
    expect(lab_observations[0].lab_result_id).to.equal('X-1283855');
    expect(lab_observations[0].name_id).to.equal(0);
    expect(lab_observations[0].name).to.equal(
      'Antikörper (IgG) gegen SARS-CoV-2'
    );
    expect(lab_observations[0].result_string).to.equal('negativ');
    expect(lab_observations[0].result_value).to.equal('0,7');
    expect(lab_observations[0].unit).to.equal('.');
    expect(lab_observations[0].other_unit).to.equal('ratio');
    expect(lab_observations[0].kit_name).to.equal(
      'Euroimmun Anti-SARS-CoV-2-ELISA (IgG)'
    );
    expect(lab_observations[0].date_of_analysis).to.not.equal(null);
    expect(lab_observations[0].date_of_analysis).to.not.equal(undefined);
    expect(lab_observations[0].date_of_delivery).to.not.equal(null);
    expect(lab_observations[0].date_of_delivery).to.not.equal(undefined);
    expect(lab_observations[0].date_of_announcement).to.not.equal(null);
    expect(lab_observations[0].date_of_announcement).to.not.equal(undefined);
    expect(lab_observations[0].comment).to.equal('.');
    expect(lab_observations[0].lab_name).to.equal('Plauen');
    expect(lab_observations[0].material).to.equal('Vollblut');

    expect(lab_observations[4].id).to.not.equal(undefined);
    expect(lab_observations[4].id).to.not.equal(null);
    expect(lab_observations[4].lab_result_id).to.equal('X-1283858');
    expect(lab_observations[4].name_id).to.equal(0);
    expect(lab_observations[4].name).to.equal(
      'Antikörper (IgG) gegen SARS-CoV-6'
    );
    expect(lab_observations[4].result_string).to.equal('grenzwertig');
    expect(lab_observations[4].result_value).to.equal('12,00');
    expect(lab_observations[4].unit).to.equal('AU/ml');
    expect(lab_observations[4].other_unit).to.equal('.');
    expect(lab_observations[4].kit_name).to.equal(
      'LIAISON SARS-CoV-2 S1/S2 IgG-Assay (Diasorin)'
    );
    expect(lab_observations[4].date_of_analysis).to.not.equal(null);
    expect(lab_observations[4].date_of_analysis).to.not.equal(undefined);
    expect(lab_observations[4].date_of_delivery).to.not.equal(null);
    expect(lab_observations[4].date_of_delivery).to.not.equal(undefined);
    expect(lab_observations[4].date_of_announcement).to.not.equal(null);
    expect(lab_observations[4].date_of_announcement).to.not.equal(undefined);
    expect(lab_observations[4].comment).to.equal(
      'nicht an den Probanden, nicht befundet'
    );
    expect(lab_observations[4].lab_name).to.equal('Plauen');
    expect(lab_observations[4].material).to.equal('Vollblut');
  });
});
