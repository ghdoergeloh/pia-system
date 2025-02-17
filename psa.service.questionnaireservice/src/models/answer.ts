/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  QuestionnaireInstanceDto,
  QuestionnaireInstanceStatus,
} from './questionnaireInstance';
import { AnswerOptionDto, AnswerType } from './answerOption';
import { QuestionDto } from './question';

/**
 * @deprecated
 */
export interface Answer {
  question_id: number;
  questionnaire_instance_id: number;
  answer_option_id: number;
  versioning?: number;
  value: string;
  date_of_release?: Date;
  releasing_person?: string;
}

export interface AnswerDto {
  questionnaireInstance?: QuestionnaireInstanceDto;
  question?: QuestionDto;
  answerOption?: AnswerOptionDto;
  versioning: number;
  value: string;
  dateOfRelease: Date | null;
  releasingPerson: string | null;
}

/**
 * This is an interface for the full answer row of the db select for the export.
 * It includes information about the questionnaire with question and answer, about the questionnaire instance
 * and the answer itself.
 */
export interface FullAnswer {
  questionnaire_name: string;
  questionnaire_version: number;
  user_id: string;
  date_of_release_v1: Date | null;
  date_of_release_v2: Date | null;
  date_of_issue: Date;
  status: QuestionnaireInstanceStatus;
  question_label: string;
  qposition: number;
  answer_option_label: string;
  aposition: number;
  values: string[] | null;
  values_code: number[] | null;
  a_type: AnswerType;
  versioning: number | null;
  value: string | null;
  date_of_release: Date | null;
  ids: string | null;
}
