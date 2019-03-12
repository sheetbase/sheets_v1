export type Filter = {[field: string]: any} | Query | {(item: any): boolean};
export interface Query {
    where: string;
    equal?: any;
}

export interface Intergration {
    AuthToken?: any;
}

export interface Extendable {
    keyFields?: {
        [sheetName: string]: string;
    };
    security?: boolean | {};
}

export interface Options extends Extendable, Intergration {
    databaseId: string;
}