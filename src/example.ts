import * as Sheets from './public_api';

function load_() {
    const databaseId = '1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI';
    return Sheets.sheets({
        databaseId,
        keyFields: { foo: 'slug' },
    });
}

export function example1(): void {
    const { SQL } = load_();

    // get all items from 'foo' table
    const all = SQL.all('foo');
    Logger.log(all);
}

export function example2(): void {
    const { SQL } = load_();

    // get item eith the # of 3 from 'foo' table
    const item = SQL.item('foo', 3);
    Logger.log(item);
}

export function example3(): void {
    const { SQL } = load_();

    // update item with # of 6
    SQL.update('foo', { content: (new Date()).getTime() }, 6);
    Logger.log('foo-6 updated using SQL.');
}

export function example4(): void {
    const { SQL } = load_();

    // create foo-8
    SQL.update('foo', { slug: 'foo-8', title: 'Foo 8', content: (new Date()).getTime() });
    Logger.log('foo-8 added using SQL.');
}

export function example5(): void {
    const { NoSQL } = load_();

    // get all item of 'foo' collection
    const collection = NoSQL.collection('foo');
    // get content of foo-2 as a list
    const list = NoSQL.list('/foo/foo-2/content');
    Logger.log(collection);
    Logger.log(list);
}

export function example6(): void {
    const { NoSQL } = load_();

    // get item foo-3
    const doc = NoSQL.doc('foo', 'foo-3');
    const object = NoSQL.object('/foo/foo-3');
    Logger.log(doc);
    Logger.log(object);
}

export function example7(): void {
    const { NoSQL } = load_();

    // update foo-6
    NoSQL.update({
        '/foo/foo-6/content': (new Date()).getTime(),
    });
    Logger.log('foo-6 updated using NoSQL.');
}

export function example8(): void {
    const { NoSQL } = load_();

    // create foo-8
    NoSQL.update({
        '/foo': { slug: 'foo-8', title: 'Foo 8', content: (new Date()).getTime() },
    });
    Logger.log('foo-8 added using NoSQL.');
}

export function example9(): void {
    const { SQL } = load_();

    const search = SQL.search('foo', 'me', { fields: ['content'] });
    Logger.log(search);
}
