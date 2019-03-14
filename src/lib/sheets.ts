import { AddonRoutesOptions, RoutingErrors, RouteHandler } from '@sheetbase/core-server';

import { Options, Extendable, Intergration, Filter, Database } from './types';
import { SecurityService } from './security';
import { DataService } from './data';

export class SheetsService {
    options: Options;
    database: Database;

    Security: SecurityService;
    spreadsheet: any;

    // TODO: add route errors
    errors: RoutingErrors = {};

    constructor(options: Options, database: any) {
        this.options = {
            keyFields: {},
            security: {},
            ... options,
        };
        this.database = database;

        this.Security = new SecurityService(this);
        this.spreadsheet = SpreadsheetApp.openById(options.databaseId);
    }

    setIntegration<K extends keyof Intergration, Value>(key: K, value: Value): SheetsService {
        this.options[key] = value;
        return this;
    }

    extend(options: Extendable) {
        return new SheetsService({ ... this.options, ... options }, this.database);
    }

    toAdmin() {
        return this.extend({ security: false });
    }

    ref(path = '/') {
        return new DataService(path.split('/').filter(Boolean), this);
    }

    key(length = 27, startWith = '-') {
        return this.ref().key(length, startWith);
    }

    all<Item>(sheetName: string) {
        return this.ref('/' + sheetName).toArray() as Item[];
    }

    query<Item>(sheetName: string, filter: Filter) {
        if (!(filter instanceof Function)) {
            let { where, equal } = filter as any;
            if (!where) { // pass in an object, format: { where: equal }
                where = Object.keys(filter)[0];
                equal = filter[where];
            }
            filter = item => {
                return item[where] === equal;
            };
        }
        return this.ref('/' + sheetName).query(filter as any) as Item[];
    }

    item<Item>(sheetName: string, finder: string | Filter) {
        let item: Item = null;
        if (typeof finder === 'string') {
            const key = finder;
            item = this.ref('/' + sheetName + '/' + key).toObject() as Item;
        } else {
            const items = this.query(sheetName, finder);
            if (!!items && items.length === 1) {
                item = items[0] as Item;
            }
        }
        return item;
    }

    update<Data>(sheetName: string, key: string, data: Data) {
        return this.ref('/' + sheetName + (!!key ? ('/' + key) : '')).update(data);
    }

    add<Data>(sheetName: string, key: string, data: Data) {
        return this.update(sheetName, key, data);
    }

    remove(sheetName: string, key: string) {
        return this.update(sheetName, key, null);
    }

    // routes
    registerRoutes(options?: AddonRoutesOptions): void {
        const {
            router,
            endpoint = 'database',
            disabledRoutes = [
                'post:/' + endpoint,
                'put:/' + endpoint,
                'patch:/' + endpoint,
                'delete:/' + endpoint,
            ],
            middlewares = [(req, res, next) => next()] as RouteHandler[],
        } = options;

        // register errors & disabled routes
        router.setDisabled(disabledRoutes);
        router.setErrors(this.errors);

        // register request for security
        middlewares.push((req, res, next) => {
            this.Security.setRequest(req);
            return next();
        });

        router.get('/' + endpoint, ... middlewares, (req, res) => {
            const {
                path = '/', // sheet name and item key
                table, sheet, // sheet name
                id, key, // item key
                where, equal, // query
            } = req.query;
            const paths = path.split('/').filter(Boolean);
            const sheetName = table || sheet || paths[0];
            const itemKey = id || key || paths[1];

            if (!sheetName) {
                return res.error('No path/table/sheet.');
            }

            let result: any;
            try {
                if (!!itemKey) { // get item
                    result = this.item(sheetName, itemKey);
                } else if (!!where && !!equal) { // query
                    result = this.query(sheetName, { where, equal });
                } else { // all
                    result = this.all(sheetName);
                }
            } catch (error) {
                return res.error(error);
            }
            return res.success(result);
        });

        const updateHandler: RouteHandler = (req, res) => {
            const {
                path = '/', // sheet name and item key
                table, sheet, // sheet name
                id, key, // item key
                data = null, // data
            } = req.body;
            const paths = path.split('/').filter(Boolean);
            const sheetName = table || sheet || paths[0];
            const itemKey = id || key || paths[1] || null;

            if (!sheetName) {
                return res.error('No path/table/sheet.');
            }

            try {
                this.update(sheetName, itemKey, data);
            } catch (error) {
                return res.error(error);
            }
            return res.success({ acknowledge: true });
        };

        router.post('/' + endpoint, ... middlewares, updateHandler);
        router.put('/' + endpoint, ... middlewares, updateHandler);
        router.patch('/' + endpoint, ... middlewares, updateHandler);
        router.delete('/' + endpoint, ... middlewares, updateHandler);

    }

}