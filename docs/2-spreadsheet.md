# Spreadsheet

Spreadsheet related actions, source: <https://github.com/sheetbase/sheets-server/blob/master/src/lib/spreadsheet.ts>

## Methods

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
import { spreadsheet } from '@sheetbase/sheets-server';

const Spreadsheet = spreadsheet({
    databaseId: 'Abcd...',
});

const values = Spreadsheet.getValues('foo!A1:C');

```