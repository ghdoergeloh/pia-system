/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';

@Component({
  selector: 'app-laboratory-result-details',
  templateUrl: './laboratory-result-details.component.html',
  styleUrls: ['./laboratory-result-details.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LaboratoryResultDetailsComponent implements OnInit {
  user_id: string = this.activatedRoute.snapshot.queryParamMap.get('user_id');
  isLoading = true;
  labResultHtml: string;

  constructor(
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService,
    private sampleTrackingService: SampleTrackingService,
    private router: Router,
    private auth: AuthenticationManager
  ) {}

  ngOnInit(): void {
    const currentUserName = this.auth.getCurrentUsername();
    const resultID = this.activatedRoute.snapshot.paramMap.get('id');

    this.sampleTrackingService
      .getLabResultObservationForUser(
        this.user_id ? this.user_id : currentUserName,
        resultID
      )
      .then((res) => {
        this.labResultHtml = res;
        this.isLoading = false;
      });
  }

  onBackButtonClicked(): void {
    if (this.user_id) {
      this.router.navigate(['/laboratory-results/', { user_id: this.user_id }]);
    } else {
      this.router.navigate(['/laboratory-results']);
    }
  }
}
