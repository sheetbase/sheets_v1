import { initialize, Table } from '@sheetbase/tamotsux-server';
import  '../lunr/lunr';
declare const lunr: any;

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

    model(table: string) {
        // security checkpoint
        this.securityService.check({ sheetName: table });
        return Table.define({sheetName: table});
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

    keyField(table: string): string {
        return this.options.keyFields[table] || '#';
    }

    processItems<Item>(table: string, rawItems: any[]): Item[] {
        const result: Item[] = [];
        for (let i = 0; i < rawItems.length; i++) {
            const item = parseData(rawItems[i]) as Item;
            try {
                // security checkpoint
                this.securityService.check({
                    key: item[this.keyField(table)],
                    data: item,
                });
                result.push(item);
            } catch (error) {
                // not add the private item to result
            }
        }
        return result;
    }

    all<Item>(table: string): Item[] {
        return this.processItems(table, this.model(table).all());
    }

    item<Item>(
        table: string,
        idOrCondition: number | {[field: string]: string},
    ): Item {
        // get item
        let item: Item;
        if (typeof idOrCondition === 'number') {
            try {
                item = this.model(table).find(idOrCondition);
            } catch (error) {
                // no item with the id
                item = null;
            }
        } else {
            item = this.model(table).where(idOrCondition).first();
        }
        if (item) {
            item = parseData(item) as Item;
            // security checkpoint
            this.securityService.check({
                key: item[this.keyField(table)],
                data: item,
            });
        }
        return item;
    }

    query<Item>(
        table: string,
        query: {
            where?: {};
            orderBy?: string;
            order?: string;
            limit?: number;
            offset?: number;
        } = {},
    ): Item[] {
        let result: Item[] = [];
        const { where, orderBy, order, limit, offset = 0 } = query;
        // retrieve items
        let q: any = this.model(table);
        if (where) { q = q.where(where); }
        if (orderBy) { q = q.order(orderBy + (order ? ' ' + order : '')); }
        const items: Item[] = this.processItems(table, q.all());
        if (limit) {
            result = items.slice(offset, limit + offset);
        }
        return result;
    }

    search<Item>(
        table: string,
        query: string,
        options: {
            ref?: string;
            fields?: string[];
        } = {},
    ): Item[] {
        const { ref = '#', fields = [] } = options;
        // load items
        const items = this.all(table);
        const objItems = {};
        // search
        const engine = lunr(builder => {
            builder.ref(ref);
            builder.field('title');
            for (let i = 0; i < fields.length; i++) {
                builder.field(fields[i]);
            }

            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                objItems[item[ref]] = item; // add to temp
                builder.add(item); // add to lunr
            }
        });
        const searchResult = engine.search(query);
        // extract result
        const result: any = [];
        for (let i = 0; i < searchResult.length; i++) {
            const { ref } = searchResult[i];
            result.push(objItems[ref]);
        }
        return result;
    }

    update(
        table: string,
        data: {},
        idOrCondition?: number | {[field: string]: string},
    ): void {
        // prepare the id and item
        let id: number;
        let item: any = {};
        const keyField = this.keyField(table);
        if (!idOrCondition) {
            // new
            id = null;
        } else if (typeof idOrCondition === 'number') {
            // update by id
            // or create new if no item
            item = this.item(table, idOrCondition);
            id = item ? idOrCondition : null;
        } else {
            // update by condition
            // or create new if no item
            item = this.item(table, idOrCondition);
            id = item ? item['#'] : null;
        }
        // security checkpoint
        if (!!id) {
            this.securityService.check({
                key: item[keyField],
            });
        }
        // prepare the update data
        data = { ... item, ... (data || {}) }; // merge data to current item
        if (!!id) {
            // for existing item
            // unchangable fields: # and key field and private properties
            const unchangableData = {
                '#': id,
                [keyField]: item[keyField],
            };
            for (const key of Object.keys(item)) {
                if (this.securityService.isPrivate(key)) {
                    unchangableData[key] = item[key];
                }
            }
            data = { ... data, ... unchangableData }; // patch it back
        } else {
            // for new item
            // must have an unique key field
            const key = data[keyField];
            if (!key) {
                throw new Error('New item must have key field.');
            }
            const exists = !!this.item(table, { [keyField]: key });
            if (exists) {
                throw new Error('Item exist with ' + keyField + '=' + key);
            }
        }
        data = stringifyData(data); // stringify before saving back
        // execute
        this.model(table).createOrUpdate(data);
    }

}