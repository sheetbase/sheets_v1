# SheetsNoSQL

Access Sheets data in the NoSQL style, source: <https://github.com/sheetbase/sheets-server/blob/master/src/lib/nosql.ts>

## Methods

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
import { sheetsNoSQL } from '@sheetbase/sheets-server';

const SheetsNoSQL = sheetsNoSQL({
    databaseId: 'Abcd...',
});

const foo1 = SheetsNoSQL.doc('foo', 'foo-1');
```

## Query

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
const result = SheetsNoSQL.query('foo', {
    orderByKey: 'categories/cat-1',
    equalTo: '!null'
});
```

Last 10 items, order by `title`.

```ts
const result = SheetsNoSQL.query('foo', {
    orderByKey: 'title',
    limitToLast: 10
});
```

## Routes

To add routes to your app, see options [AddonRoutesOptions](https://github.com/sheetbase/core-server/blob/eb221ec3034d6b53abe11bc1942e1920c8f8d81f/src/lib/types.ts#L71):

```ts
SheetsNoSQL.registerRoutes(options?: AddonRoutesOptions);
```

### Default disabled

Disabled routes by default, to enable set `{ disabledRoutes: [] }` in `registerRoutes()`:

```ts
[
    'post:/database/doc', // update an item
    'post:/database' // update multiple items
]
```

### Endpoints

### GET `/database`

Get data `collection`, `doc`, `object`, `list`. Route query string:

- `collection`: collection name
- `doc`: item key
- `path`: full path to data
- `type`: return type, `object` or `list`

### GET `/database/query`

Query items. Route query string:

- `collection`: collection name
- `limitToFirst`, `limitToLast`, `orderByKey`, `order`, `equalTo`, `offset`: query object

### GET `/database/search`

Search items. Route query string:

- `collection`: collection name
- `s`: search string

### POST `/database/doc`

Update item. Route body:

- `collection`: collection name
- `doc`: item key
- `data`: update data
- `where` and `equal`: item condition

### POST `/database`

Update items. Route body:

- `updates`: update data, in form `path: value`