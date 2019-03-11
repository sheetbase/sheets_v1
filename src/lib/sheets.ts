import { AddonRoutesOptions, RoutingErrors, RouteHandler } from '@sheetbase/core-server';

import { Options, Extendable, Intergration } from './types';
import { SecurityService } from './security';
import { DataService } from './data';

export class SheetsService {
    options: Options;
    Security: SecurityService;
    spreadsheet: any;

    database: {[sheetName: string]: any} = {};
    errors: RoutingErrors = {};

    constructor(options: Options) {
        this.options = { keyFields: {}, ... options };
        this.Security = new SecurityService(options);
        this.spreadsheet = SpreadsheetApp.openById(options.databaseId);
    }

    setIntegration<K extends keyof Intergration, Value>(key: K, value: Value): SheetsService {
        this.options[key] = value;
        return this;
    }

    extend(options: Extendable) {
        return new SheetsService({ ... this.options, ... options });
    }

    toAdmin() {
        return this.extend({ security: false });
    }

    ref(path = '/') {
        return new DataService(path.split('/').filter(Boolean), this);
    }

    key() {
        return this.ref().key();
    }

    all<Item>(sheet: string) {
        return this.ref('/' + sheet).toArray() as Item[];
    }

    query<Item>(sheet: string, filter: (item: Item) => boolean) {
        return this.ref('/' + sheet).query(filter) as Item[];
    }

    item<Item>(sheet: string, key: string) {
        return this.ref('/' + sheet + '/' + key).toObject() as Item;
    }

    add<Data>(sheet: string, key: string, data: Data) {
        return this.ref('/' + sheet + (!!key ? ('/' + key) : '')).update(data);
    }

    update<Data>(sheet: string, key: string, data: Data) {
        return this.ref('/' + sheet + '/' + key).update(data);
    }

    remove(sheet: string, key: string) {
        return this.ref('/' + sheet + '/' + key).update(null);
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

        });

        router.post('/' + endpoint, ... middlewares, (req, res) => {

        });

        router.put('/' + endpoint, ... middlewares, (req, res) => {

        });

        router.patch('/' + endpoint, ... middlewares, (req, res) => {

        });

        router.delete('/' + endpoint, ... middlewares, (req, res) => {

        });

    }

}