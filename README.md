# Sheetbase Module: @sheetbase/sheets-server

Using Google Sheets as a database.

<!-- <block:header> -->

[![Build Status](https://travis-ci.com/sheetbase/sheets-server.svg?branch=master)](https://travis-ci.com/sheetbase/sheets-server) [![Coverage Status](https://coveralls.io/repos/github/sheetbase/sheets-server/badge.svg?branch=master)](https://coveralls.io/github/sheetbase/sheets-server?branch=master) [![NPM](https://img.shields.io/npm/v/@sheetbase/sheets-server.svg)](https://www.npmjs.com/package/@sheetbase/sheets-server) [![License][license_badge]][license_url] [![clasp][clasp_badge]][clasp_url] [![Support me on Patreon][patreon_badge]][patreon_url] [![PayPal][paypal_donate_badge]][paypal_donate_url] [![Ask me anything][ask_me_badge]][ask_me_url]

<!-- </block:header> -->

## Install

Using npm: `npm install --save @sheetbase/sheets-server`

```ts
import * as Sheets from "@sheetbase/sheets-server";
```

As a library: `1pbQpXAA98ruKtYTtKwBDtdgGTL_Nc_ayGzdRR2ULosG6GcKQJUF5Qyjy`

Set the _Indentifier_ to **SheetsModule** and select the lastest version, [view code](https://script.google.com/d/1pbQpXAA98ruKtYTtKwBDtdgGTL_Nc_ayGzdRR2ULosG6GcKQJUF5Qyjy/edit?usp=sharing).

```ts
declare const SheetsModule: { Sheets: any };
const Sheets = SheetsModule.Sheets;
```

## Scopes

`https://www.googleapis.com/auth/script.scriptapp`

`https://www.googleapis.com/auth/spreadsheets`

## Usage

- Docs homepage: https://sheetbase.github.io/sheets-server

- API reference: https://sheetbase.github.io/sheets-server/api

### Examples

```ts
import * as Sheets from "./public_api";

const databaseId = "1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI";

function load_() {
  return Sheets.sheetsNosql({ databaseId });
}

export function example1(): void {
  const DB = load_();

  const object = DB.object("/foo/foo-3");
  Logger.log(object);
}

export function example2(): void {
  const DB = load_();

  const list = DB.list("/foo/foo-2/content");
  Logger.log(list);
}

export function example3(): void {
  const DB = load_();

  const update = DB.update({
    "/foo/foo-6/content": new Date().getTime()
  });
  Logger.log(update);
}
```

## License

**@sheetbase/sheets-server** is released under the [MIT](https://github.com/sheetbase/sheets-server/blob/master/LICENSE) license.

<!-- <block:footer> -->

[license_badge]: https://img.shields.io/github/license/mashape/apistatus.svg
[license_url]: https://github.com/sheetbase/sheets-server/blob/master/LICENSE
[clasp_badge]: https://img.shields.io/badge/built%20with-clasp-4285f4.svg
[clasp_url]: https://github.com/google/clasp
[patreon_badge]: https://lamnhan.github.io/assets/images/badges/patreon.svg
[patreon_url]: https://www.patreon.com/lamnhan
[paypal_donate_badge]: https://lamnhan.github.io/assets/images/badges/paypal_donate.svg
[paypal_donate_url]: https://www.paypal.me/lamnhan
[ask_me_badge]: https://img.shields.io/badge/ask/me-anything-1abc9c.svg
[ask_me_url]: https://m.me/sheetbase

<!-- </block:footer> -->
