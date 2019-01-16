export interface Options {
    databaseId: string;
    keyFields?: {
        [sheetName: string]: string;
    };
    searchFields?: {
        [sheetName: string]: string[];
    };

    // security
    admin?: boolean;
    securityRules?: {};

    // intergration
    AuthToken?: any; // decodeIdToken();
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
