# @sheetbase/sheets-server

- [Configs](#1-configs)

- [Spreadsheet](#2-spreadsheet)

- [Sql](#3-sql)

- [Nosql](#4-nosql)

- [Security](#5-security)

- [API Reference](https://sheetbase.github.io/sheets-server/api)

## Configs

### databaseId

- Type: `string`
- Default: (current active spreadsheet where supported else error)

The spreadsheet id works as the database.

### keyFields

- Type: `{ [sheetName: string]: string }`
- Default: #

Key fields of tables.

```ts
keyFields: {
    foo: 'slug', // use value of the slug field as key
    bar: 'baz' // use value of the baz field as key
}
```

### searchFields

- Type: `{ [sheetName: string]: string[] }`
- Default: `title`

List of fields content search values.

```ts
searchFields: {
    foo: ['content'], // look for value in ['title', 'content']
    bar: ['baz', 'buzzz'] // ['title', 'baz', 'buzzz']
}
```

### admin

- Type: `boolean`
- Default: `false`

If true, all security check points will be passed.

### securityRules

- Type: `Object`
- Default: `{}`

Security rules for checking against the request.

```ts
securityRules: {
    '.read': true,
    '.write': true,
}
```

### AuthToken (todo)

- Type: `Class`
- Default: `null`

User management token class to decode auth token.

## Spreadsheet

Spreadsheet related actions, source: <https://github.com/sheetbase/sheets-server/blob/master/src/lib/spreadsheet.ts>

### Methods

- `spreadsheet`: return the spreadsheet, active or by id.
- `sheets`: list of all sheets
- `sheet`: a sheet, active or by name
- `range`: get range, active or by R1C1
- `getValues`: get range values
- `setValues`: set range values
- `sheetNames`: get all names of sheets
- `lastCol`: get the last collumn of a sheet
- `lastRow`: get the last row of a sheet
- `createSheet`: create a sheet by schema

```ts
import { spreadsheet } from "@sheetbase/sheets-server";

const Spreadsheet = spreadsheet({
  databaseId: "Abcd..."
});

const values = Spreadsheet.getValues("foo!A1:C");
```

## Sheets SQL

Access Sheets data in the SQL style, source: <https://github.com/sheetbase/sheets-server/blob/master/src/lib/sql.ts>

### Methods

- `models`: return all TamotsuX models.
- `model`: return a TamotsuX model.
- `all`: get all items of a table.
- `item`: get an item of a table.
- `query`: query a table.
- `search`: search a table.
- `update`: update a item of a table.
- `delete`: delete an item.

```ts
import { sheetsSQL } from "@sheetbase/sheets-server";

const SheetsSQL = sheetsSQL({
  databaseId: "Abcd..."
});

const foo1 = SheetsSQL.item("foo", 1);
```

### Query

```ts
{
    where?: { [key: string]: any };
    orderBy?: string;
    order?: string;
    limit?: number;
    offset?: number;
}
```

All items from `foo` where `xxx = 'abc'`.

```ts
const result = SheetsSQL.query("foo", {
  where: { xxx: "abc" }
});
```

Limit to the first 10 items.

```ts
const result = SheetsSQL.query("foo", {
  limit: 10
});
```

Page 2.

```ts
const result = SheetsSQL.query("foo", {
  limit: 10,
  offset: 10
});
```

Sorting.

```ts
const result = SheetsSQL.query("foo", {
  orderBy: "title"
});
```

### Routes

To add routes to your app, see options [AddonRoutesOptions](https://github.com/sheetbase/core-server/blob/eb221ec3034d6b53abe11bc1942e1920c8f8d81f/src/lib/types.ts#L71):

```ts
SheetsSQL.registerRoutes(options?: AddonRoutesOptions);
```

#### Default disabled

Disabled routes by default, to enable set `{ disabledRoutes: [] }` in `registerRoutes()`:

```ts
[
  "post:/database", // update an item
  "delete:/database" // remove an item
];
```

#### Endpoints

#### GET `/database`

Get `all` or `item`. Route query string:

- `table`: table name
- `id`: item id
- `where` and `equal`: item condition

#### GET `/database/query`

Query items. Route query string:

- `table`: table name
- `where`, `orderBy`, `order`, `limit`, `offset`: query params

#### GET `/database/search`

Search items. Route query string:

- `table`: table name
- `s`: search string

#### POST `/database`

Update item. Route body:

- `table`: table name
- `id`: item id
- `data`: update data
- `where` and `equal`: item condition

#### DELETE `/database`

Remove item. Route body:

- `table`: table name
- `id`: item id
- `where` and `equal`: item condition

## SheetsNoSQL

Access Sheets data in the NoSQL style, source: <https://github.com/sheetbase/sheets-server/blob/master/src/lib/nosql.ts>

### Methods

- `key`: return 27 chars for using as an item key
- `collection`: get all items
- `doc`: get an item
- `object`: return data as object, by path
- `list`: return data as array, by path
- `query`: query items
- `search`: search for items
- `updateDoc`: update an item
- `update`: update multiple items

```ts
import { sheetsNoSQL } from "@sheetbase/sheets-server";

const SheetsNoSQL = sheetsNoSQL({
  databaseId: "Abcd..."
});

const foo1 = SheetsNoSQL.doc("foo", "foo-1");
```

### Query

```ts
{
    limitToFirst?: number;
    limitToLast?: number;
    offset?: number;
    orderByKey?: string;
    equalTo?: any;
    order?: string;
}
```

Items from `foo` where an item belong to `cat-1`.

```ts
const result = SheetsNoSQL.query("foo", {
  orderByKey: "categories/cat-1",
  equalTo: "!null"
});
```

Last 10 items, order by `title`.

```ts
const result = SheetsNoSQL.query("foo", {
  orderByKey: "title",
  limitToLast: 10
});
```

### Routes

To add routes to your app, see options [AddonRoutesOptions](https://github.com/sheetbase/core-server/blob/eb221ec3034d6b53abe11bc1942e1920c8f8d81f/src/lib/types.ts#L71):

```ts
SheetsNoSQL.registerRoutes(options?: AddonRoutesOptions);
```

#### Default disabled

Disabled routes by default, to enable set `{ disabledRoutes: [] }` in `registerRoutes()`:

```ts
[
  "post:/database/doc", // update an item
  "post:/database" // update multiple items
];
```

#### Endpoints

#### GET `/database`

Get data `collection`, `doc`, `object`, `list`. Route query string:

- `collection`: collection name
- `doc`: item key
- `path`: full path to data
- `type`: return type, `object` or `list`

#### GET `/database/query`

Query items. Route query string:

- `collection`: collection name
- `limitToFirst`, `limitToLast`, `orderByKey`, `order`, `equalTo`, `offset`: query object

#### GET `/database/search`

Search items. Route query string:

- `collection`: collection name
- `s`: search string

#### POST `/database/doc`

Update item. Route body:

- `collection`: collection name
- `doc`: item key
- `data`: update data
- `where` and `equal`: item condition

#### POST `/database`

Update items. Route body:

- `updates`: update data, in form `path: value`

## Security

Sheets Server comes with two forms of security: **private** and **rule-based**.

To by pass security, add `{ admin: true }` in configs.

### Private

You can make private to **table**, **item** and **properties** by adding `_` before its name. Get and set any private will cause error.

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
- `auth`: (todo): auth object
- `data`: get data
- `newDat`: update data
- `$dynamic`: any dynamic data
