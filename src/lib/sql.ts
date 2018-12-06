import { initialize, Table } from '@sheetbase/tamotsux-server';

import { Options } from './types';
import { SpreadsheetService } from './spreadsheet';
import { parseData } from './utils';

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

    // .all()
    // - [] (blank sheet, header only)
    // - [{}, {}, ...]
    // - throw (no sheet)
    all<Item>(tableName: string): Item[] {
        const items: Item[] = [];
        const rawItems = this.model(tableName).all();
        for (let i = 0; i < rawItems.length; i++) {
            const item = rawItems[i];
            items.push(parseData(item) as Item);
        }
        return items;
    }

    // find()
    // - {} (number and exists)
    // - throw

    // first()
    // - null (array, valid condition not exists)
    // - {} (null, valid condition)
    // - throw
    item<Item>(
        tableName: string,
        idOrCondition: number | {[field: string]: string},
    ): Item {
        let item: Item;
        if (typeof idOrCondition === 'number') {
            item = this.model(tableName).find(idOrCondition);
        } else {
            item = this.model(tableName).where(idOrCondition).first();
        }
        if (item) {
            item = parseData(item) as Item;
        }
        return item;
    }

    // createOrUpdate()
    // - throw (undefined, null)
    // - new (number, string, array, boolean)
    // - new (object no # (null, undefined))
    // - new (not exists # (string, number, boolean, array (first item as id), object)
    // - update (exists #)
    update(
        tableName: string,
        data: {},
        idOrCondition?: number | {[field: string]: string},
    ): void {
        let id: number;
        if (!idOrCondition) { // new
            id = null;
        } else if (typeof idOrCondition === 'number') { // update by id
            id = idOrCondition;
        } else { // update by condition or create new if no item
            const item = this.item(tableName, idOrCondition);
            id = item ? item['#'] : null;
        }

        // TODO:
        // stringifyData first

        // TODO: new
        // check for unique id and key
        // check for valid id (string/number/array(first item))
        // check for mandatory fields for new item

        // execute
        this.model(tableName).createOrUpdate({ ... data, '#': id });
    }

}