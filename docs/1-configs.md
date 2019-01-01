# Configs

## databaseId

- Type: `string`
- Default: (current active spreadsheet where supported else error)

The spreadsheet id works as the database.

## keyFields

- Type: `{ [sheetName: string]: string }`
- Default: #

Key fields of tables.

```ts
keyFields: {
    foo: 'slug', // use value of the slug field as key
    bar: 'baz' // use value of the baz field as key
}
```

## searchFields

- Type: `{ [sheetName: string]: string[] }`
- Default: `title`

List of fields content search values.

```ts
searchFields: {
    foo: ['content'], // look for value in ['title', 'content']
    bar: ['baz', 'buzzz'] // ['title', 'baz', 'buzzz']
}
```

## admin

- Type: `boolean`
- Default: `false`

If true, all security check points will be passed.

## securityRules

- Type: `Object`
- Default: `{}`

Security rules for checking against the request.

```ts
securityRules: {
    '.read': true,
    '.write': true,
}
```

## AuthToken (todo)

- Type: `Class`
- Default: `null`

User management token class to decode auth token.