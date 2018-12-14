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
            disabledRoutes = [
                'post:/' + endpoint + '/doc',
                'post:/' + endpoint,
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

        // get data: #collection & #doc & #object & #list
        router.get('/' + endpoint, ... middlewares, (req, res) => {
            const collection: string = req.query.collection;
            const doc: string = req.query.doc;
            const path: string = req.query.path;
            const type: string = req.query.type;

            let result: any;
            try {
                if (!!path) {
                    if (type === 'list') {
                        result = this.list(path);
                    } else {
                        result = this.object(path);
                    }
                } else if (!!doc) {
                    result = this.doc(collection, doc);
                } else {
                    result = this.collection(collection);
                }
            } catch (error) {
                return res.error(error);
            }

            return res.success(result);
        });

        // #query
        router.get('/' + endpoint + '/query', ... middlewares, (req, res) => {
            const collection: string = req.query.collection;
            const { limitToFirst, limitToLast, orderByKey, order, equalTo, offset } = req.query;

            let result: any;
            try {
                result = this.query(collection, {
                    limitToFirst,
                    limitToLast,
                    orderByKey,
                    order,
                    equalTo,
                    offset,
                });
            } catch (error) {
                return res.error(error);
            }

            return res.success(result);
        });

        // #search
        router.get('/' + endpoint + '/search', ... middlewares, (req, res) => {
            const collection: string = req.query.collection;
            const s: string = req.query.s;

            let result: any;
            try {
                result = this.search(collection, s);
            } catch (error) {
                return res.error(error);
            }

            return res.success(result);
        });

        // #updateDoc
        router.post('/' + endpoint + '/doc', ... middlewares, (req, res) => {
            const collection: string = req.body.collection;
            const data: {[key: string]: any} = req.body.data;
            const doc: string = req.body.doc;
            const { where, equal } = req.body;
            try {
                if (!!where && !!equal) {
                    this.updateDoc(collection, data, { [where]: equal });
                } else if (!!doc) {
                    this.updateDoc(collection, data, doc);
                } else {
                    this.updateDoc(collection, data);
                }
            } catch (error) {
                return res.error(error);
            }
            return res.success({ updated: true });
        });

        // #update
        router.post('/' + endpoint, ... middlewares, (req, res) => {
            const updates: {[key: string]: any} = req.body.updates;
            try {
                this.update(updates);
            } catch (error) {
                return res.error(error);
            }
            return res.success({ updated: true });
        });
    }

    /**
     * helper methods
     */
    key(): string {
        return uniqueId(27);
    }

    /**
     * main methods
     */
    collection<Item>(collectionId: string, returnObject = false): {[key: string]: Item} | Item[] {
        let items: any = this.sqlService.all(collectionId);
        if (returnObject) {
            items = a2o(items, this.sqlService.keyField(collectionId));
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
        s: string,
    ): Item[] {
        return this.sqlService.search(collectionId, s);
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
            idorCondition = { [this.sqlService.keyField(collectionId)]: docIdOrCondition };
        } else { // update by condition
            idorCondition = docIdOrCondition;
        }
        // execute
        if (data === null) {
            this.sqlService.delete(collectionId, idorCondition);
        } else {
            this.sqlService.update(collectionId, data, idorCondition);
        }
    }

    update(updates: {[key: string]: any}) {
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
