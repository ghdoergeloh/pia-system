/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';

import { LabResultListPage } from './lab-result-list.page';
import { AuthService } from '../../auth/auth.service';
import { SampleTrackingClientService } from '../sample-tracking-client.service';
import SpyObj = jasmine.SpyObj;

describe('LabResultListPage', () => {
  let component: LabResultListPage;
  let fixture: ComponentFixture<LabResultListPage>;

  let auth: SpyObj<AuthService>;
  let sampleTrackingClient: SpyObj<SampleTrackingClientService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    sampleTrackingClient = jasmine.createSpyObj('SampleTrackingClientService', [
      'getUserLabResults',
    ]);

    TestBed.configureTestingModule({
      declarations: [LabResultListPage, MockPipe(TranslatePipe)],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: AuthService, useValue: auth },
        {
          provide: SampleTrackingClientService,
          useValue: sampleTrackingClient,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LabResultListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
