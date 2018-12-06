export interface Options {
    databaseId?: string;

    // nosql
    keyFields?: {
        [collectionId: string]: string;
    };
}
