/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ErrorWithCausedBy, SpecificError } from '@pia/lib-service-core';
import { StatusCodes } from 'http-status-codes';

export class EntityNotFoundError extends Error {}

export class WrongRoleError extends SpecificError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly errorCode = 'WRONG_ROLE';
}
export class NoAccessToStudyError extends ErrorWithCausedBy {}

export class PlannedProbandNotFoundError extends ErrorWithCausedBy {}
export class StudyNotFoundError extends ErrorWithCausedBy {}
export class AccountCreateError extends ErrorWithCausedBy {}
export class ProbandSaveError extends ErrorWithCausedBy {}
export class PseudonymAlreadyExistsError extends ErrorWithCausedBy {}
export class IdsAlreadyExistsError extends ErrorWithCausedBy {}
export class ProbandNotFoundError extends ErrorWithCausedBy {}

export class RequesterNotFound extends SpecificError {
  public readonly statusCode = StatusCodes.NOT_FOUND;
  public readonly errorCode = 'REQUESTER_NOT_FOUND';
}
export class MissingPermissionError extends SpecificError {
  public readonly statusCode = StatusCodes.FORBIDDEN;
  public readonly errorCode = 'MISSING_PERMISSION';
}

export class FourEyeOppositionPartnerNotFoundError extends SpecificError {
  public readonly statusCode = StatusCodes.NOT_FOUND;
  public readonly errorCode = '4_EYE_OPPOSITION.REQUESTED_FOR_NOT_FOUND';
}
export class FourEyeOppositionSelfNotAllowedAsPartnerError extends SpecificError {
  public readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
  public readonly errorCode = '4_EYE_OPPOSITION.SELF_NOT_ALLOWED_AS_PARTNER';
}
export class FourEyeOppositionPartnerLacksPermissionError extends SpecificError {
  public readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
  public readonly errorCode = '4_EYE_OPPOSITION.PARTNER_LACKS_PERMISSION';
}
export class FourEyeOppositionPendingChangeAlreadyExistsError extends SpecificError {
  public readonly statusCode = StatusCodes.CONFLICT;
  public readonly errorCode = '4_EYE_OPPOSITION.PENDING_CHANGE_ALREADY_EXISTS';
}
export class FourEyeOppositionPartnerNotReachableError extends SpecificError {
  public readonly statusCode = StatusCodes.CONFLICT;
  public readonly errorCode = '4_EYE_OPPOSITION.REQUESTED_FOR_NOT_REACHED';
}

export class StudyInvalidPsyeudonymPrefixError extends SpecificError {
  public readonly statusCode = StatusCodes.UNPROCESSABLE_ENTITY;
  public readonly errorCode = 'STUDY.INVALID_PSEUDONYM_PREFIX';
}
