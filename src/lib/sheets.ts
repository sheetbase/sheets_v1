import { AddonRoutesOptions, RoutingErrors, RouteHandler } from '@sheetbase/server';

import {
    Options,
    Extendable,
    Intergration,
    Filter,
    Query,
    AdvancedFilter,
    Database,
    DocsContentStyles,
} from './types';
import { SecurityService } from './security';
import { RefService } from './ref';
import { buildQuery, buildAdvancedFilter } from './filter';

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

    data<Item>(sheetName: string) {
        return this.ref('/' + sheetName).toObject() as {[$key: string]: Item};
    }

    all<Item>(sheetName: string) {
        return this.ref('/' + sheetName).toArray() as Item[];
    }

    query<Item>(sheetName: string, filter: Filter) {
        let advancedFilter: AdvancedFilter;
        if (filter instanceof Function) {
            advancedFilter = filter;
        } else {
            advancedFilter = buildAdvancedFilter(
                buildQuery(filter),
            );
        }
        return this.ref('/' + sheetName).query(advancedFilter) as Item[];
    }

    items<Item>(sheetName: string, filter?: Filter) {
        return !!filter ? this.query<Item>(sheetName, filter) : this.all<Item>(sheetName);
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

    set<Data>(sheetName: string, key: string, data: Data) {
        return this.ref('/' + sheetName + (!!key ? ('/' + key) : '')).set(data);
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
        increasing: string | string[] | {[path: string]: number},
    ) {
        return this.ref('/' + sheetName + (!!key ? ('/' + key) : '')).increase(increasing);
    }

    content(docId: string, styles: DocsContentStyles = 'clean') {
        DriveApp.getStorageUsed(); // trigger authorization

        // cache
        const cacheService = CacheService.getScriptCache();
        const cacheKey = 'content_' + docId + '_' + styles;

        // get content
        let content = '';
        const cachedContent = cacheService.get(cacheKey);
        if (!!cachedContent) {
            content = cachedContent;
        } else {
            // fetch
            const url = 'https://www.googleapis.com/drive/v3/files/' + docId + '/export?mimeType=text/html';
            const response = UrlFetchApp.fetch(url, {
                method: 'get',
                headers: {
                    Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
                },
                muteHttpExceptions:true,
            });
            // finalize content
            if (!!response && response.getResponseCode() === 200) {
                const html = response.getContentText();
                // original
                content = html || '';
                // full & clean
                if (styles !== 'original') {

                    // extract content, between: </head></html>
                    const contentMatch = html.match(/\<\/head\>(.*)\<\/html\>/);
                    if (!!contentMatch) {
                        content = contentMatch.pop();
                    }

                    // clean up
                    content = content
                        .replace(/\<body(.*?)\>/, '') // replace: <body...>
                        .replace('</body>', '') // replace </body>
                        .replace(/\<script(.*?)\<\/script\>/g, '') // remove all script tag
                        .replace(/\<style(.*?)\<\/style\>/g, ''); // remove all style tag

                    // replace redirect links
                    const links = content.match(/\"https\:\/\/www\.google\.com\/url\?q\=(.*?)\"/g);
                    if (!!links) {
                        for (let i = 0, l = links.length; i < l; i++) {
                            const link = links[i];
                            const urlMatch = link
                                .match(/\"https\:\/\/www\.google\.com\/url\?q\=(.*?)\&amp\;/);
                            if (!!urlMatch) {
                                const url = urlMatch.pop();
                                content = content.replace(link, '"' + url + '"');
                            }
                        }
                    }

                    // clean
                    if (styles === 'clean') {
                        // remove all attributes
                        const removeAttrs = ['style', 'id', 'class', 'width', 'height'];
                        for (let i = 0, l = removeAttrs.length; i < l; i++) {
                            content = content.replace(
                                new RegExp('\ ' + removeAttrs[i] + '\=\"(.*?)\"', 'g'),
                                '',
                            );
                        }
                    }
                }

                // save to cache
                try {
                    cacheService.put(cacheKey, content, 3600); // 1 hour
                } catch (error) {
                    // cache error (may be content larger 100K)
                }
            } else {
                throw new Error('Fetch failed.');
            }
        }

        // return content
        return content;
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
                // type
                type = 'list',
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
                } else if (type === 'object') {
                    result = this.data(sheetName);
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
                clean = false, // set or update
            } = req.body;
            const paths = path.split('/').filter(Boolean);
            const sheetName = table || sheet || paths[0];
            const itemKey = id || key || paths[1] || null;

            if (!sheetName) {
                return res.error('No path/table/sheet.');
            }

            try {
                if (!!increasing) {
                    this.increase(sheetName, itemKey, increasing);
                } else if (clean) {
                    this.set(sheetName, itemKey, data);
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

        router.get('/' + endpoint + '/content', ... middlewares, (req, res) => {
            const {
                docId,
                styles,
            } = req.query;

            if (!docId) {
                return res.error('No doc id.');
            }

            let result: any;
            try {
                const content = this.content(docId, styles);
                result = { docId, content };
            } catch (error) {
                return res.error(error);
            }
            return res.success(result);
        });

    }

}