import { RouteRequest } from '@sheetbase/core-server';

import { Options } from './types';

interface PrivateCheckInput {
    sheetName?: string;
    key?: string;
    data?: any;
    dataKey?: string;
}

export class SecurityService {
    private options: Options;
    private apiRequest: RouteRequest;

    constructor(options: Options = {}) {
        this.options = {
            admin: false,
            securityRules: {},
            ... options,
        };
    }

    setRequest(reqquest: RouteRequest) { this.apiRequest = reqquest; }

    addRules(rules: {}) {
        this.options.securityRules = {
            ... this.options.securityRules,
            ... rules,
        };
    }

    checkpoint(
        path: string,
        data?: any,
        newData?: any,
        permission = 'read',
    ) {
        // private check
        const [ sheetName, key, dataKey ] = path.split('/').filter(Boolean);
        const input: PrivateCheckInput = { sheetName, key, data, dataKey };
        this.checkPrivate(input);

        // rule based check
        if (permission === 'write') {
            this.checkWritePermission(path, data, newData);
        } else {
            this.checkReadPermission(path, data);
        }
    }

    /**
     * rule based
     */

    parseRule(path: string, permission = 'read') {
        const paths = path.split('/').filter(Boolean);

        let rules = this.options.securityRules;
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

    executeRule(
        rule: string,
        data?: any,
        newData?: any,
        dynamicData: {[key: string]: string} = {},
    ) {
        // auth object
        let auth = null;
        const { AuthToken } = this.options;
        const idToken = this.apiRequest ? (
            this.apiRequest.body['idToken'] ||
            this.apiRequest.query['idToken']
        ) : null;
        if (idToken && AuthToken) {
            auth = AuthToken.decodeIdToken(idToken);
        }

        // sum up input
        const input = {
            auth,
            now: (new Date()).getTime(),
            data,
            newData,
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

    hasPermission(
        permission: ('read' | 'write'),
        path: string,
        data?: any,
        newData?: any,
    ): boolean {
        if (this.options.admin) { return true; } // always for admin
        const { rule, dynamicData } = this.parseRule(path, permission);
        return (typeof rule === 'boolean') ? rule : this.executeRule(rule, data, newData, dynamicData);
    }

    hasReadPermission(path: string, data?: any) {
        return this.hasPermission('read', path, data);
    }
    hasWritePermission(path: string, data?: any, newData?: any) {
        return this.hasPermission('write', path, data, newData);
    }

    checkReadPermission(path: string, data?: any) {
        if (!this.hasReadPermission(path, data)) {
            throw new Error('No read permission.');
        }
    }
    checkWritePermission(path: string, data?: any, newData?: any) {
        if (!this.hasWritePermission(path, data, newData)) {
            throw new Error('No write permission.');
        }
    }

    /**
     * private
     */
    isPrivate(str: string) {
        return this.options.admin ? false : str.substr(0, 1) === '_';
    }

    isPrivateSheet(sheetName: string) {
        return sheetName && this.isPrivate(sheetName);
    }

    isPrivateRow(key: string) {
        return (key && this.isPrivate(key));
    }

    isPrivateColumn(data: any, dataKey?: string) {
        if (!data) { return false; }
        // process further
        let status = false;
        if (data instanceof Object && !(data instanceof Array)) {
            for (const key of Object.keys(data)) {
                if (this.isPrivate(key)) {
                    status = true;
                }
            }
        } else {
            if (!dataKey || this.isPrivate(dataKey)) {
                status = true;
            }
        }
        return status;
    }

    checkPrivate(input: PrivateCheckInput = {}): void {
        const { sheetName, key, data, dataKey } = input;
        if (this.isPrivateSheet(sheetName)) {
            throw new Error('Private sheet.');
        }
        if (this.isPrivateRow(key)) {
            throw new Error('Private row.');
        }
        if (this.isPrivateColumn(data, dataKey)) {
            throw new Error('Data contains private columns.');
        }
    }

}