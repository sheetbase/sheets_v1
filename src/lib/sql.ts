import { initialize, Table } from '@sheetbase/tamotsux-server';

import { SQLOptions } from './types';
import { parseData } from './utils';

export class SQLService {
    private options: SQLOptions;

    constructor(options: SQLOptions = {}) {
        this.options = options;
        // init tamotsux
        const { databaseId } = this.options;
        initialize(!databaseId ? SpreadsheetApp.getActiveSpreadsheet() : SpreadsheetApp.openById(databaseId));
    }

    model(tableName: string) {
        return Table.define({sheetName: tableName});
    }

    all<Item>(tableName: string): Item[] {
        const items: Item[] = [];
        const rawItems = this.model(tableName).all();
        for (let i = 0; i < rawItems.length; i++) {
            const item = rawItems[i];
            items.push(parseData(item) as Item);
        }
        return items;
    }

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
        } else { // update by condition
            const item = this.item(tableName, idOrCondition);
            id = item['#'];
        }
        // execute
        this.model(tableName).createOrUpdate({ ... data, '#': id });
    }

}