import { Options } from './types';

interface Item {
    sheetName?: string;
    key?: string;
    data?: any;
    dataKey?: string;
}

export class SecurityService {
    private options: Options;

    constructor(options: Options = {}) {
        this.options = {
            admin: false,
            ... options,
        };
    }

    check(input: Item = {}) {
        // TODO: add rule based security
        // check private
        this.checkPrivate(input);
    }

    isPrivate(str: string): boolean {
        return this.options.admin ? false : str.substr(0, 1) === '_';
    }

    checkPrivate(input: Item = {}): void {
        if (this.options.admin) return; // bypass

        const { sheetName, key, data, dataKey } = input;

        // private sheet (start with _)
        if (sheetName && this.isPrivate(sheetName)) {
            throw new Error('Private sheet.');
        }

        // private item
        if (key && this.isPrivate(key)) {
            throw new Error('Private row.');
        }

        // remove private properties
        if (data) {
            if (data instanceof Object && !(data instanceof Array)) {
                for (const key of Object.keys(data)) {
                    if (this.isPrivate(key)) {
                        throw new Error('Data contain private properties.');
                    }
                }
            } else {
                if (!dataKey || this.isPrivate(dataKey)) {
                    throw new Error('Private column.');
                }
            }
        }
    }

}