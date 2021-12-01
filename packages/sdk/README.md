# ![](https://gitlab.com/appsemble/appsemble/-/raw/0.20.40/config/assets/logo.svg) Appsemble SDK

> Build your own blocks

[![npm](https://img.shields.io/npm/v/@appsemble/sdk)](https://www.npmjs.com/package/@appsemble/sdk)
[![GitLab CI](https://gitlab.com/appsemble/appsemble/badges/0.20.40/pipeline.svg)](https://gitlab.com/appsemble/appsemble/-/releases/0.20.40)
[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

## Installation

```sh
npm install @appsemble/sdk
```

## Usage

### `bootstrap`

The bootstrap function registers a function which gets called every time a new instance of the block
is created. If the block returns a DOM Node, it’s attached to the block’s shadow root.

The function may be asynchronous, but should not wait for actions to have finished, as actions are
d