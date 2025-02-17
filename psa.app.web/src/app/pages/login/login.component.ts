﻿/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { FCMService } from '../../_services/fcm.service';
import { DialogYesNoComponent } from '../../_helpers/dialog-yes-no';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';
import { MatDialog } from '@angular/material/dialog';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { PageManager } from '../../_services/page-manager.service';
import { LocaleService } from '../../_services/locale.service';
import { LoginResponse } from '../../psa.app.core/models/user';

@Component({
  templateUrl: 'login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loading = false;
  loginData: any;
  form: FormGroup;
  showError = false;
  showBackendConnectionError = false;
  token_login: string;
  token_login_username: string;
  other_account: boolean;
  showTokenExpired = false;
  show3WrongAttemptsError = false;
  timeLeft = 0;
  message: any = 0;
  interval: any;
  revealPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthService,
    private alertService: AlertService,
    private auth: AuthenticationManager,
    private pageManager: PageManager,
    private localeService: LocaleService,
    private fcmService: FCMService,
    private fb: FormBuilder,
    private matDialog: MatDialog
  ) {
    if (this.auth.getToken()) {
      this.auth.logout();
    }
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: [''],
    });
    // reset login status
    this.token_login_username = this.auth.getLoginTokenUsername();
    if (this.auth.getLoginToken()) {
      this.form.get('username').disable();
      this.other_account = true;
    } else {
      this.form.get('username').enable();
      this.other_account = false;
    }
  }

  minSec(t): string {
    const minutes = Math.floor(t / 60) % 60;
    t -= minutes * 60;
    const seconds = t % 60;

    return [minutes + ':', seconds >= 10 ? seconds : '0' + seconds].join(' ');
  }

  showUsername(): void {
    this.form.controls['username'].enable();
    this.auth.removeLoginToken();
    this.token_login_username = null;
    this.other_account = false;
  }

  showRequestPWDialog(): void {
    const dialogRef = this.matDialog.open(DialogYesNoComponent, {
      width: '250px',
      data: { content: 'LOGIN.NEW_PASSWORD_ASK' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'yes') {
        this.authenticationService
          .requestNewPassword(
            this.form.value.username,
            this.auth.getLoginToken()
          )
          .then((res) => {
            this.showResultDialog('LOGIN.NEW_PASSWORD_SENT', true);
          })
          .catch((err) => {
            if (err.status === 400) {
              this.showResultDialog('LOGIN.GIVE_USERNAME', false);
            } else {
              this.showResultDialog('LOGIN.NO_NEW_PASSWORD_SENT', false);
            }
          });
      }
    });
  }

  public login(): void {
    this.showError = false;
    this.showBackendConnectionError = false;
    this.showTokenExpired = false;
    this.loginData = {
      username: this.form.value.username,
      password: this.form.value.password,
      locale: this.localeService.currentLocale,
      logged_in_with: 'web',
    };
    this.loading = true;
    if (!this.auth.getLoginToken()) {
      this.authenticationService
        .login(this.loginData)
        .then(async (result) => {
          this.postLoginOperations(result);
        })
        .catch((err) => {
          this.loading = false;
          if (err.status === 403 && err.error.details) {
            this.timeLeft = err.error.details.remainingTime;
            this.setTimerAndShowError();
          } else if (err.status === 0) {
            this.showBackendConnectionError = true;
          } else {
            this.showError = true;
          }
        });
    } else {
      this.authenticationService
        .loginWithToken(this.loginData, this.auth.getLoginToken())
        .then(async (result) => {
          this.postLoginOperations(result);
        })
        .catch((err) => {
          this.loading = false;
          if (err.status === 401) {
            this.showUsername();
            this.showTokenExpired = true;
          } else if (err.status === 403 && err.error.details) {
            this.timeLeft = err.error.details.remainingTime;
            this.setTimerAndShowError();
          } else {
            this.showError = true;
          }
        });
    }
  }

  setTimerAndShowError(): void {
    clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.show3WrongAttemptsError = true;
      if (this.timeLeft > 0) {
        this.timeLeft--;
        this.message = this.minSec(this.timeLeft);
      } else {
        this.show3WrongAttemptsError = false;
      }
    }, 1000);
  }

  private postLoginOperations(user: LoginResponse): void {
    // store user details and jwt token in local storage to keep user logged in between page refreshes
    this.auth.handleLoginResponse(user);

    if (user.pw_change_needed) {
      this.router.navigate(['/changePassword']);
    } else {
      // get return url from route parameters or default to '/'
      const url = new URL(
        'http://localhost' +
          (this.route.snapshot.queryParamMap.get('returnUrl') || '/home')
      );
      this.router.navigate([url.pathname], {
        queryParams: Object.fromEntries(url.searchParams.entries()),
      });
    }
  }

  changeState(): void {
    this.showTokenExpired = false;
    this.showError = false;
  }

  showResultDialog(info: string, success: boolean): void {
    this.matDialog.open(DialogPopUpComponent, {
      width: '250px',
      data: { content: info, isSuccess: success },
    });
  }
}
