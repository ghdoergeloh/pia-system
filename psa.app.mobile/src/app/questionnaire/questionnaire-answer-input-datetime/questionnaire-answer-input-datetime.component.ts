/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { map } from 'rxjs/operators';
import { AbstractControlValueAccessor } from '../../shared/components/abstract-control-value-accessor/abstract-control-value-accessor';
import { FormControlValue } from '../questionnaire-form/questionnaire-form.service';

const QUESTIONNAIRE_ANSWER_INPUT_DATETIME_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => QuestionnaireAnswerInputDatetimeComponent),
  multi: true,
};

@Component({
  selector: 'app-questionnaire-answer-input-datetime',
  templateUrl: './questionnaire-answer-input-datetime.component.html',
  providers: [QUESTIONNAIRE_ANSWER_INPUT_DATETIME_ACCESSOR],
})
export class QuestionnaireAnswerInputDatetimeComponent extends AbstractControlValueAccessor<FormControlValue> {
  /**
   * Min date as ISO string
   */
  @Input()
  minDate: Date;

  /**
   * Max date as ISO string
   */
  @Input()
  maxDate: Date;

  registerOnChange(onChange: (value: Date) => void) {
    this.subscription = this.control.valueChanges
      .pipe(map((value) => new Date(value)))
      .subscribe((value) => onChange(value));
  }

  writeValue(value: Date) {
    if (value instanceof Date) {
      this.control.patchValue(value.toISOString());
    }
  }
}
