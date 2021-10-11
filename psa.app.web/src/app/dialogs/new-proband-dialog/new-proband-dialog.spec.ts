/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../app.module';
import {
  DialogNewProbandComponent,
  DialogNewProbandComponentData,
} from './new-proband-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { QuestionnaireService } from '../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { IMockBuilder } from 'ng-mocks/dist/lib/mock-builder/types';
import { CreateProbandRequest } from '../../psa.app.core/models/proband';
import { fakeAsync, tick } from '@angular/core/testing';
import { first } from 'rxjs/operators';
import {
  createStudy,
  createUserWithStudyAccess,
} from '../../psa.app.core/models/instance.helper.spec';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('DialogNewProbandComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogNewProbandComponent;
  let dialogRef: SpyObj<MatDialogRef<DialogNewProbandComponent>>;
  let authService: SpyObj<AuthService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let moduleBase: IMockBuilder;

  beforeEach(() => {
    // Provider and Services
    dialogRef = createSpyObj<MatDialogRef<DialogNewProbandComponent>>([
      'close',
    ]);
    authService = createSpyObj<AuthService>(['getUser', 'postProband']);
    questionnaireService = createSpyObj<QuestionnaireService>(['getStudies']);

    // Build Base Module
    moduleBase = MockBuilder(DialogNewProbandComponent, AppModule)
      .provide({
        provide: MatDialogRef,
        useValue: dialogRef,
      })
      .mock(AuthService, authService)
      .mock(QuestionnaireService, questionnaireService);

    // Setup  general mocks
    authService.postProband.and.resolveTo(null);
  });

  describe('create new proband', () => {
    beforeEach(async () => {
      // configure module
      await moduleBase;
    });
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      questionnaireService.getStudies.and.resolveTo({
        studies: [
          createStudy({ name: 'Test1' }),
          createStudy({ name: 'Test2' }),
        ],
      });

      // Create component
      fixture = MockRender(DialogNewProbandComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
    }));

    it('should show the form', async () => {
      expect(component).toBeDefined();
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-compliance-labresults"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-compliance-samples"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-compliance-bloodsamples"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-study-center"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-examination-wave"]'
        )
      ).not.toBeNull();
      expect(
        fixture.nativeElement.querySelector(
          '[data-unit="new-proband-study-name"]'
        )
      ).not.toBeNull();
    });

    it('should filter the study', () => {
      component.filteredStudies.pipe(first()).subscribe((studies) => {
        expect(studies).toEqual(['Test1', 'Test2']);
      });
      component.studiesFilterCtrl.setValue('st2');
      component.filteredStudies.pipe(first()).subscribe((studies) => {
        expect(studies).toEqual(['Test2']);
      });
    });

    it('should submit the form', async () => {
      const postData: CreateProbandRequest = {
        pseudonym: 'Test-1234567890',
        complianceBloodsamples: true,
        complianceLabresults: false,
        complianceSamples: true,
        examinationWave: 5,
        studyCenter: 'test-sz',
      };
      const studyName = 'Test1';
      expect(component).toBeDefined();
      component.form.get('pseudonym').setValue(postData.pseudonym);
      component.form
        .get('complianceBloodsamples')
        .setValue(postData.complianceBloodsamples);
      component.form
        .get('complianceLabresults')
        .setValue(postData.complianceLabresults);
      component.form
        .get('complianceSamples')
        .setValue(postData.complianceSamples);
      component.form.get('examinationWave').setValue(postData.examinationWave);
      component.form.get('studyCenter').setValue(postData.studyCenter);
      component.form.get('studyName').setValue(studyName);
      await component.submit();
      expect(authService.postProband).toHaveBeenCalledOnceWith(
        postData,
        studyName
      );
    });
  });

  describe('register pseudonym on ids', () => {
    beforeEach(async () => {
      // configure module
      const data: DialogNewProbandComponentData = {
        ids: 'ce5a2594-1197-444a-944c-d1392c10cff9',
      };
      await moduleBase.provide({
        provide: MAT_DIALOG_DATA,
        useValue: data,
      });
    });

    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      const u = createUserWithStudyAccess({
        study_accesses: [{ study_id: 'Test3', access_level: 'read' }],
      });
      authService.getUser.and.resolveTo(u);

      // Create component
      fixture = MockRender(DialogNewProbandComponent);
      component = fixture.point.componentInstance;
      tick(); // wait for ngOnInit to finish
    }));

    it('should filter the study', () => {
      component.filteredStudies.pipe(first()).subscribe((studies) => {
        expect(studies).toEqual(['Test3']);
      });
      component.studiesFilterCtrl.setValue('st2');
      component.filteredStudies.pipe(first()).subscribe((studies) => {
        expect(studies).toEqual([]);
      });
    });

    it('should submit the form', async () => {
      expect(authService.getUser).toHaveBeenCalled();

      const postData: CreateProbandRequest = {
        pseudonym: 'Test-1234567890',
        ids: 'ce5a2594-1197-444a-944c-d1392c10cff9',
        complianceBloodsamples: true,
        complianceLabresults: false,
        complianceSamples: true,
        examinationWave: 5,
        studyCenter: 'test-sz',
      };
      const studyName = 'Test1';
      expect(component).toBeDefined();
      component.form.get('pseudonym').setValue(postData.pseudonym);
      component.form
        .get('complianceBloodsamples')
        .setValue(postData.complianceBloodsamples);
      component.form
        .get('complianceLabresults')
        .setValue(postData.complianceLabresults);
      component.form
        .get('complianceSamples')
        .setValue(postData.complianceSamples);
      component.form.get('examinationWave').setValue(postData.examinationWave);
      component.form.get('studyCenter').setValue(postData.studyCenter);
      component.form.get('studyName').setValue(studyName);
      await component.submit();
      expect(authService.postProband).toHaveBeenCalledOnceWith(
        postData,
        studyName
      );
    });
  });
});
