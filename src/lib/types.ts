import { DataSnapshot } from './snapshot';

export type AdvancedFilter = (item: any) => boolean;
export type ShorthandEqual = {[field: string]: any};
export type Filter = ShorthandEqual | Query | AdvancedFilter;
export interface Query {
    where: string;
    equal?: any;
    exists?: true;
    contains?: string;
    lt?: number;
    lte?: number;
    gt?: number;
    gte?: number;
    childExists?: any;
    childEqual?: string;
}

export interface SecurityHelpers {
    [name: string]: (snapshot: DataSnapshot) => any;
}

export interface Intergration {
    AuthToken?: any;
}

export interface Extendable {
    keyFields?: {
        [sheetName: string]: string;
    };
    security?: boolean | {};
    securityHelpers?: SecurityHelpers;
}

export interface Options extends Extendable, Intergration {
    databaseId: string;
}

export interface Database {
    [sheetName: string]: {
        [key: string]: any;
    };
}