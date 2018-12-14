import { AddonRoutesOptions, RoutingErrors } from '@sheetbase/core-server';
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
    private errors: RoutingErrors = {};

    constructor(options: Options = {}) {
        this.spreadsheetService = new SpreadsheetService(options);
        this.securityService = new SecurityService(options);
        this.options = {
            keyFields: {},
            searchFields: {},
            ... options,
        };

        // init tamotsux
        initialize(this.spreadsheetService.spreadsheet());
    }

    registerRoutes(options?: AddonRoutesOptions): void {
        const {
            router,
            endpoint = 'data',
            disabledRoutes = [
                'post:/' + endpoint,
                'delete:/' + endpoint,
            ],
            middlewares = [(req, res, next) => next()],
        } = options;

        // register errors & disabled routes
        router.setDisabled(disabledRoutes);
        router.setErrors(this.errors);

        // register request for security
        middlewares.push((req, res, next) => {
            this.securityService.setRequest(req);
            return next();
        });

        // get data: #all & #item
        router.get('/' + endpoint, ... middlewares, (req, res) => {
            const table: string = req.query.table;
            const id: number = +req.query.id;
            const { where, equal } = req.query;

            let result: any;
            try {
                if (!!where && !!equal) {
                    result = this.item(table, { [where]: equal });
                } else if (!!id) {
                    result = this.item(table, id);
                } else {
                    result = this.all(table);
                }
            } catch (error) {
                return res.error(error);
            }
            return res.success(result);
        });

        // #query
        router.get('/' + endpoint + '/query', ... middlewares, (req, res) => {
            const table: string = req.query.table;
            const { where, orderBy, order, limit, offset } = req.query;

            let result: any;
            try {
                result = this.query(table, {
                    where,
                    orderBy,
                    order,
                    limit,
                    offset,
                });
            } catch (error) {
                return res.error(error);
            }

            return res.success(result);
        });

        // #search
        router.get('/' + endpoint + '/search', ... middlewares, (req, res) => {
            const table: string = req.query.table;
            const s: string = req.query.s;

            let result: any;
            try {
                result = this.search(table, s);
            } catch (error) {
                return res.error(error);
            }

            return res.success(result);
        });

        // #update
        router.post('/' + endpoint, ... middlewares, (req, res) => {
            const table: string = req.body.table;
            const data: {[key: string]: any} = req.body.data;
            const id: number = + req.body.id;
            const { where, equal } = req.body;

            try {
                if (!!where && !!equal) {
                    this.update(table, data, { [where]: equal });
                } else if (!!id) {
                    this.update(table, data, id);
                } else {
                    this.update(table, data);
                }
            } catch (error) {
                return res.error(error);
            }

            return res.success({ updated: true });
        });

        // #delete
        router.delete('/' + endpoint, ... middlewares, (req, res) => {
            const table: string = req.body.table;
            const id: number = + req.body.id;
            const { where, equal } = req.body;

            try {
                if (!!where && !!equal) {
                    this.delete(table, { [where]: equal });
                } else {
                    this.delete(table, id);
                }
            } catch (error) {
                return res.error(error);
            }

            return res.success({ deleted: true });
        });

    }

    /**
     * model
     */
    models() {
        const models = {};
        const { main: tables } = this.spreadsheetService.sheetNames();
        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            try {
                // security checkpoint
                this.securityService.checkpoint('/' + table);
                models[table] = Table.define({sheetName: table});
            } catch (error) {
                // not include the model
            }
        }
        return models;
    }

    model(table: string) {
        // security checkpoint
        this.securityService.checkpoint('/' + table);
        return Table.define({sheetName: table});
    }

    /**
     * helpers
     */
    keyField(table: string): string {
        return this.options.keyFields[table] || '#';
    }

    searchField(table: string): string[] {
        return this.options.searchFields[table] || [];
    }

    processItems<Item>(table: string, rawItems: any[]): Item[] {
        const result: Item[] = [];
        for (let i = 0; i < rawItems.length; i++) {
            const item = parseData(rawItems[i]) as Item;
            try {
                // security checkpoint
                this.securityService.checkpoint(
                    '/' + table + '/' + item[this.keyField(table)],
                    item,
                );
                result.push(item);
            } catch (error) {
                // not add the private item to result
            }
        }
        return result;
    }

    /**
     * main actions
     */
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
            this.securityService.checkpoint(
                '/' + table + '/' + item[this.keyField(table)],
                item,
            );
        }
        return item;
    }

    query<Item>(
        table: string,
        query: {
            where?: { [key: string]: any };
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
        s: string,
    ): Item[] {
        const ref = '#';
        const fields = this.searchField(table);
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
        const searchResult = engine.search(s);
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
        const keyField = this.keyField(table);

        // id !== null; update existing item
        // id === null; create new item
        let id: number;
        let item: any = {}; // for security checking and data preparation
        if (!idOrCondition) {
            // create new
            id = null;
        } else {
            // update if item exists
            // or create new
            item = this.item(table, idOrCondition);
            id = item ? item['#'] : null;
        }

        // prepare the update data
        data = { ... item, ... data }; // merge data to current item
        if (!!id) {
            // for existing item
            // unchangable fields: # and key field
            const unchangableData = {
                '#': id,
                [keyField]: item[keyField],
            };
            data = { ... data, ... unchangableData }; // patch it back
        } else {
            // for new item
            // must have an unique key field
            const key = data[keyField];
            if (!key) {
                throw new Error(`New item must have the key field of "${keyField}".`);
            }
            const exists = !!this.item(table, { [keyField]: key });
            if (exists) {
                throw new Error(`Item exist with ${keyField}=${key}.`);
            }
        }
        data = stringifyData(data); // stringify before saving back

        // security checkpoint
        if (!!id) {
            this.securityService.checkpoint(
                '/' + table + '/' + item[keyField],
                item,
                data,
                'write',
            );
        }

        // execute
        this.model(table).createOrUpdate(data);
    }

    delete(
        table: string,
        idOrCondition: number | {[field: string]: string},
    ) {
        const item = this.item(table, idOrCondition);
        if (!item) return;

        // security checkpoint
        this.securityService.checkpoint(
            '/' + table + '/' + item[this.keyField(table)],
            item, null, 'write',
        );

        // delete the item
        this.model(table).find(item['#']).destroy();
    }

}