import { AddonRoutesOptions, RoutingErrors } from '@sheetbase/core-server';
import { o2a, a2o, uniqueId } from '@sheetbase/core-server';
import { get as lodashGet }  from '../lodash/get';
import { set as lodashSet }  from '../lodash/set';
import { orderBy }  from '../lodash/orderBy';

import { Options } from './types';
import { SQLService } from './sql';
import { SecurityService } from './security';

export class NoSQLService {
    private sqlService: SQLService;
    private securityService: SecurityService;
    private errors: RoutingErrors = {};

    constructor(options: Options = {}) {
        this.sqlService = new SQLService(options);
        this.securityService = new SecurityService(options);
    }

    registerRoutes(options?: AddonRoutesOptions): void {
        const {
            router,
            endpoint = 'data',
            disabledRoutes = [],
            middlewares = [(req, res, next) => next()],
        } = options;

        // register errors & disabled routes
        router.setDisabled(disabledRoutes);
        router.setErrors(this.errors);

        // get data
        router.get('/' + endpoint, ... middlewares, (req, res) => {
            const path: string = req.query.path;
            const type: string = req.query.type;
            let result: any[] | {[key: string]: any};
            try {
                if (type === 'list') {
                    result = this.list(path);
                } else {
                    result = this.object(path);
                }
            } catch (code) {
                return res.error(code);
            }
            return res.success(result);
        });

        // update
        router.post('/' + endpoint, ... middlewares, (req, res) => {
            const updates: {[key: string]: any} = req.body.updates;
            try {
                this.update(updates);
            } catch (code) {
                return res.error(code);
            }
            return res.success({
                updated: true,
                updates,
            });
        });
    }

    key(): string {
        return uniqueId(27);
    }

    collection<Item>(collectionId: string, returnObject = false): {[key: string]: Item} | Item[] {
        let items: any = this.sqlService.all(collectionId);
        if (returnObject) {
            items = a2o(items, this.sqlService.keyField(collectionId));
        }
        return items;
    }

    doc<Item>(collectionId: string, docId: string): Item {
        const items = this.collection(collectionId, true) as {[key: string]: Item};
        return items[docId] || null;
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
                // if data comes from a private properties or not
                this.securityService.check({ data: result, dataKey: paths[0] });
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

    query<Item>(
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

    search<Item>(
        collectionId: string,
        query: string,
        options: {
            ref?: string;
            fields?: string[];
        } = {},
    ): Item[] {
        return this.sqlService.search(collectionId, query);
    }

    updateDoc(
        collectionId: string,
        data: {},
        docIdOrCondition?: string | {[field: string]: string},
    ): void {
        let idorCondition;
        if (!docIdOrCondition) { // new
            idorCondition = null;
        } else if (typeof docIdOrCondition === 'string') { // update by doc id
            idorCondition = { [this.sqlService.keyField(collectionId)]: docIdOrCondition };
        } else { // update by condition
            idorCondition = docIdOrCondition;
        }
        // execute
        this.sqlService.update(collectionId, data, idorCondition);
    }

    update(updates: {[key: string]: any}) {
        for (const path of Object.keys(updates)) {
            let data = updates[path];
            // process the path
            const [collectionId, docId = null, ... paths] = path.split('/').filter(Boolean);
            // update the data using paths
            if (paths.length > 0) {
                const item = this.doc(collectionId, docId) || {}; // load the item
                lodashSet(item, paths, data); // update the item
                data = item; // patch it back to the data
            }
            // save
            this.updateDoc(collectionId, data, docId);
        }
    }

}
