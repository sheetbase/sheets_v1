import { Options, SheetSchema } from './types';

export class SpreadsheetService {
    private options: Options;

    constructor(options: Options = {}) {
        this.options = options;
    }

    spreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
        const { databaseId } = this.options;
        return !databaseId ? SpreadsheetApp.getActive() : SpreadsheetApp.openById(databaseId);
    }

    sheets(): GoogleAppsScript.Spreadsheet.Sheet[] {
        return this.spreadsheet().getSheets();
    }

    sheet(name?: string): GoogleAppsScript.Spreadsheet.Sheet {
        return !name ? this.spreadsheet().getActiveSheet() : this.spreadsheet().getSheetByName(name);
    }

    range(notation?: string): GoogleAppsScript.Spreadsheet.Range {
        return !notation ? this.spreadsheet().getActiveRange() : this.spreadsheet().getRange(notation);
    }

    getValues(notation?: string): any[] {
        return this.range(notation).getValues();
    }

    setValues(values: any[], notation?: string): GoogleAppsScript.Spreadsheet.Range {
        return this.range(notation).setValues(values);
    }

    sheetNames() {
        const main: string[] = [];
        const meta: string[] = [];
        // get all sheets
        const sheets = this.sheets();
        for (let i = 0; i < sheets.length; i++) {
            const sheetName = sheets[i].getName();
            if (sheetName.substr(0, 2) === '__' && sheetName.substr(sheetName.length - 2, 2) === '__') {
                meta.push(sheetName);
            } else {
                main.push(sheetName);
            }
        }
        return { all: [... main, ... meta], main, meta };
    }

    lastCol(sheetName: string): number {
        return this.sheet(sheetName).getLastColumn();
    }

    lastRow(sheetName: string): number {
        return this.sheet(sheetName).getLastRow();
    }

    createSheet(sheetName: string, schema: SheetSchema[]) {
        const sheet = this.spreadsheet().insertSheet(sheetName);
        const colNumber = schema.length;
        const range = sheet.getRange(1, colNumber);
        const values = [];
        const notes = [];
        const backgrounds = [];

        // cleanup
        sheet.deleteColumns(colNumber, 100);
        sheet.deleteRows(30, 1000);

        // prepare data and set column width
        for (let i = 0; i < schema.length; i++) {
            const item = schema[i];

            // values & backgrounds
            values.push([item.name]);
            notes.push([item.description]);
            backgrounds.push(['gray']);

            // set column size
            if (item.size) {
                sheet.setColumnWidth(1, item.size);
            }
        }

        // values, notes, backgrounds
        range.setValues(values);
        range.setNotes(notes);
        range.setBackgrounds(backgrounds);

        // freeze row
        sheet.setFrozenRows(1);
    }

}