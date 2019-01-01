# Security

Sheets Server comes with two forms of security: **private** and **rule-based**.

To by pass security, add `{ admin: true }` in configs.

## Private

You can make private to **table**, **item** and **properties** by adding `_` before its name. Get and set any private will cause error.

## Rule-based

Allow all read and write (public).

```ts
{
    '.read': true,
    '.write': true
}
```

The module borrow idea from Firebase Realtime Database, see <https://firebase.google.com/docs/database/security/quickstart#sample-rules>

## Rule objects

- `now`: current time
- `auth`: (todo): auth object
- `data`: get data
- `newDat`: update data
- `$dynamic`: any dynamic data