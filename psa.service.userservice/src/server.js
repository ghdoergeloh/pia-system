const Hapi = require('@hapi/hapi');
const {
  registerPlugins,
  registerAuthStrategies,
} = require('@pia/lib-service-core');

const packageJson = require('../package.json');
const { db } = require('./db');
const { config } = require('./config');
const mailService = require('./services/mailService.js');

let server;
let serverInternal;

exports.init = async () => {
  server = Hapi.server({
    host: config.public.host,
    port: config.public.port,
    tls: config.public.tls,
    routes: {
      cors: { origin: ['*'] },
      timeout: {
        socket: false,
        server: false,
      },
    },
    app: {
      healthcheck: async () => {
        await db.one('SELECT 1;');
        return true;
      },
    },
  });

  serverInternal = Hapi.server({
    host: config.internal.host,
    port: config.internal.port,
    routes: {
      cors: { origin: ['*'] },
      timeout: {
        socket: false,
        server: false,
      },
    },
  });

  mailService.initService();

  await registerAuthStrategies(server, {
    strategies: ['jwt'],
    publicAuthKey: config.publicAuthKey,
    db: db,
  });
  await registerPlugins(server, {
    name: packageJson.name,
    version: packageJson.version,
    routes: './src/routes/*.js',
  });
  await registerPlugins(serverInternal, {
    name: packageJson.name,
    version: packageJson.version,
    routes: './src/routes/internal/*.js',
    isInternal: true,
  });

  await server.start();
  server.log(['startup'], `Server running at ${server.info.uri}`);
  await serverInternal.start();
  serverInternal.log(
    ['startup'],
    `InternalServer running at ${serverInternal.info.uri}`
  );
};

exports.stop = async () => {
  await server.stop();
  server.log(['startup'], `Server was stopped`);
  await serverInternal.stop();
  server.log(['startup'], `Internal server was stopped`);
};