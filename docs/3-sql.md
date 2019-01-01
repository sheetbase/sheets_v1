# Sheets SQL

Access Sheets data in the SQL style, source: <https://github.com/sheetbase/sheets-server/blob/master/src/lib/sql.ts>

## Methods

- `models`: return all TamotsuX models.
- `model`: return a TamotsuX model.
- `all`: get all items of a table.
- `item`: get an item of a table.
- `query`: query a table.
- `search`: search a table.
- `update`: update a item of a table.
- `delete`: delete an item.

```ts
import { sheetsSQL } from '@sheetbase/sheets-server';

const SheetsSQL = sheetsSQL({
    databaseId: 'Abcd...',
});

const foo1 = SheetsSQL.item('foo', 1);
```

## Query

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
const result = SheetsSQL.query('foo', {
    where: { xxx: 'abc' },
});
```

Limit to the first 10 items.

```ts
const result = SheetsSQL.query('foo', {
    limit: 10
});
```

Page 2.

```ts
const result = SheetsSQL.query('foo', {
    limit: 10,
    offset: 10,
});
```

Sorting.

```ts
const result = SheetsSQL.query('foo', {
    orderBy: 'title'
});
```

## Routes

To add routes to your app, see options [AddonRoutesOptions](https://github.com/sheetbase/core-server/blob/eb221ec3034d6b53abe11bc1942e1920c8f8d81f/src/lib/types.ts#L71):

```ts
SheetsSQL.registerRoutes(options?: AddonRoutesOptions);
```

### Default disabled

Disabled routes by default, to enable set `{ disabledRoutes: [] }` in `registerRoutes()`:

```ts
[
    'post:/database', // update an item
    'delete:/database' // remove an item
]
```

### Endpoints

### GET `/database`

Get `all` or `item`. Route query string:

- `table`: table name
- `id`: item id
- `where` and `equal`: item condition

### GET `/database/query`

Query items. Route query string:

- `table`: table name
- `where`, `orderBy`, `order`, `limit`, `offset`: query params

### GET `/database/search`

Search items. Route query string:

- `table`: table name
- `s`: search string

### POST `/database`

Update item. Route body:

- `table`: table name
- `id`: item id
- `data`: update data
- `where` and `equal`: item condition

### DELETE `/database`

Remove item. Route body:

- `table`: table name
- `id`: item id
- `where` and `equal`: item condition