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

Add/update/delete item. Route body:

- `path`: sheet/table name and item key
- `sheet` or `table`: sheet/table name
- `key` or `id`: item key
- `data`: item data

Add an item (PUT):

- `{ sheet: 'foo', key: 'foo-x', data: { ... } }`
- `{ table: 'foo', data: { ... } }` // auto generated key

Update an item (PATCH):

- `{ sheet: 'foo', key: 'foo-x', data: { ... } }`

Remove an item (DELETE):

- `{ sheet: 'foo', key: 'foo-x' }`

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
- `auth`: auth object
- `root`: data service for root
- `data`: data service for current location
- `newData`: data to be updated
- `$dynamic`: any dynamic data

<!-- </block:body> -->

### Examples

```ts
import * as Sheets from "./public_api";

// helpers
function describe_(description: string, handler: () => void) {
  Logger.log(description);
  return handler();
}
function it_(description: string, result: () => boolean) {
  if (result()) {
    Logger.log("   (OK) " + description);
  } else {
    Logger.log("   [FAILED] " + description);
  }
}
function load_() {
  return Sheets.sheets({
    databaseId: "1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI",
    keyFields: {
      // foo: 'key',
      bar: "slug",
      // baz: 'key',
      // bax: 'key',
      // query: 'key',
      users: "uid"
      // userData: 'key',
    },
    security: {
      foo: { ".read": true, ".write": true },
      bar: { ".read": true },
      baz: { ".read": false, ".write": true },
      bax: {
        $key: {
          ".read": '$key == "abc" || $key == "xyz"'
        }
      },
      query: { ".read": true },
      users: {
        $uid: {
          ".read": "!!auth && auth.uid == $uid"
        }
      },
      userData: {
        $key: {
          ".read": "!!auth && auth.uid == data.val().uid"
        }
      }
    }
  });
}

// test
function test() {
  const describe = describe_;
  const it = it_;

  // create sheets instance
  const Sheets = load_();

  describe("Root ref", () => {
    it("Generate auto key", () => {
      const key = Sheets.ref().key();
      return typeof key === "string";
    });

    it("Read (fail for no read permission)", () => {
      let error = null;
      try {
        Sheets.ref().toObject();
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Write (can not update root ref)", () => {
      let error = null;
      try {
        Sheets.ref().update({ a: 1, b: 2 });
      } catch (err) {
        error = err;
      }
      return !!error;
    });
  });

  describe("Foo table", () => {
    it("Get all foo", () => {
      const foo = Sheets.all("foo");
      return foo.length === 3;
    });

    it("Get a foo", () => {
      const foo = Sheets.item<any>("foo", "foo-3");
      return foo.title === "Foo 3";
    });

    it("Query foo", () => {
      const foo = Sheets.query<any>("foo", item => {
        return !!item.content && item.content.indexOf("Hello") > -1;
      });
      return foo.length === 2;
    });

    it("Add a foo", () => {
      Sheets.add("foo", "foo-x", { title: "Foo x", content: "Foo x content." });
      const foo = Sheets.item<any>("foo", "foo-x");
      return foo.title === "Foo x";
    });

    it("Add a foo (auto key)", () => {
      Sheets.add("foo", null, {
        title: "Foo auto",
        content: "Foo auto content."
      });
      // clean up
      const sheet = Sheets.spreadsheet.getSheetByName("foo");
      sheet.deleteRow(sheet.getLastRow());
      return true;
    });

    it("Update a foo", () => {
      Sheets.update("foo", "foo-x", { content: "Foo x new content!" });
      const foo = Sheets.item<any>("foo", "foo-x");
      return foo.content === "Foo x new content!";
    });

    it("Delete a foo", () => {
      Sheets.remove("foo", "foo-x");
      const foo = Sheets.item<any>("foo", "foo-x");
      return foo === null;
    });
  });

  describe("Bar table", () => {
    it("Get all bar", () => {
      const bar = Sheets.all("bar");
      return bar.length === 3;
    });

    it("Get a bar", () => {
      const bar = Sheets.item<any>("bar", "bar-2");
      return bar.title === "Bar 2";
    });

    it("Query bar", () => {
      const bar = Sheets.query<any>("bar", item => {
        return !!item.content && item.content.indexOf("Hello") > -1;
      });
      return bar.length === 1;
    });

    it("Add a bar (fail for no write permission)", () => {
      let error = null;
      try {
        Sheets.add("bar", "bar-x", {
          title: "Bar x",
          content: "Bar x content."
        });
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Update a bar (fail for no write permission)", () => {
      let error = null;
      try {
        Sheets.update("bar", "bar-x", { content: "Bar x new content!" });
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Delete a bar (fail for no write permission)", () => {
      let error = null;
      try {
        Sheets.remove("bar", "bar-x");
      } catch (err) {
        error = err;
      }
      return !!error;
    });
  });

  describe("Baz table", () => {
    it("Get all baz (fail for no read permission)", () => {
      let error = null;
      try {
        const baz = Sheets.all("baz");
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Get a baz (fail for no read permission)", () => {
      let error = null;
      try {
        const baz = Sheets.item<any>("baz", "baz-2");
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Query baz (fail for no read permission)", () => {
      let error = null;
      try {
        const baz = Sheets.query<any>("baz", item => {
          return !!item.content && item.content.indexOf("Baz") > -1;
        });
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Add a baz", () => {
      let error = null;
      try {
        Sheets.add("baz", "baz-x", {
          title: "Baz x",
          content: "Baz x content."
        });
      } catch (err) {
        error = err;
      }
      return !error;
    });

    it("Update a baz", () => {
      let error = null;
      try {
        Sheets.update("baz", "baz-x", { content: "Baz x new content!" });
      } catch (err) {
        error = err;
      }
      return !error;
    });

    it("Delete a baz", () => {
      let error = null;
      try {
        Sheets.remove("baz", "baz-x");
      } catch (err) {
        error = err;
      }
      return !error;
    });
  });

  describe("Bax table", () => {
    it("Get all bax (fail for no permission)", () => {
      let error = null;
      try {
        const bax = Sheets.all("bax");
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Get a bax (has permission)", () => {
      const bax = Sheets.item("bax", "abc");
      return !!bax;
    });

    it("Get a bax (fail for no permission)", () => {
      let error = null;
      try {
        const bax = Sheets.item("bax", "def");
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Query bax (has permission)", () => {
      const bax = Sheets.query<any>("bax", item => {
        return item.key === "abc" || item.key === "xyz";
      });
      return bax.length === 2;
    });

    it("Query bax (fail for no permission)", () => {
      let error = null;
      try {
        const bax = Sheets.query<any>("bax", item => {
          return !!item.content;
        });
      } catch (err) {
        error = err;
      }
      return !!error;
    });
  });

  // mock request data
  const uid = "1LXPDE2qW_2s6nE3eAihfu2rEkWs";
  Sheets.Security.setRequest({
    query: {
      idToken: "xxx.xxx.xxx"
    },
    body: {}
  });

  describe("Users table", () => {
    it("Get (no auth)", () => {
      let error = null;
      try {
        const user = Sheets.item("users", uid);
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Get (has auth, invalid token)", () => {
      Sheets.setIntegration("AuthToken", {
        decodeIdToken: idToken => null
      });

      let error = null;
      try {
        const user = Sheets.item("users", uid);
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Get (has auth, valid token, not the user)", () => {
      Sheets.setIntegration("AuthToken", {
        decodeIdToken: idToken => ({ uid: "xxx" })
      });

      let error = null;
      try {
        const user = Sheets.item("users", uid);
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Get (has auth, valid token)", () => {
      Sheets.setIntegration("AuthToken", {
        decodeIdToken: idToken => ({ uid })
      });

      let error = null;
      try {
        const user = Sheets.item("users", uid);
      } catch (err) {
        error = err;
      }
      return !error;
    });
  });

  describe("User data table", () => {
    it("Get (has auth, valid token, not owned item)", () => {
      Sheets.setIntegration("AuthToken", {
        decodeIdToken: idToken => ({ uid })
      });

      let error = null;
      try {
        const data = Sheets.item("userData", "item-2");
      } catch (err) {
        error = err;
      }
      return !!error;
    });

    it("Get (has auth, valid token, owned item)", () => {
      Sheets.setIntegration("AuthToken", {
        decodeIdToken: idToken => ({ uid })
      });

      let error = null;
      try {
        const data = Sheets.item("userData", "item-1");
      } catch (err) {
        error = err;
      }
      return !error;
    });

    it("Query", () => {
      Sheets.setIntegration("AuthToken", {
        decodeIdToken: idToken => ({ uid })
      });

      let error = null;
      try {
        const data = Sheets.query("userData", { uid });
      } catch (err) {
        error = err;
      }
      return !error;
    });
  });

  describe("Query table", () => {
    it("equal", () => {
      const data = Sheets.query("query", { where: "title", equal: "Foo me" });
      return data.length === 2;
    });

    it("equal (shorthand)", () => {
      const data = Sheets.query("query", { title: "Foo me" });
      return data.length === 2;
    });

    it("exists", () => {
      const data = Sheets.query("query", { where: "content", exists: true });
      return data.length === 3;
    });

    it("exists (not)", () => {
      const data = Sheets.query("query", { where: "content", exists: false });
      return data.length === 1;
    });

    it("contains", () => {
      const data = Sheets.query("query", { where: "content", contains: "me" });
      return data.length === 1;
    });

    it("lt", () => {
      const data = Sheets.query("query", { where: "age", lt: 18 });
      return data.length === 1;
    });

    it("lte", () => {
      const data = Sheets.query("query", { where: "age", lte: 18 });
      return data.length === 2;
    });

    it("gt", () => {
      const data = Sheets.query("query", { where: "age", gt: 18 });
      return data.length === 2;
    });

    it("gte", () => {
      const data = Sheets.query("query", { where: "age", gte: 18 });
      return data.length === 3;
    });

    it("childExists (object)", () => {
      const data = Sheets.query("query", {
        where: "categories",
        childExists: "cat-1"
      });
      return data.length === 2;
    });

    it("childExists (object, not)", () => {
      const data = Sheets.query("query", {
        where: "categories",
        childExists: "!cat-1"
      });
      return data.length === 2;
    });

    it("childExists (array)", () => {
      const data = Sheets.query("query", { where: "list", childExists: "abc" });
      return data.length === 2;
    });

    it("childExists (array, not)", () => {
      const data = Sheets.query("query", {
        where: "list",
        childExists: "!abc"
      });
      return data.length === 2;
    });

    it("childEqual", () => {
      const data = Sheets.query("query", {
        where: "categories",
        childEqual: "cat-1=Cat 1"
      });
      return data.length === 1;
    });

    it("childEqual (not)", () => {
      const data = Sheets.query("query", {
        where: "categories",
        childEqual: "cat-1!=Cat 1"
      });
      return data.length === 3;
    });
  });
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
