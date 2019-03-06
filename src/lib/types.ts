export interface Rules {
    '.read'?: any;
    '.write'?: any;
    [sheetName: string]: Rules;
}

export interface Intergration {
    AuthToken?: any; // decodeIdToken();
}

export interface Options extends Intergration {
    databaseId?: string;
    keyFields?: {
        [sheetName: string]: string;
    };
    searchFields?: {
        [sheetName: string]: string[];
    };

    // security
    admin?: boolean;
    securityRules?: Rules;
}

export interface SheetSchema {
    name: string;
    description?: string;
    size?: number;
}

export interface SQLQuery {
    where?: { [key: string]: any };
    orderBy?: string;
    order?: string;
    limit?: number;
    offset?: number;
}

export interface NoSQLQuery {
    limitToFirst?: number;
    limitToLast?: number;
    offset?: number;
    orderByKey?: string;
    equalTo?: any;
    order?: string;
}
