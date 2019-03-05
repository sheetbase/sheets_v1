import * as Sheets from './public_api';

// create sheets instance
function load_() {
    const databaseId = '1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI';
    return Sheets.sheets({
        databaseId,
        keyFields: { foo: 'slug' },
        searchFields: { foo: ['content'] },
        securityRules: {
            foo: {'.read': true, '.write': true},
            bar: {'.read': true, '.write': true},
        },
    });
}

// get all items from 'foo' table
export function example1(): void {
    const Sheets = load_();

    const all = Sheets.all('foo');
    Logger.log(all);
}

// get item eith the # of 3 from 'foo' table
export function example2(): void {
    const Sheets = load_();

    const item = Sheets.item('foo', 3);
    Logger.log(item);
}

// update item with # of 6
export function example3(): void {
    const Sheets = load_();

    Sheets.update('foo', { content: (new Date()).getTime() }, 6);
    Logger.log('foo-6 updated.');
}

// create foo-8
export function example4(): void {
    const Sheets = load_();

    Sheets.update('foo', { slug: 'foo-8', title: 'Foo 8', content: (new Date()).getTime() });
    Logger.log('foo-8 added.');
}

// get all item of 'foo' collection
// get content of foo-2 as a list
export function example5(): void {
    const Sheets = load_();

    // all
    const collection = Sheets.collection('foo');
    // a list
    const list = Sheets.list('/foo/foo-2/content');
    Logger.log(collection);
    Logger.log(list);
}

// get item foo-3
export function example6(): void {
    const Sheets = load_();

    const doc = Sheets.doc('foo', 'foo-3');
    const object = Sheets.object('/foo/foo-3');
    Logger.log(doc);
    Logger.log(object);
}

// update foo-6
export function example7(): void {
    const Sheets = load_();

    Sheets.updates({
        '/foo/foo-6/content': (new Date()).getTime(),
    });
    Logger.log('foo-6 updated');
}

// create foo-8
export function example8(): void {
    const Sheets = load_();

    Sheets.updates({
        '/foo': { slug: 'foo-8', title: 'Foo 8', content: (new Date()).getTime() },
    });
    Logger.log('foo-8 added');
}

// search 'foo' for 'me'
export function example9(): void {
    const Sheets = load_();

    const search = Sheets.search('foo', 'me');
    Logger.log(search);
}
