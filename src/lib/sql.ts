import { initialize, Table } from '@sheetbase/tamotsux-server';

import { Options } from './types';
import { SpreadsheetService } from './spreadsheet';
import { SecurityService } from './security';
import { parseData, stringifyData } from './utils';

export class SQLService {
    private options: Options;
    private spreadsheetService: SpreadsheetService;
    private securityService: SecurityService;

    constructor(options: Options = {}) {
        this.spreadsheetService = new SpreadsheetService(options);
        this.securityService = new SecurityService(options);
        this.options = {
            keyFields: {},
            ... options,
        };

        // init tamotsux
        initialize(this.spreadsheetService.spreadsheet());
    }

    model(tableName: string) {
        // security checkpoint
        this.securityService.check({ sheetName: tableName });
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

    keyField(tableName: string): string {
        return this.options.keyFields[tableName] || '#';
    }

    all<Item>(tableName: string): Item[] {
        const result: Item[] = [];
        const items = this.model(tableName).all();
        for (let i = 0; i < items.length; i++) {
            const item = parseData(items[i]) as Item;
            try {
                // security checkpoint
                this.securityService.check({
                    key: item[this.keyField(tableName)],
                    data: item,
                });
                result.push(item);
            } catch (error) {
                // not add the private item to result
            }
        }
        return result;
    }

    item<Item>(
        tableName: string,
        idOrCondition: number | {[field: string]: string},
    ): Item {
        // get item
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
            // security checkpoint
            this.securityService.check({
                key: item[this.keyField(tableName)],
                data: item,
            });
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
        let item: any; // for security check
        if (!idOrCondition) {
            // new
            id = null;
        } else if (typeof idOrCondition === 'number') {
            // update by id
            // or create new if no item
            item = this.item(tableName, idOrCondition);
            id = item ? idOrCondition : null;
        } else {
            // update by condition
            // or create new if no item
            item = this.item(tableName, idOrCondition);
            id = item ? item['#'] : null;
        }
        // security checkpoint
        if (id) {
            this.securityService.check({
                key: item[this.keyField(tableName)],
            });
        }
        // prepare data
        data = data ? stringifyData(data) : {};
        if (id) {
            delete data[this.keyField(tableName)]; // remove key field
            for (const key of Object.keys(data)) { // remove private properties
                if (this.securityService.isPrivate(key)) delete data[key];
            }
        }
        // execute
        this.model(tableName).createOrUpdate({ ... data, '#': id });
    }

}