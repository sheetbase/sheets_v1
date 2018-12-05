import { o2a, a2o } from '@sheetbase/core-server';
import lodashGet from 'lodash-es/get';
import lodashSet from 'lodash-es/set';

import { NoSQLOptions } from './types';
import { SQLService } from './sql';

export class NoSQLService {
    private options: NoSQLOptions;
    private sqlService: SQLService;

    constructor(options: NoSQLOptions = {}) {
        this.sqlService = new SQLService(options);
        this.options = {
            keyFields: {},
            ... options,
        };
    }

    collection<Item>(collectionId: string, returnObject = false): {[key: string]: Item} | Item[] {
        let items: any = this.sqlService.all(collectionId);
        if (returnObject) {
            const keyField = this.options.keyFields[collectionId] || 'slug';
            items = a2o(items, keyField);
        }
        return items;
    }

    doc<Item>(collectionId: string, docId: string): Item {
        const items = this.collection(collectionId, true) as {[key: string]: Item};
        return items[docId];
    }

    object(path: string) {
        const [collectionId, docId, ... paths] = path.split('/').filter(Boolean);
        if (!docId) { // all items as object
            return this.collection(collectionId, true);
        } else {
            const item = this.doc(collectionId, docId);
            return lodashGet(item, paths);
        }
    }

    list(path: string): any[] {
        return o2a(this.object(path));
    }

    updateDoc(
        collectionId: string,
        data: {},
        docIdOrCondition?: string | {[field: string]: string},
    ): void {
        let id: number;
        let condition: {[field: string]: string};
        if (!docIdOrCondition) { // new
            id = null;
        } else if (typeof docIdOrCondition === 'string') { // update by doc id
            const keyField = this.options.keyFields[collectionId] || 'slug';
            condition = {[keyField]: docIdOrCondition};
        } else { // update by condition
            condition = docIdOrCondition;
        }
        // execute
        this.sqlService.update(collectionId, data, id || condition);
    }

    update(updates: {[key: string]: any}) {
        for (const path of Object.keys(updates)) {
            const data = updates[path];
            // process the path
            const [collectionId, docId, ... paths] = path.split('/').filter(Boolean);
            // save
            // TODO: update the data using paths
            this.updateDoc(collectionId, data, docId);
        }
    }

}
