import { AddonRoutesOptions, RoutingErrors, RouteHandler,
    o2a, a2o, uniqueId } from '@sheetbase/core-server';
import { initialize, Table } from '@sheetbase/tamotsux-server';
import { get as lodashGet }  from '../lodash/get';
import { set as lodashSet }  from '../lodash/set';
import { orderBy }  from '../lodash/orderBy';
import  '../lunr/lunr';
declare const lunr: any;

import { Options } from './types';
import { SecurityService } from './security';
import { SpreadsheetService } from './spreadsheet';
import { parseData, stringifyData } from './utils';

export class SheetsService {
    private options: Options;
    private spreadsheetService: SpreadsheetService;
    private securityService: SecurityService;
    private errors: RoutingErrors = {};

    constructor(options?: Options) {
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

    setOption<K extends keyof Options, Value>(key: K, value: Value): SheetsService {
        this.options[key] = value;
        return this;
    }

    extend(options?: Options) {
        return new SheetsService({ ... this.options, ... options });
    }

    toAdmin() {
        return this.extend({ admin: true });
    }

    // routes
    registerRoutes(options?: AddonRoutesOptions): void {
        const {
            router,
            endpoint = 'database',
            disabledRoutes = [
                'post:/' + endpoint,
                'post:/' + endpoint + '/doc',
                'delete:/' + endpoint,
            ],
            middlewares = [(req, res, next) => next()] as RouteHandler[],
        } = options;

        // register errors & disabled routes
        router.setDisabled(disabledRoutes);
        router.setErrors(this.errors);

        // register request for security
        middlewares.push((req, res, next) => {
            this.securityService.setRequest(req);
            return next();
        });

        // get data:
        // #all & #item
        // #collection & #doc & #object & #list
        router.get('/' + endpoint, ... middlewares, (req, res) => {
            const {
                table, id, where, equal, // #all & #item
                collection, doc, path, type, // #collection & #doc & #object & #list
            } = req.query;

            let result: any;
            try {
                if (!!collection) {
                    const returnObject = type !== 'list';
                    if (!!path) {
                        if (!returnObject) {
                            result = this.list(path);
                        } else {
                            result = this.object(path);
                        }
                    } else if (!!doc) {
                        result = this.doc(collection, doc);
                    } else {
                        result = this.collection(collection, returnObject);
                    }
                } else if (!!table) {
                    if (!!where && !!equal) {
                        result = this.item(table, { [where]: equal });
                    } else if (!!id) {
                        result = this.item(table, +id);
                    } else {
                        result = this.all(table);
                    }
                } else {
                    throw new Error('database/invalid-input');
                }
            } catch (error) {
                return res.error(error);
            }
            return res.success(result);
        });

        // #query
        router.get('/' + endpoint + '/query', ... middlewares, (req, res) => {
            const {
                table, where, orderBy, limit, // #query
                collection, limitToFirst, limitToLast, orderByKey, equalTo, // #deepQuery
                order, offset, // #query & #deepQuery
            } = req.query;

            let result: any;
            try {
                if (!!collection) {
                    result = this.deepQuery(collection, {
                        limitToFirst,
                        limitToLast,
                        orderByKey,
                        order,
                        equalTo,
                        offset,
                    });
                } else if (!!table) {
                    result = this.query(table, {
                        where,
                        orderBy,
                        order,
                        limit,
                        offset,
                    });
                } else {
                    throw new Error('database/invalid-input');
                }
            } catch (error) {
                return res.error(error);
            }

            return res.success(result);
        });

        // #search
        router.get('/' + endpoint + '/search', ... middlewares, (req, res) => {
            const { table, s } = req.query;

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
            const {
                data, // #update & #updateDoc
                table, id, where, equal, // #update
                collection, doc, // #updateDoc
                updates, // #updates
            } = req.body;

            try {
                if (!!updates) {
                    this.updates(updates);
                } else if (!!collection) {
                    if (!!where && !!equal) {
                        this.updateDoc(collection, data, { [where]: equal });
                    } else if (!!doc) {
                        this.updateDoc(collection, data, doc);
                    } else {
                        this.updateDoc(collection, data);
                    }
                } else if (!!table) {
                    if (!!where && !!equal) {
                        this.update(table, data, { [where]: equal });
                    } else if (!!id) {
                        this.update(table, data, +id);
                    } else {
                        this.update(table, data);
                    }
                } else {
                    throw new Error('database/invalid-input');
                }
            } catch (error) {
                return res.error(error);
            }

            return res.success({ updated: true });
        });

        // #delete
        router.delete('/' + endpoint, ... middlewares, (req, res) => {
            const { table, id, where, equal } = req.body;

            try {
                if (!!where && !!equal) {
                    this.delete(table, { [where]: equal });
                } else {
                    this.delete(table, +id);
                }
            } catch (error) {
                return res.error(error);
            }

            return res.success({ deleted: true });
        });

    }

    /**
     * TamotsuX model
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
    keyField(sheetName: string): string {
        return this.options.keyFields[sheetName] || '#';
    }

    key(): string {
        return uniqueId(27);
    }

    searchField(sheetName: string): string[] {
        return this.options.searchFields[sheetName] || [];
    }

    processItems<Item>(sheetName: string, rawItems: any[]): Item[] {
        const result: Item[] = [];
        for (let i = 0; i < rawItems.length; i++) {
            const item = parseData(rawItems[i]) as Item;
            try {
                // security checkpoint
                this.securityService.checkpoint(
                    '/' + sheetName + '/' + item[this.keyField(sheetName)],
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

    collection<Item>(collectionId: string, returnObject = false): {[key: string]: Item} | Item[] {
        let items: any = this.all(collectionId);
        if (returnObject) {
            items = a2o(items, this.keyField(collectionId));
        }
        return items;
    }

    doc<Item>(collectionId: string, docId: string): Item {
        const {[docId]: item = null} = this.collection(collectionId, true) as {[key: string]: Item};
        return item;
    }

    object(path: string) {
        let result: {};
        const [collectionId, docId, ... paths] = path.split('/').filter(Boolean);
        if (!docId) { // all items as object
            result = this.collection(collectionId, true);
        } else {
            const item = this.doc(collectionId, docId);
            if (paths.length > 0) {
                result = lodashGet(item, paths, null);
                // security checkpoint
                this.securityService.checkpoint(path, result);
            } else {
                result = item;
            }
        }
        return result;
    }

    list(path: string): any[] {
        let value = this.object(path) || {};
        value = (value instanceof Object) ? value : { value };
        return o2a(value);
    }

    deepQuery<Item>(
        collectionId: string,
        query: {
            limitToFirst?: number;
            limitToLast?: number;
            offset?: number;
            orderByKey?: string;
            equalTo?: any;
            order?: string;
        } = {},
    ): Item[] {
        let result: any = [];
        const {
            limitToFirst,
            limitToLast,
            orderByKey,
            order,
            equalTo,
            offset,
        } = query;

        // retrieve all items
        const items = this.collection(collectionId);

        // filter
        if (
            orderByKey &&
            (equalTo || (!equalTo && typeof equalTo === 'boolean'))
        ) {
            const [ keyFirst, ... keys ] = orderByKey.split('/');

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                // get the value
                let value = item[keyFirst] || {};
                for (let j = 0; j < keys.length; j++) {
                    const key = keys[j];
                    if (value[key]) {
                        value = value[key];
                    } else {
                        return value = null;
                    }
                }

                if (

                    // true === true
                    (
                        typeof equalTo === 'boolean' &&
                        typeof value === 'boolean' &&
                        value === equalTo
                    ) ||

                    // any (# false) === '!null'
                    (
                        equalTo === '!null' &&
                        !!value
                    ) ||

                    // string, number === string, number
                    (
                        typeof equalTo !== 'boolean' &&
                        typeof value !== 'boolean' &&
                        value === equalTo
                    )

                ) {
                    result.push(item);
                }
            }
        } else {
            result = items;
        }

        // sort result
        result = orderBy(result, [(orderByKey || '#')], (order || 'asc'));

        // limit
        if (limitToFirst) {
            result = result.slice(
                offset || 0,
                limitToFirst + (offset || 0),
            );
        }
        if (limitToLast) {
            result = result.slice(
                result.length - limitToLast - (offset || 0),
                (result.length - (offset || 0)),
            );
        }

        return result;
    }

    updateDoc(
        collectionId: string,
        data: {},
        docIdOrCondition?: number | string | {[field: string]: string},
    ): void {
        let idorCondition;
        if (!docIdOrCondition) { // new
            idorCondition = null;
        } else if (typeof docIdOrCondition === 'number') { // update by id
            idorCondition = docIdOrCondition;
        } else if (typeof docIdOrCondition === 'string') { // update by condition (key field = docId/key)
            idorCondition = { [this.keyField(collectionId)]: docIdOrCondition };
        } else { // update by condition
            idorCondition = docIdOrCondition;
        }
        // execute
        if (data === null) {
            this.delete(collectionId, idorCondition);
        } else {
            this.update(collectionId, data, idorCondition);
        }
    }

    updates(updates: {[key: string]: any}) {
        for (const path of Object.keys(updates)) {
            let data = updates[path];
            // process the path
            const [collectionId, docId = null, ... paths] = path.split('/').filter(Boolean);
            // update the data using paths
            if (data !== null && paths.length > 0) {
                const item = this.doc(collectionId, docId) || {}; // load the item
                lodashSet(item, paths, data); // update the item
                data = item; // patch it back to the data
            }
            // save
            this.updateDoc(collectionId, data, docId);
        }
    }

}