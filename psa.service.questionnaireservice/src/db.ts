/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import 'reflect-metadata';
import {
  Connection,
  ConnectionNotFoundError,
  createConnection,
  getConnection,
} from 'typeorm';
import { config } from './config';
import pgPromise, { IDatabase } from 'pg-promise';
import {
  createTransactionRunner,
  DbConnectionGetterFn,
  RepositoryHelper,
  TransactionRunnerFn,
} from '@pia/lib-service-core';
import { QuestionnaireInstance } from './entities/questionnaireInstance';
import { Questionnaire } from './entities/questionnaire';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Question } from './entities/question';
import { AnswerOption } from './entities/answerOption';
import { Condition } from './entities/condition';
import { Answer } from './entities/answer';
import util from 'util';
import { ConnectionOptions } from 'typeorm/connection/ConnectionOptions';

const pgp = pgPromise({ capSQL: true, noLocking: config.isTestMode });

export const db: IDatabase<unknown> = pgp(config.database);
export const runTransaction: TransactionRunnerFn = createTransactionRunner(db);
export const getDbTransactionFromOptionsOrDbConnection: DbConnectionGetterFn =
  RepositoryHelper.createDbConnectionGetter(db);

export class SnakeNamingStrategyWithPlural extends SnakeNamingStrategy {
  public tableName(className: string, customName: string): string {
    const snakeName = super.tableName(className, customName);
    if (customName) {
      return snakeName;
    } else if (snakeName.endsWith('y')) {
      return snakeName.substring(0, snakeName.length - 1) + 'ies';
    } else if (snakeName.endsWith('s')) {
      return snakeName + 'es';
    } else return snakeName + 's';
  }
}

const typeOrmOptions: ConnectionOptions = {
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.database,
  ssl: config.database.ssl,
  entities: [
    QuestionnaireInstance,
    Questionnaire,
    Question,
    AnswerOption,
    Condition,
    Answer,
  ],
  namingStrategy: new SnakeNamingStrategyWithPlural(),
  synchronize: false,
  migrationsRun: false,
  migrations: [],
  logging: false,
};

export async function connectDatabase(
  retryCount = 24,
  delay = 1000
): Promise<Connection> {
  const sleep = util.promisify(setTimeout);
  if (retryCount <= 0) throw new Error('retryCount must be greater than 0');
  // try to get existing connection
  try {
    return getConnection();
  } catch (e) {
    if (!(e instanceof ConnectionNotFoundError)) throw e;
  }
  // if no connection found try to connect
  for (let i = 0; i <= retryCount; i++) {
    try {
      return await createConnection(typeOrmOptions);
    } catch (_e) {
      console.log(
        `Database is not yet available. Waiting for ${delay} ms before next retry.`
      );
      if (i < retryCount) await sleep(delay);
    }
  }
  throw new Error(`Could not reach database after ${retryCount} retries`);
}
