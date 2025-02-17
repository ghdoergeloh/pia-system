/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { MockBuilder } from 'ng-mocks';
import { ComplianceManager } from './compliance-manager.service';
import { ComplianceService } from '../psa.app.core/providers/compliance-service/compliance-service';
import { AuthenticationManager } from './authentication-manager.service';
import { User } from '../psa.app.core/models/user';
import { Subject } from 'rxjs';
import { createComplianceDataResponse } from '../psa.app.core/models/instance.helper.spec';
import { ComplianceType } from '../psa.app.core/models/compliance';
import SpyObj = jasmine.SpyObj;
import createSpy = jasmine.createSpy;

describe('ComplianceManager', () => {
  let service: ComplianceManager;
  let complianceClient: SpyObj<ComplianceService>;
  let auth: SpyObj<AuthenticationManager>;
  let currentUserObservable: Subject<User>;

  beforeEach(async () => {
    // Provider and Services
    complianceClient = jasmine.createSpyObj<ComplianceService>(
      'ComplianceService',
      [
        'getComplianceAgreementForUser',
        'getInternalComplianceActive',
        'createComplianceAgreementForUser',
      ]
    );
    currentUserObservable = new Subject<User>();
    auth = jasmine.createSpyObj<AuthenticationManager>(
      'AuthService',
      ['getCurrentUsername', 'getCurrentStudy'],
      {
        currentUser$: currentUserObservable.asObservable(),
      }
    );

    // Build Base Module
    await MockBuilder(ComplianceManager)
      .mock(ComplianceService, complianceClient)
      .mock(AuthenticationManager, auth);
  });

  beforeEach(fakeAsync(() => {
    // Create service
    service = TestBed.inject(ComplianceManager);
  }));

  describe('changing user subscription', () => {
    it('should clear the cache if a user logs out', fakeAsync(() => {
      currentUserObservable.next();
      tick();
      complianceClient.getComplianceAgreementForUser.and.resolveTo(
        createComplianceDataResponse()
      );
      service.getComplianceAgreementForCurrentUser();
      tick();
      expect(complianceClient.getComplianceAgreementForUser).toHaveBeenCalled();
      complianceClient.getComplianceAgreementForUser.calls.reset();
      service.getComplianceAgreementForCurrentUser();
      tick();
      expect(
        complianceClient.getComplianceAgreementForUser
      ).not.toHaveBeenCalled();
    }));
  });

  describe('userHasCompliances()', () => {
    it('should check, whether the current user has given single compliances', async () => {
      complianceClient.getComplianceAgreementForUser.and.resolveTo(
        createComplianceDataResponse()
      );
      expect(await service.userHasCompliances([ComplianceType.SAMPLES])).toBe(
        false
      );
      expect(
        await service.userHasCompliances([ComplianceType.BLOODSAMPLES])
      ).toBeTrue();
      expect(
        await service.userHasCompliances([ComplianceType.LABRESULTS])
      ).toBeTrue();
    });

    it('should check, whether the current user has given list of compliances', async () => {
      complianceClient.getComplianceAgreementForUser.and.resolveTo(
        createComplianceDataResponse()
      );
      expect(
        await service.userHasCompliances([
          ComplianceType.SAMPLES,
          ComplianceType.BLOODSAMPLES,
          ComplianceType.LABRESULTS,
        ])
      ).toBeFalse();
      expect(
        await service.userHasCompliances([
          ComplianceType.BLOODSAMPLES,
          ComplianceType.LABRESULTS,
        ])
      ).toBeTrue();
    });
  });

  describe('isInternalComplianceActive()', () => {
    it('should return true if compliance text exists for the current study', async () => {
      complianceClient.getInternalComplianceActive.and.resolveTo(true);
      expect(await service.isInternalComplianceActive()).toBeTrue();
    });

    it('should return false if no compliance text exists for the current study', async () => {
      complianceClient.getInternalComplianceActive.and.resolveTo(false);
      expect(await service.isInternalComplianceActive()).toBeFalse();
    });
  });

  describe('updateComplianceAgreementForCurrentUser()', () => {
    it('should send a change request to backend', async () => {
      const response = createComplianceDataResponse();
      const request = { ...response, compliance_text: '' };
      complianceClient.createComplianceAgreementForUser.and.resolveTo(response);
      const newCompliance =
        await service.updateComplianceAgreementForCurrentUser(request);
      expect(newCompliance).toEqual(response);
    });

    it('should notify all observers that the compliance changed', fakeAsync(() => {
      const spy = createSpy();
      service.complianceDataChangesObservable.subscribe(spy);
      const response = createComplianceDataResponse();
      const request = { ...response, compliance_text: '' };
      service.updateComplianceAgreementForCurrentUser(request);
      tick();
      expect(spy).toHaveBeenCalled();
    }));
  });
});
