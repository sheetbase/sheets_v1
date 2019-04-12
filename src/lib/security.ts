import { RouteRequest } from '@sheetbase/server';

import { SheetsService } from './sheets';
import { RefService } from './ref';
import { DataSnapshot } from './snapshot';

export class SecurityService {
    private Sheets: SheetsService;

    private req: RouteRequest = {
        query: {},
        params: {},
        body: {},
    };
    private auth: any = null;

    constructor(Sheets?: SheetsService) {
        this.Sheets = Sheets;
    }

    setRequest(request: RouteRequest) {
        // req object
        this.req = request;
        // auth object
        const AuthToken = this.Sheets.options.AuthToken;
        const idToken = !!request ? (
            request.query['idToken'] || request.body['idToken']
        ) : null;
        if (!!idToken && !!AuthToken) {
            this.auth = AuthToken.decodeIdToken(idToken);
        }
    }

    checkpoint(
        permission: ('read' | 'write' ),
        paths: string[],
        ref?: RefService,
        item: any = null,
        data: any = null,
    ) {
        // read
        if (
            permission === 'read' &&
            !this.hasPermission('read', paths, ref)
        ) {
            throw new Error('No read permission.');
        }
        // write
        if (
            permission === 'write' &&
            !this.hasPermission('write', paths, ref, item, data)
        ) {
            throw new Error('No write permission.');
        }
    }

    private hasPermission(
        permission: ('read' | 'write'),
        paths: string[],
        ref?: RefService,
        item?: any,
        data?: any,
    ): boolean {
        const security = this.Sheets.options.security;
        // always when security is off
        if (!security) {
            return true;
        }
        // user claims has admin previledge
        if (!!this.auth && this.auth.isAdmin) {
            return true;
        }
        // execute rule
        const { rule, dynamicData } = this.parseRule(permission, paths);
        return (typeof rule === 'boolean') ? rule :
            this.executeRule(rule, ref, item, data, dynamicData);
    }

    private executeRule(
        rule: string,
        ref?: RefService,
        item?: any,
        data?: any,
        dynamicData: {[key: string]: string} = {},
    ) {
        const customHelpers = this.Sheets.options.securityHelpers;
        // sum up input
        const input = {
            now: new Date(),
            req: this.req, // req object
            auth: this.auth, // auth object
            root: new DataSnapshot(ref.root(), customHelpers),
            data: new DataSnapshot(ref, customHelpers), // current ref data
            newData: new DataSnapshot(item, customHelpers), // item after processed update data
            inputData: new DataSnapshot(data, customHelpers), // only update input data
            ... dynamicData,
        };
        const body = `
            Object.keys(input).map(function (k) {
                this[k] = input[k];
            });
            return (${rule});
        `;
        // run
        try {
            const executor = new Function('input', body);
            return executor(input);
        } catch (error) {
            return false;
        }
    }

    private parseRule(permission: ('read' | 'write' ), paths: string[]) {
        const security = this.Sheets.options.security;

        // prepare
        let rules = !!security ? security : { '.read': true, '.write': true };
        rules = (typeof rules === 'boolean') ? {} : rules;
        const latestRules: {} = {
            '.read': rules['.read'] || false,
            '.write': rules['.write'] || false,
        };
        const dynamicData = {};

        // get data
        for (let i = 0; i < paths.length; i++) {
            // current step values
            const path = paths[i];
            let dynamicKey: string;

            // set rules
            const nextRules = rules[path];
            if (!!nextRules && nextRules instanceof Object) {
                rules = nextRules;
            } else {
                // get latest dynamic key
                Object.keys(rules).map(k => {
                    dynamicKey = (k.substr(0, 1) === '$') ? k : null;
                });
                // if it have any dynamic key, use it
                const dynamicRules = rules[dynamicKey];
                if (!!dynamicRules && dynamicRules instanceof Object) {
                    rules = dynamicRules;
                } else {
                    rules = {};
                }
            }

            // set latestRules
            const { '.read': read, '.write': write } = rules as any;
            if (read === false || !!read) {
                latestRules['.read'] = read;
            }
            if (write === false || !!write) {
                latestRules['.write'] = write;
            }

            // set dynamicData
            if (!!dynamicKey) {
                dynamicData[dynamicKey] = path;
            }
        }

        // set rule
        const endedRule = rules['.' + permission];
        const rule = (endedRule === false || !!endedRule) ? endedRule : latestRules['.' + permission];

        // return data
        return { rule, dynamicData };
    }

}