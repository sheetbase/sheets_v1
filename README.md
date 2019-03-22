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

`https://www.googleapis.com/auth/spreadsheets`

## Usage

- Docs homepage: https://sheetbase.github.io/sheets-server

- API reference: https://sheetbase.github.io/sheets-server/api

<!-- <block:body> -->

## Getting started

Install: `npm install --save @sheetbase/sheets-server`

Usage:

```ts
import { sheets } from "@sheetbase/sheets-server";

const Sheets = sheets(
  /* configs */ {
    databaseId: "Abc...xyz"
  }
);

const foo = Sheets.all("foo"); // => [{}, {}, {}, ...]
```

## Configs

### databaseId

- Type: `string`

The spreadsheet id works as the database.

### keyFields

- Type: `{ [sheetName: string]: string }`
- Default: `key` field

Key fields of tables.

```ts
keyFields: {
  foo: 'slug', // use the value of the 'slug' field as the key
  bar: 'xxx' // use the value of the 'xxx' field as the key
}
```

### security

- Type: `boolean` | `Object`
- Default: `{}`

Security rules for checking against the request:

- `true` or `{}` = **private**, no read/write access anywhere
- `false` = **public**, read/write to any sheet/table
- `Object` = rule based access

```ts
security: {
  foo: { '.read': true, '.write': true }, // read/write
  bar: { '.read': true } // read only
  baz: { '.write': true } // write only
  bax: {
    $uid: {
      '.read': '!!auth && auth.uid == $uid' // only authorize user can read
    }
  }
}
```

### securityHelpers

- Type: `Object`
- Default: `{}`

Additional helpers attached to data snapshot for security rule. Built-in:

- `only(props: string[])`: if snapshot is an object abnd has only these properties

```ts
securityHelpers: {
  foo: snapshot => {
    return snapshot.val().foo === 'bar';
  },
}

// use in rule
{
  '.write': 'data.foo()' // equal: 'data.val().foo === "bar"'
}
```

### AuthToken

- Type: `Class`
- Default: `null`

User management token class to decode auth token.

```ts
// import and create user instance (Auth)

Sheets.setIntegration("AuthToken", Auth.Token);
```

## Sheets

CRUD interface for Sheetbase backend accessing Google Sheets.

- `setIntegration`: integrate with orther modules (Auth, ...).
- `extend`: create new Sheets instance from this instance.
- `toAdmin`: create an admin instance from this instance.
- `registerRoutes`: expose database routes.
- `ref`: create a data service for a location.
- `key`: generate an unique key.
- `all`: get all items of a sheet/table.
- `query`: query a sheet/table.
- `item`: get an item of a sheet/table.
- `add`: add an item.
- `update`: update a item of a sheet/table.
- `remove`: delete an item.
- `increase`: increase/decrease a number field.

### setIntegration

Integrate Sheets module with orther modules (Auth, ...)

```ts
// import and create user instance (Auth)
// const Auth = auth({ ... });

// integrate Token class to the Sheets instacce
Sheets.setIntegration("AuthToken", Auth.Token);

// then we may use `auth ` object in security rule
// { '.read': '!!auth && auth.uid == $uid' }
```

### extend

Create new Sheets instance from this instance.

```ts
const SheetsAdmin = Sheets.extend({
  security: false // turn off security for this instance
});
```

### toAdmin

Create an admin instance from this instance.

```ts
const SheetsAdmin = Sheets.toAdmin(); // will pass all security, security = false
```

### registerRoutes

Expose database routes.

```ts
Sheets.registerRoutes({
  router: Sheetbase.Router, // Sheetbase router
  middlewares: [], // list of middlewares, [] = no middlewares
  disabledRoutes: [] // list of disabled routes, [] = no disabled
});
```

### ref

Create a data service for a location. Data service interface: <https://github.com/sheetbase/sheets-server/blob/master/src/lib/data.ts>

```ts
const fooRef = Sheets.ref("/foo");

const foo1Ref = fooRef.child("foo-1"); // create a ref to '/foo/foo-1'
foo1Ref.parent(); // create a ref to '/foo'
const rootRef = fooRef.root(); // create a ref to '/'

fooRef.key(); // generate an unique id: -Abc...xyz

fooRef.toObject(); // retrieve data as an object
fooRef.toArray(); // retrieve data as an array

foo1Ref.update({ title: "Foo 1" }); // create foo-1 if not exists
foo1Ref.update({ title: "Foo 1 new title" }); // update foo-1 title if exists
foo1Ref.update(null); // delete foo-1
```

## key

Generate a Firebase-liked unique key.

```ts
const key = Sheets.key(); // -Abc...xyz
```

## all

Get all items of a sheet/table.

```ts
const foo = Sheets.all("foo"); // [{}, {}, {}, ...]
const bar = Sheets.ref("/bar").toObject(); // { item-1: {}, item-2: {}, item-3: {}, ... }
```

## query

Query a sheet/table.

```ts
// simple query, all item from 'foo' has field1 === 'xxx'
const foo = Sheets.query("foo", { where: "field1", equal: "xxx" });
// shorthand for where/equal, pass in an object, format: { where: equal }
const foo2 = Sheets.query("foo", { field1: "xxx" });

// advanced query, all item from 'bar' has content field include 'hello'
const bar = Sheets.query("bar", item => {
  return !!item.content && item.content.indexOf("hello") > -1;
});
```

List of simple query:

- `where`: (required) an item property to perform query on
- `equal`: (optional) must exists and equal to (===)
- `exists`: (optional) exists = `true`, not exists = `false`
- `contains`: (optional) must be a string and contains the phrase (for array, user `childExists`)
- `lt|lte|gt|gte`: (optional) less/greater than or equal
- `childExists`: (optional) exists = key name or a value, not exists = add `!` before key name.
- `childEqual`: (optional) object only, exists = `key=value`, not exists = `key!=value`, child must be exists and equal to (===)

