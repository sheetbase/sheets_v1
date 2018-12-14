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
    encryptionKey?: string;
    securityRules?: {};
}
