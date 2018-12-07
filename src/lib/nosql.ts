import { o2a, a2o, uniqueId } from '@sheetbase/core-server';
import { get as lodashGet }  from '../lodash/get';

import { Options } from './types';
import { SQLService } from './sql';

export class NoSQLService {
    private options: Options;
    private sqlService: SQLService;

    constructor(options: Options = {}) {
        this.sqlService = new SQLService(options);
        this.options = {
            keyFields: {},
            ... options,
        };
    }

    keyField(collectionId: string): string {
        return this.options.keyFields[collectionId] || '#';
    }

    key(): string {
        return uniqueId(27);
    }

    collection<Item>(collectionId: string, returnObject = false): {[key: string]: Item} | Item[] {
        let items: any = this.sqlService.all(collectionId);
        if (returnObject) {
            items = a2o(items, this.keyField(collectionId));
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
            idorCondition = { [this.keyField(collectionId)]: docIdOrCondition };
        } else { // update by condition
            idorCondition = docIdOrCondition;
        }
        // execute
        this.sqlService.update(collectionId, data, idorCondition);
    }

    update(updates: {[key: string]: any}) {
        for (const path of Object.keys(updates)) {
            const data = updates[path];
            // process the path
            const [collectionId, docId = null, ... paths] = path.split('/').filter(Boolean);
            // save
            // TODO: update the data using paths
            this.updateDoc(collectionId, data, docId);
        }
    }

}
