/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';

import { AccessToken } from '@pia/lib-service-core';
import postgresqlHelper from '../services/postgresqlHelper';
import { complianceserviceClient } from '../clients/complianceserviceClient';
import { LabResult } from '../models/LabResult';
import { User } from '../models/user';
import { LabResultImportHelper } from '../services/labResultImportHelper';
import { userserviceClient } from '../clients/userserviceClient';
import { SystemComplianceType } from '@pia-system/lib-http-clients-internal';

export class LaboratoryResultsInteractor {
  private static readonly TESTSTUDY_NAME = 'Teststudie';

  /**
   * gets all laboratory results for a user
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   */
  public static async getAllLaboratoryResults(
    decodedToken: AccessToken,
    pseudonym: string
  ): Promise<LabResult[]> {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
        throw Boom.forbidden('Wrong role for this command');

      case 'Proband': {
        if (requesterName !== pseudonym) {
          throw Boom.forbidden('Probands can only get labresults for themself');
        }
        const studyOfProband = this.getStudyOfProbandOrThrow(requesterStudies);

        const hasLabresultsCompliance =
          await complianceserviceClient.hasAgreedToCompliance(
            pseudonym,
            studyOfProband,
            SystemComplianceType.LABRESULTS
          );
        if (!hasLabresultsCompliance) {
          throw Boom.forbidden('Proband has not complied to see lab results');
        }
        const labResults = (await postgresqlHelper.getAllLabResultsForProband(
          pseudonym
        )) as LabResult[];
        if (studyOfProband === LaboratoryResultsInteractor.TESTSTUDY_NAME) {
          labResults.unshift(this.createTestStudieFakeLabResult(pseudonym));
        }
        return labResults;
      }

      case 'Forscher':
      case 'Untersuchungsteam':
      case 'ProbandenManager': {
        await this.assertProfessionalHasAccessToProband(
          pseudonym,
          requesterStudies
        );

        return (await postgresqlHelper.getAllLabResultsByProband(
          pseudonym
        )) as LabResult[];
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  /**
   * gets one laboratory result for a user
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   * @param result_id the result ID
   */
  public static async getOneLaboratoryResult(
    decodedToken: AccessToken,
    pseudonym: string,
    result_id: string
  ): Promise<LabResult> {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Untersuchungsteam':
      case 'ProbandenManager':
        throw Boom.forbidden('Wrong role for this command');

      case 'Forscher': {
        await this.assertProfessionalHasAccessToProband(
          pseudonym,
          requesterStudies
        );

        const labResult = (await postgresqlHelper.getLabResult(
          pseudonym,
          result_id
        )) as LabResult | null;
        if (labResult) {
          return labResult;
        } else {
          throw Boom.notFound('Could not find labresults');
        }
      }

      case 'Proband': {
        if (requesterName !== pseudonym) {
          throw Boom.forbidden('Probands can only get labresults for themself');
        }
        const studyOfProband = this.getStudyOfProbandOrThrow(requesterStudies);

        const hasLabresultsCompliance =
          await complianceserviceClient.hasAgreedToCompliance(
            pseudonym,
            studyOfProband,
            SystemComplianceType.LABRESULTS
          );
        if (!hasLabresultsCompliance) {
          throw Boom.forbidden('Proband has not complied to see lab results');
        }
        const labResult = (await postgresqlHelper.getLabResultForProband(
          pseudonym,
          result_id
        )) as LabResult | null;
        if (labResult) {
          return labResult;
        }
        if (studyOfProband === LaboratoryResultsInteractor.TESTSTUDY_NAME) {
          return this.createTestStudieFakeLabResult(pseudonym);
        }
        throw Boom.notFound('Could not find labresults');
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  /**
   * gets one laboratory result based on the sample ID
   * @param decodedToken the jwt of the request
   * @param sample_id the sample ID
   */
  public static async getLaboratoryResultWithSampleID(
    decodedToken: AccessToken,
    sample_id: string
  ): Promise<LabResult> {
    const requesterRole = decodedToken.role;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Proband':
      case 'Forscher':
      case 'Untersuchungsteam':
        throw Boom.forbidden('Wrong role for this command');

      case 'ProbandenManager': {
        const labResult = (await postgresqlHelper.getLabResultById(
          sample_id
        )) as LabResult | null;
        if (!labResult) {
          throw Boom.forbidden("Laboratory sample doesn't exist");
        }
        if (!labResult.user_id) {
          throw Boom.forbidden(
            'Laboratory sample is not assigned to a proband'
          );
        }
        await this.assertProfessionalHasAccessToProband(
          labResult.user_id,
          requesterStudies
        );
        return labResult;
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  public static async postLabResultsImport(
    decodedToken: AccessToken
  ): Promise<'success' | 'error'> {
    const requesterRole = decodedToken.role;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Untersuchungsteam':
      case 'Proband':
      case 'Forscher':
        throw Boom.forbidden('Wrong role for this command');

      case 'ProbandenManager': {
        const results = await Promise.all([
          LabResultImportHelper.importHl7FromMhhSftp(),
          LabResultImportHelper.importCsvFromHziSftp(),
        ]);
        return results.every((result) => result === 'success')
          ? 'success'
          : 'error';
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }
  /**
   * creates one laboratory result
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   * @param labResult the laboratory result data
   */
  public static async createOneLaboratoryResult(
    decodedToken: AccessToken,
    pseudonym: string,
    labResult: LabResult
  ): Promise<LabResult> {
    const requesterRole = decodedToken.role;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Proband':
      case 'Forscher':
        throw Boom.forbidden('Wrong role for this command');

      case 'Untersuchungsteam':
      case 'ProbandenManager': {
        await this.assertProfessionalHasAccessToProband(
          pseudonym,
          requesterStudies
        );

        const proband = (await postgresqlHelper.getUser(pseudonym)) as User;
        if (proband.status !== 'active') {
          throw Boom.forbidden(
            'Cannot create a lab result if proband is not active'
          );
        }

        try {
          return (await postgresqlHelper.createLabResult(
            pseudonym,
            labResult
          )) as LabResult;
        } catch (err) {
          console.log(err);
          throw Boom.conflict('sample with this id exists already');
        }
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  /**
   * updates one laboratory result
   * @param decodedToken the jwt of the request
   * @param pseudonym the proband ID
   * @param result_id the result ID
   * @param labResult the laboratory result data
   */
  public static async updateOneLaboratoryResult(
    decodedToken: AccessToken,
    pseudonym: string,
    result_id: string,
    labResult: LabResult
  ): Promise<LabResult> {
    const requesterRole = decodedToken.role;
    const requesterName = decodedToken.username;
    const requesterStudies = decodedToken.groups;

    switch (requesterRole) {
      case 'SysAdmin':
      case 'Forscher':
        throw Boom.forbidden('Wrong role for this command');

      case 'Untersuchungsteam':
      case 'ProbandenManager': {
        await this.assertProfessionalHasAccessToProband(
          pseudonym,
          requesterStudies
        );

        const proband = (await postgresqlHelper.getUser(pseudonym)) as User;
        if (proband.status !== 'active') {
          throw Boom.forbidden(
            'Cannot update a lab result if proband is not active'
          );
        }

        const oldLabResult = (await postgresqlHelper.getLabResult(
          pseudonym,
          result_id
        )) as LabResult | null;
        if (!oldLabResult || oldLabResult.study_status === 'deleted') {
          throw Boom.forbidden('Labresult does not exist');
        }
        if (labResult.remark && labResult.new_samples_sent !== undefined) {
          return (await postgresqlHelper.updateLabResultAsPM(
            pseudonym,
            result_id,
            labResult
          )) as LabResult;
        } else if (labResult.status !== undefined) {
          return (await postgresqlHelper.updateStatusAsPM(
            pseudonym,
            result_id,
            labResult.status
          )) as LabResult;
        } else {
          throw Boom.forbidden('nothing to do');
        }
      }
      case 'Proband': {
        const oldLabResult = (await postgresqlHelper.getLabResult(
          pseudonym,
          result_id
        )) as LabResult | null;
        if (
          !oldLabResult ||
          oldLabResult.study_status === 'deleted' ||
          oldLabResult.study_status === 'deactivated'
        ) {
          throw Boom.forbidden('Labresult does not exist');
        }
        if (
          oldLabResult.dummy_sample_id &&
          oldLabResult.dummy_sample_id !==
            labResult.dummy_sample_id?.toUpperCase()
        ) {
          throw Boom.forbidden(
            'Dummy_sample_id does not match the one in the database'
          );
        }
        if (requesterName !== pseudonym) {
          throw Boom.forbidden('Sample_id does not belong to Proband');
        }
        if (!labResult.date_of_sampling) {
          throw Boom.forbidden('update params are missing');
        }
        if (
          oldLabResult.status !== 'new' &&
          oldLabResult.status !== 'inactive'
        ) {
          throw Boom.forbidden('swab was already sampled');
        }
        const hasSamplesCompliance =
          await complianceserviceClient.hasAgreedToCompliance(
            pseudonym,
            this.getStudyOfProbandOrThrow(requesterStudies),
            SystemComplianceType.SAMPLES
          );
        if (hasSamplesCompliance) {
          return (await postgresqlHelper.updateLabResultAsProband(
            pseudonym,
            result_id,
            labResult
          )) as LabResult;
        } else {
          throw Boom.forbidden('Proband has not complied to take samples');
        }
      }
      default:
        throw Boom.forbidden('unknown role for this command');
    }
  }

  private static getStudyOfProbandOrThrow(
    studyAccessOfProband: string[]
  ): string {
    if (!studyAccessOfProband[0]) {
      throw Boom.forbidden('Probands has no study access');
    }
    return studyAccessOfProband[0];
  }

  private static async assertProfessionalHasAccessToProband(
    pseudonym: string,
    studyAccessOfProfessional: string[]
  ): Promise<void> {
    const studyOfProband = await userserviceClient.getStudyOfProband(pseudonym);
    if (
      !studyOfProband ||
      !studyAccessOfProfessional.includes(studyOfProband)
    ) {
      throw Boom.notFound('Proband not found in any of your studies');
    }
  }

  private static createTestStudieFakeLabResult(user_id: string): LabResult {
    return {
      id: 'TEST-3722734171',
      user_id: user_id,
      order_id: null,
      date_of_sampling: new Date('2020-06-03T10:00').toISOString(),
      status: 'analyzed',
      remark: null,
      new_samples_sent: false,
      performing_doctor: null,
      dummy_sample_id: null,
      study_status: null,
      lab_observations: [
        {
          id: '1',
          lab_result_id: 'TEST-3722734171',
          name: 'SARS-CoV-2 RNA',
          result_value: '12,00',
          comment: null,
          date_of_analysis: new Date('2020-06-03T11:45'),
          date_of_delivery: new Date('2020-06-01T19:35'),
          date_of_announcement: new Date('2020-06-04T09:00'),
          lab_name: 'MHH',
          material: 'Nasenabstrich',
          result_string: 'negativ',
          unit: 'AU/ml',
          other_unit: '.',
          kit_name: 'LIAISON SARS-CoV-2 S1/S2 IgG-Assay (Diasorin)',
          name_id: 0,
        },
      ],
    };
  }
}
