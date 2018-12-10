import { o2a, a2o, uniqueId } from '@sheetbase/core-server';
import { get as lodashGet }  from '../lodash/get';
import { set as lodashSet }  from '../lodash/set';

import { Options } from './types';
import { SQLService } from './sql';
import { SecurityService } from './security';

export class NoSQLService {
    private sqlService: SQLService;
    private securityService: SecurityService;

    constructor(options: Options = {}) {
        this.sqlService = new SQLService(options);
        this.securityService = new SecurityService(options);
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
