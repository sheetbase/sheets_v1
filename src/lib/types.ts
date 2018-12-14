export interface Options {
    databaseId?: string;
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
    AuthToken?: any; // has decode() method;
}

export interface SheetSchema {
    name: string;
    description?: string;
    size?: number;
}
