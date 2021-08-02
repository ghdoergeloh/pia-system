/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthenticationManager } from '../_services/authentication-manager.service';

/**
 * Injects Authorization Header to every request
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthenticationManager) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (this.auth.currentUser !== null) {
      request = request.clone({
        setHeaders: {
          Authorization: this.auth.currentUser.token,
        },
      });
    }
    return next.handle(request);
  }
}
