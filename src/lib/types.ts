import { DataSnapshot } from './snapshot';

export type Filter<Item> = Query | AdvancedFilter<Item>;

export type AdvancedFilter<Item> = (item: Item) => boolean;

export type Query = ShorthandQuery | SingleQuery | MultiQuery;

export type ShorthandQuery = {[field: string]: any};

export interface SingleQuery {
  where: string;
  equal?: any;
  exists?: boolean;
  contains?: string;
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  childExists?: any;
  childEqual?: string;
}

export interface MultiQuery {
  and?: SingleQuery[];
  or?: SingleQuery[];
}

export type ListingOrder = 'asc' | 'desc';

export interface ListingFilter {
  order?: ListingOrder | ListingOrder[];
  orderBy?: string | string[];
  limit?: number; // +/- limit to first/last
  offset?: number;
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

export type DocsContentStyles = 'clean' | 'full' | 'original';

export type DataSegment = { [field: string]: any };