export interface Options extends SpreadsheetOptions, SpreadsheetOptions, NoSQLOptions {}

export interface CommonOptions {
    databaseId?: string;
}

export interface SpreadsheetOptions extends CommonOptions {}

export interface SQLOptions extends CommonOptions {}

export interface NoSQLOptions extends CommonOptions {
    keyFields?: {
        [collectionId: string]: string;
    };
}