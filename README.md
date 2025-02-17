# PIA-System

![logo](psa.app.web/src/assets/images/pia_logo.png)

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![DOI](https://zenodo.org/badge/319654384.svg)](https://zenodo.org/badge/latestdoi/319654384)

[**P**rospective Mon**i**toring and Management - **A**pp](https://info-pia.de/) (PIA).

PIA facilitates the data acquisition in health studies and takes into account the wishes of the participants, the study center and the research institution and thereby also supports the long-term motivation of the participants.

PIA consists of a web application as well as mobile apps for Android and iOS that enables the participants to conduct health studies and study management, as well it can be used as a symptom diary for contact tracing.
The main goals of this project are:

- Simplify the data collection process
- (Long-term) motivation of users through persuasive technology
- Focus on usability and user centered design
- Focus on data protection and security

### Build with

In the backend PIA is composed of [Node.js](https://nodejs.org/) microservices that are using [PostgreSQL](https://www.postgresql.org/) as a database.
The microservices are containerized using [Docker](https://www.docker.com/).
As frontends an [Angular](https://angular.io/) web app and a [Ionic](https://ionicframework.com/) powered iOS and Android mobile app are provided.

## Getting started

To get a local copy up and running follow these simple steps.

### Prerequisites

[Docker](https://www.docker.com/), [Docker-Compose](https://docs.docker.com/compose/) and [Node.js](https://nodejs.org/) should be installed.

### Startup

To run PIA locally move to `pia-ansible/local` and run [start.sh](pia-ansible/local/start.sh).

```bash
cd pia-ansible/local
./start.sh
```

Use `docker ps` to check and wait until all services are healthy.
After that PIA can be accessed using [localhost](http://localhost/).

### Add the first user

To add the first admin user, you can use the following command:

```bash
docker exec authservice node src/scripts/useradd.js --user=TestAdmin --password=TestPassword
```

## Usage

### How to add a service

A dockerized node service can be added by creating a new directory and placing the corresponding sources, `Dockerfile` and `package.json` into it.

[`psa.utils.repo-tool generate`](./psa.utils.repo-tool) will automatically adjust the gitlab pipelines.
It will also include unit-/integration-tests and linting if specified in the `package.json`.

For the deployment the new service has to be added to [docker-compose.yml.j2](./pia-ansible/roles/pia/templates/docker-compose.yml.j2).

If the service requires a certificate [generate-secrets](./psa.utils.scripts/generate-secrets/) must be updated to create a certificate for that service.

For the service to be reachable from the outside, the routes to that service have to be configured inside the [apigateway](./psa.server.apigateway/src/config.ts).

### Local dependencies

A service can use a library that is included in this monorepo.
To utilize that functionality you can install the library using relative paths.

```bash
psa.service.code-sharing-example$ npm install --save ../psa.lib.code-sharing-example/
```

Inside the `Dockerfile` of `psa.service.code-sharing-example` the dependent lib has to be copied before the `npm ci` call:

```dockerfile
WORKDIR /usr/src/node-app/

ARG DIR=

COPY $DIR/package.json package.json
COPY $DIR/package-lock.json package-lock.json

#copy dependencies
COPY psa.lib.code-sharing-example/ ../psa.lib.code-sharing-example

RUN npm ci --production
```

After that [`psa.utils.repo-tool generate`](./psa.utils.repo-tool) has to be executed to update the generated [dockerfiles](./psa.utils.repo-tool/generated/).

<!--
## Roadmap
*TODO*
-->

## Contributing

Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Make sure your Changes are formatted using [prettier](https://github.com/prettier/prettier) (`npx prettier --write .`)
4. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the Branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## Licence

Distributed under the AGPL-3.0 license. See [LICENSE](./LICENSE.md) for more information.

## Contact

[PiaPost@helmholtz-hzi.de](mailto:PiaPost@helmholtz-hzi.de)

![HZI](psa.app.web/src/assets/images/hzi_logo.jpg)
