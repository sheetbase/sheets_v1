import { SpreadsheetOptions } from './types';
import { parseData } from './utils';

export class SpreadsheetService {
    private options: SpreadsheetOptions;

    constructor(options: SpreadsheetOptions = {}) {
        this.options = options;
    }

    /**
     * helpers
     */
    spreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
        const { databaseId } = this.options;
        return !databaseId ? SpreadsheetApp.getActiveSpreadsheet() : SpreadsheetApp.openById(databaseId);
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

    // turn [[],[], ...] to [{},{}, ...]
    // and parse data
    parseValues(values: any[], noHeaders = false): any[] {
        const items: any[] = [];
        let headers: string [] = ['value'];
        let data: any[] = values || [];
        if (!noHeaders) {
            headers = values[0] || [];
            data = values.slice(1, values.length) || [];
        }
        for (let i = 0; i < data.length; i++) {
            const rows = data[i];
            const item = {};
            for (let j = 0; j < rows.length; j++) {
                if (rows[j]) {
                    item[headers[j] || (headers[0] + j)] = rows[j];
                }
            }
            if (Object.keys(item).length > 0) {
                items.push(parseData(item));
            }
        }
        return items;
    }

    lastCol(sheetName: string): number {
        return this.sheet(sheetName).getLastColumn();
    }

    lastRow(sheetName: string): number {
        return this.sheet(sheetName).getLastRow();
    }

    /**
     * data
     */
    all<Item>(sheetName: string): Item[] {
        const lastCol = this.lastCol(sheetName);
        return this.parseValues(
            this.getValues(sheetName + '!A1:' + lastCol),
        );
    }

    item<Item>(
        sheetName: string,
        idOrCondition: number | {[field: string]: string},
    ): Item {
        // prepare the input
        let field: string;
        let value: any;
        if (typeof idOrCondition === 'number') {
            field = '#';
            value = idOrCondition;
        } else {
            field = Object.keys(idOrCondition)[0];
            value = idOrCondition[field];
        }
        // get the item
        let result: Item;
        const items: Item[] = this.all(sheetName);
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item[field] === value) {
                result = item;
                break;
            }
        }
        return result;
    }

    update(
        sheetName: string,
        values: any[],
        idOrCondition?: number | {[field: string]: string},
    ): void {
        let row: number;
        if (!idOrCondition) { // new
            row = this.lastRow(sheetName) + 1;
        } else if (typeof idOrCondition === 'number') { // update id
            row = idOrCondition;
        } else { // update by condition
            const item = this.item(sheetName, idOrCondition);
            row = +item['#'];
        }
        // execute
        const lastCol = this.lastCol(sheetName);
        this.setValues(values, sheetName + '!' + `A${row}` + ':' + `${lastCol}{row}`);
    }

}