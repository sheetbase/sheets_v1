import { AddonRoutesOptions, RoutingErrors, RouteHandler } from '@sheetbase/core-server';

import { Options, Extendable, Intergration, Filter, Query, AdvancedFilter, Database } from './types';
import { SecurityService } from './security';
import { RefService } from './ref';

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
            securityHelpers: {},
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
        return new RefService(path.split('/').filter(Boolean), this);
    }

    key(length = 27, startWith = '-') {
        return this.ref().key(length, startWith);
    }

    all<Item>(sheetName: string) {
        return this.ref('/' + sheetName).toArray() as Item[];
    }

    query<Item>(sheetName: string, filter: Filter) {
        let advancedFilter: AdvancedFilter;
        if (filter instanceof Function) {
            advancedFilter = filter;
        } else {
            // where/equal shorthand: { where: equal }
            let { where, equal } = filter as Query;
            if (!where) {
                where = Object.keys(filter)[0];
                equal = filter[where];
            }
            // build advanced filter
            const {
                exists,
                contains,
                lt, lte,
                gt, gte,
                childExists,
                childEqual,
            } = filter as Query;
            if (!!equal) { // where/equal
                advancedFilter = item => (!!item[where] && item[where] === equal);
            } else if (typeof exists === 'boolean') { // where/exists/not exists
                advancedFilter = item => (!!exists ? !!item[where] : !item[where]);
            } else if (!!contains) { // where/contains
                advancedFilter = item => (
                    !!item[where] &&
                    typeof item[where] === 'string' &&
                    item[where].indexOf(contains) > -1
                );
            } else if (!!lt) { // where/less than
                advancedFilter = item => (
                    !!item[where] &&
                    typeof item[where] === 'number' &&
                    item[where] < lt
                );
            } else if (!!lte) { // where/less than or equal
                advancedFilter = item => (
                    !!item[where] &&
                    typeof item[where] === 'number' &&
                    item[where] <= lte
                );
            } else if (!!gt) { // where/greater than
                advancedFilter = item => (
                    !!item[where] &&
                    typeof item[where] === 'number' &&
                    item[where] > gt
                );
            } else if (!!gte) { // where/greater than or equal
                advancedFilter = item => (
                    !!item[where] &&
                    typeof item[where] === 'number' &&
                    item[where] >= gte
                );
            } else if (!!childExists) { // where/child exists, not exists
                const notExists = childExists.substr(0, 1) === '!';
                const child = notExists ? childExists.replace('!', '') : childExists;
                advancedFilter = item => {
                    if (!item[where] && notExists) {
                        return true; // child always not exists
                    } else if (!!item[where]) {
                        if (item[where] instanceof Array) {
                            return notExists ?
                                (item[where].indexOf(child) < 0) :
                                (item[where].indexOf(child) > -1);
                        } else if (item[where] instanceof Object) {
                            return notExists ? !item[where][child] : !!item[where][child];
                        }
                    }
                    return false;
                };
            } else if (!!childEqual) { // where/child equal, not equal
                let notEqual: boolean;
                let childKey: string;
                let childValue: string;
                if (childEqual.indexOf('!=') > -1) {
                    notEqual = true;
                    const keyValue = childEqual.split('!=').filter(Boolean);
                    childKey = keyValue[0];
                    childValue = keyValue[1];
                } else {
                    const keyValue = childEqual.split('=').filter(Boolean);
                    childKey = keyValue[0];
                    childValue = keyValue[1];
                }
                advancedFilter = item => {
                    if (!item[where] && notEqual) {
                        return true; // always not equal
                    } else if (!!item[where]) {
                        return  (
                            item[where] instanceof Object &&
                            (notEqual ?
                                (!item[where][childKey] || item[where][childKey] !== childValue) :
                                (!!item[where][childKey] && item[where][childKey] === childValue)
                            )
                        );
                    }
                    return false;
                };
            }
        }
        return this.ref('/' + sheetName).query(advancedFilter) as Item[];
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

    increase(
        sheetName: string,
        key: string,
        updates: string | string[] | {[path: string]: number},
    ) {
        return this.ref('/' + sheetName + (!!key ? ('/' + key) : '')).increase(updates);
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
                // query
                where,
                equal,
                exists,
                contains,
                lt, lte,
                gt, gte,
                childExists,
                childEqual,
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
                } else if (!!where) { // query
                    result = this.query(sheetName, {
                        where,
                        equal,
                        exists,
                        contains,
                        lt, lte,
                        gt, gte,
                        childExists,
                        childEqual,
                    });
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
                increasing = null, //increasing
            } = req.body;
            const paths = path.split('/').filter(Boolean);
            const sheetName = table || sheet || paths[0];
            const itemKey = id || key || paths[1] || null;

            if (!sheetName) {
                return res.error('No path/table/sheet.');
            }

            try {
                if (!!increasing) {
                    this.increase(sheetName, key, increasing);
                } else {
                    this.update(sheetName, itemKey, data);
                }
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