export interface Options {
    databaseId?: string;
    keyFields?: {
        [sheetName: string]: string;
    };

    // security
    admin?: boolean;
}
