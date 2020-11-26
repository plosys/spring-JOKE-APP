# ![](config/assets/logo.svg) Appsemble

> The app building platform

## Usage

These are instructions for developing the Appsemble core platform. Production setup instructions can
be found in [here](docs/04-deployment/helm.md).

### Live Environments

Our production environment is available on [appsemble.app](https://appsemble.app).

Our staging environment is available on
[staging.appsemble.review](https://staging.appsemble.review). This environment hosts the latest
changes in the `main` branch. This environment is reset every night at 04:00 AM UTC.

For each of our internal merge requests a review environment is started at
`${CI_MERGE_REQUEST_IID}.appsemble.review`.

### Requirements

**Minimum Hardware Requirements**

| Resource | Minimum | Recommended |
| -------- | ------- | ----------- |
| CPU      | 1 GHz   | >2 GHz      |
| CPUs     | 1       | 2>          |
| RAM      | 12GB    | 16GB>       |
| Disk     | 3 GiB   | >           |

**Software Requirements**

In order to run the Appsemble project in development mode on Linux, macOS or Windows, the following
must be installed.

- [Docker][]
- [Docker Compose][]
- [NodeJS 18][nodejs]
- [Yarn][]

### Getting started

Clone and setup the project.

> Note: your CLI should have elevated privileges when setting up and starting the app

```sh
git clone https://gitlab.com/appsemble/appsemble.git
cd appsemble
yarn
```

The project requires a PostgreSQL database. This project contains a Docker Compose configuration to
spin up a preconfigured database with ease.

```sh
docker compose up -d
```

The project can be served using the following command.

```sh
yarn start
```

To see additional options, run the following command.

```sh
yarn start --help
```

A new account can be registered by going to `http://localhost:9999/register`. Later you can login on
`http://localhost:9999/login`. If you use email registration to register an account, the email
containing the verification link will be printed in the server logs. You need to click this link in
order to use your account.

#### CLI Login

To login using the Appsemble CLI, run the following command.

```sh
yarn appsemble login
```

> Note: when using Windows Subsystem for Linux (WSL) the module `keytar` is not installed by
> default. The workaround for this is manually adding OAuth2 credentials and passing them to the CLI
> using `--client-credentials=`.

This will open Appsemble stud