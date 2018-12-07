import { initialize, Table } from '@sheetbase/tamotsux-server';

import { Options } from './types';
import { SpreadsheetService } from './spreadsheet';
import { parseData, stringifyData } from './utils';

export class SQLService {
    private options: Options;
    private spreadsheetService: SpreadsheetService;

    constructor(options: Options = {}) {
        this.spreadsheetService = new SpreadsheetService(options);
        this.options = options;
        // init tamotsux
        initialize(this.spreadsheetService.spreadsheet());
    }

    model(tableName: string) {
        return Table.define({sheetName: tableName});
    }

    models() {
        const models = {};
        const { main: tables } = this.spreadsheetService.sheetNames();
        for (let i = 0; i < tables.length; i++) {
            const tableName = tables[i];
            models[tableName] = Table.define({sheetName: tableName});
        }
        return models;
    }

    all<Item>(tableName: string): Item[] {
        const result: Item[] = [];
        const items = this.model(tableName).all();
        for (let i = 0; i < items.length; i++) {
            result.push(parseData(items[i]) as Item);
        }
        return result;
    }

    item<Item>(
        tableName: string,
        idOrCondition: number | {[field: string]: string},
    ): Item {
        let item: Item;
        if (typeof idOrCondition === 'number') {
            try {
                item = this.model(tableName).find(idOrCondition);
            } catch (error) {
                // no item with the id
                item = null;
            }
        } else {
            item = this.model(tableName).where(idOrCondition).first();
        }
        if (item) {
            item = parseData(item) as Item;
        }
        return item;
    }

    update(
        tableName: string,
        data: {},
        idOrCondition?: number | {[field: string]: string},
    ): void {
        // prepare the id
        let id: number;
        if (!idOrCondition) {
            // new
            id = null;
        } else if (typeof idOrCondition === 'number') {
            // update by id
            // or create new if no item
            id = this.item(tableName, idOrCondition) ? idOrCondition : null;
        } else {
            // update by condition
            // or create new if no item
            const item = this.item(tableName, idOrCondition);
            id = item ? item['#'] : null;
        }
        // execute
        data = stringifyData(data);
        this.model(tableName).createOrUpdate({ ... data, '#': id });
    }

}