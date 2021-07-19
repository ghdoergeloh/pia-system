import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { LoadingController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { PasswordChange } from '../auth.model';
import { AuthClientService } from '../auth-client.service';
import { AuthService } from '../auth.service';
import { ToastPresenterService } from '../../shared/services/toast-presenter/toast-presenter.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
})
export class ChangePasswordPage {
  readonly minPasswordLength = 12;

  form: FormGroup = ChangePasswordPage.getPasswordChangeForm();

  isUserIntent: boolean =
    this.activatedRoute.snapshot.queryParamMap.get('isUserIntent') === 'true';

  private returnTo: string =
    this.activatedRoute.snapshot.queryParamMap.get('returnTo');

  constructor(
    private authClient: AuthClientService,
    private auth: AuthService,
    private toastPresenter: ToastPresenterService,
    private translate: TranslateService,
    private loadingCtrl: LoadingController,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  private static getPasswordChangeForm(): FormGroup {
    return new FormGroup({
      oldPassword: new FormControl(null),
      newPassword1: new FormControl(null),
      newPassword2: new FormControl(null),
    });
  }

  onChangePassword() {
    if (this.form.get('oldPassword').value === null) {
      this.form.get('oldPassword').setValue('');
    }

    // username is only for backwards compatibility to <1.9.0 Backends
    const passwordChange: PasswordChange = {
      username: this.auth.getCurrentUser().username,
      ...this.form.value,
    };

    if (passwordChange.newPassword1 !== passwordChange.newPassword2) {
      this.toastPresenter.presentToast(
        'CHANGE_PASSWORD.TOAST_MSG_PASSWORDS_NOT_MATCH'
      );
    } else if (
      passwordChange.newPassword1 &&
      passwordChange.newPassword1.length < this.minPasswordLength
    ) {
      this.toastPresenter.presentToast(
        'CHANGE_PASSWORD.TOAST_MSG_PASSWORD_LENGTH_ERROR',
        { len: this.minPasswordLength.toString() }
      );
    } else {
      this.changePassword(passwordChange);
    }
  }

  onDeselectPassword() {
    this.form.get('newPassword1').setValue('');
    this.form.get('newPassword2').setValue('');
    this.onChangePassword();
  }

  onLogout() {
    if (this.auth.isAuthenticated()) {
      this.authClient.logout(this.auth.getCurrentUser().username);
    }
    this.auth.resetCurrentUser();
    this.router.navigate(['auth', 'login']);
  }

  private async changePassword(passwordChange: PasswordChange) {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('LOGIN.AUTHENTICATING'),
    });
    await loading.present();

    try {
      await this.authClient.changePassword(passwordChange);

      this.auth.setPasswordNeeded(false);

      this.toastPresenter.presentToast(
        'CHANGE_PASSWORD.TOAST_MSG_PASSWORD_CHANGED'
      );

      if (this.returnTo) {
        this.router.navigate([this.returnTo]);
      } else {
        this.router.navigate(['home']);
      }
    } catch (error) {
      if (error.status === 401) {
        this.toastPresenter.presentToast(
          'CHANGE_PASSWORD.TOAST_MSG_SESSION_EXPIRED'
        );
        this.router.navigate(['auth', 'login']);
      } else if (error.status === 403) {
        this.toastPresenter.presentToast(
          'CHANGE_PASSWORD.TOAST_MSG_OLD_PASSWORD_WRONG'
        );
      }
      console.error(error);
    }
    await loading.dismiss();
  }
}