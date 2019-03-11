import { RouteRequest } from '@sheetbase/core-server';

import { Options } from './types';
import { DataService } from './data';

export class SecurityService {
    private options: Options;
    private apiRequest: RouteRequest;

    constructor(options?: Options) {
        this.options = { security: {}, ... options };
    }

    setRequest(reqquest: RouteRequest) {
        this.apiRequest = reqquest;
    }

    checkpoint(
        permission: ('read' | 'write' ),
        paths: string[],
        data?: DataService,
        newData: any = null,
    ) {
        // read
        if (
            permission === 'read' &&
            !this.hasPermission('read', paths, data)
        ) {
            throw new Error('No read permission.');
        }
        // write
        if (
            permission === 'write' &&
            !this.hasPermission('write', paths, data, newData)
        ) {
            throw new Error('No write permission.');
        }
    }

    private hasPermission(
        permission: ('read' | 'write'),
        paths: string[],
        data?: DataService,
        newData?: any,
    ): boolean {
        // always when security is off
        if (!this.options.security) {
            return true;
        }
        // execute rule
        const { rule, dynamicData } = this.parseRule(permission, paths);
        return (typeof rule === 'boolean') ? rule : this.executeRule(rule, data, newData, dynamicData);
    }

    private parseRule(permission: ('read' | 'write' ), paths: string[]) {
        let rules = !!this.options.security ? this.options.security : { '.read': true, '.write': true };
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

    private executeRule(
        rule: string,
        data?: DataService,
        newData?: any,
        dynamicData: {[key: string]: string} = {},
    ) {
        // auth object
        let auth = null;
        const { AuthToken } = this.options;
        const idToken = this.apiRequest ? (
            this.apiRequest.body['idToken'] || this.apiRequest.query['idToken']
        ) : null;
        if (idToken && AuthToken) {
            auth = AuthToken.decodeIdToken(idToken);
        }

        // sum up input
        const input = {
            now: new Date(),
            root: data.root(),
            data,
            newData,
            auth,
            ... dynamicData,
        };
        const body = `
            Object.keys(input).map(function (k) {
                this[k] = input[k];
            });
            return ${rule};
        `;

        // run
        try {
            const executor = new Function('input', body);
            return executor(input);
        } catch (error) {
            return false;
        }
    }

}