```ts
// equal
// (title === 'Foo me')
Sheets.query("foo", { where: "title", equal: "Foo me" });

// exists
// (!!content)
Sheets.query("foo", { where: "content", exists: true });
// (!content)
Sheets.query("foo", { where: "content", exists: false });

// contains
// (title.indexOf('me') > -1)
Sheets.query("foo", { where: "title", contains: "me" });

// lt, lte, gt, gte
// (age < 18)
Sheets.query("foo", { where: "age", lt: 18 });
// (age >= 18)
Sheets.query("foo", { where: "age", gte: 18 });

// childExists
// (object, !!categories['cat-1'])
Sheets.query("foo", { where: "categories", childExists: "cat-1" });
// (object, !categories['cat-1'])
Sheets.query("foo", { where: "categories", childExists: "!cat-1" });
// (array, list.indexOf('abc') > -1)
Sheets.query("foo", { where: "list", childExists: "abc" });
// (array, list.indexOf('abc') < 0)
Sheets.query("foo", { where: "list", childExists: "!abc" });

// childEqual
// (categories['cat-1'] === 'Cat 1')
Sheets.query("foo", { where: "categories", childEqual: "cat-1=Cat 1" });
// (categories['cat-1'] !== 'Cat 1')
Sheets.query("foo", { where: "categories", childEqual: "cat-1!=Cat 1" });
```

## item

Get an item of a sheet/table.

```ts
// get item by its key
const foo1 = Sheets.item("foo", "foo-1"); // { ... }

// second argument also accept the query arg (like query above)
// if only one item returned then it the item we need
// but if there is no item or more than 1 item, then it returns NULL
// so choose another unique field for query arg
const foo2 = Sheets.item("foo", { field1: "xxx" });
```

### add

Add an item.

```ts
// add 'foo-x'
// { key: 'foo-x', title: 'Foo x' }
Sheets.add("foo", "foo-x", { title: "Foo x" });

// add a 'foo' with auto key
// { key: '-Abc...xyz', title: 'A foo' }
Sheets.add("foo", null, { title: "A foo" });
```

### update

Update a item of a sheet/table.

```ts
// update foo-x title
Sheets.update("foo", "foo-x", { title: "Foo x new title" });
```

### remove

Delete an item.

```ts
// delete 'foo-x'
Sheets.remove("foo", "foo-x");
```

### increase

Increase/decrease a number field.

```ts
// increase likeCount by 1
Sheets.increase("foo", "foo-1", "likeCount");

// increase likeCount by 1 and counter by 1
Sheets.increase("foo", "foo-1", ["likeCount", "counter"]);

// increase counter by 3
Sheets.increase("foo", "foo-1", { counter: 3 });

// increase rating.count by 1
Sheets.increase("foo", "foo-1", { "rating/count": 1 });
```

### Routes

To add routes to your app, see options [AddonRoutesOptions](https://github.com/sheetbase/core-server/blob/eb221ec3034d6b53abe11bc1942e1920c8f8d81f/src/lib/types.ts#L71):

```ts
Sheets.registerRoutes(options?: AddonRoutesOptions);
```

#### Default disabled

Disabled routes by default, to enable set `{ disabledRoutes: [] }` in `registerRoutes()`:

```ts
[
  "post:/database", // add/update/remove an item
  "put:/database" // add an item
  "patch:/database" // update an item
  "delete:/database" // remove an item
];
```

#### Endpoints

#### GET `/database`

Get `all`, `query` or `item`. Route query string:

- `path`: sheet/table name and item key
- `sheet` or `table`: sheet/table name
- `key` or `id`: item key
- `where`, `equal`, ...: query condition

Get all item from 'foo':

- `sheet=foo`
- `table=foo`
- `path=/foo`

Get an item from 'foo':

- `sheet=foo&key=foo-1`
- `table=foo&id=foo-1`
- `path=/foo/foo-1`

Query from 'foo':

- `table=foo&where=abc&equal=xyz` (same for other query)

#### POST `/database`

Add/update/delete/increase. Route body:

- `path`: sheet/table name and item key
- `sheet` or `table`: sheet/table name
- `key` or `id`: item key
- `data`: item data
- `increasing`: increasing data

Add an item (PUT):

- `{ sheet: 'foo', key: 'foo-x', data: { ... } }`
- `{ table: 'foo', data: { ... } }` // auto generated key

Update an item (PATCH):

- `{ sheet: 'foo', key: 'foo-x', data: { ... } }`

Remove an item (DELETE):

- `{ sheet: 'foo', key: 'foo-x' }`

Increase a value (POST):

- `{ sheet: 'foo', key: 'foo-x', increasing: 'likeCount' }`

#### PUT `/database`

Add an item. Route body same as `POST`.

#### PATCH `/database`

Update an item. Route body same as `POST`.

#### DELETE `/database`

Remove an item. Route body same as `POST`, omit `data` field.

## Security

Sheets Server comes with a rule based security.

To by pass security, add `{ security: false }` in configs.

### Rule-based

Allow all read and write (public).

```ts
{
  '.read': true,
  '.write': true
}
```

The module borrow idea from Firebase Realtime Database, see <https://firebase.google.com/docs/database/security/quickstart#sample-rules>

### Rule objects

- `now`: current time
- `req`: Sheetbase Router req object
- `auth`: auth object
- `root`: root data snapshot
- `data`: data snapshot for current location
- `newData`: data snapshot to be updated
- `inputData`: data snapshot of input update data
- `$dynamic`: any dynamic data

<!-- </block:body> -->

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
