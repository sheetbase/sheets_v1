import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import * as TamotsuX from '@sheetbase/tamotsux-server';

import { sheetsSQL } from '../src/public_api';

const SheetsSQL = sheetsSQL({
    databaseId: 'database_id_xxx',
    keyFields: { foo: 'slug' },
    searchFields: { bar: ['content'] },
    securityRules: { '.read': true, '.write': true },
});

let defineStub: sinon.SinonStub;
let sheetNamesStub: sinon.SinonStub;
let modelStub: sinon.SinonStub;
let allStub: sinon.SinonStub;
let itemStub: sinon.SinonStub;

function buildStubs() {
    defineStub = sinon.stub(TamotsuX.Table, 'define');
    // @ts-ignore
    sheetNamesStub = sinon.stub(SheetsSQL.spreadsheetService, 'sheetNames');
    modelStub = sinon.stub(SheetsSQL, 'model');
    allStub = sinon.stub(SheetsSQL, 'all');
    itemStub = sinon.stub(SheetsSQL, 'item');
}

function restoreStubs() {
    defineStub.restore();
    sheetNamesStub.restore();
    modelStub.restore();
    allStub.restore();
    itemStub.restore();
}

describe('(SQL) .options', () => {

    it('should have default values', () => {
        const SheetsSQL = sheetsSQL();
        // @ts-ignore
        expect(SheetsSQL.options).to.eql({
            keyFields: {},
            searchFields: {},
        });
    });

    it('should have values', () => {
        const options = {
            databaseId: 'database_id_xxx',
            keyFields: { foo: 'some_key' },
            searchFields: { foo: ['content'] },
        };
        const SheetsSQL = sheetsSQL(options);
        // @ts-ignore
        expect(SheetsSQL.options).to.eql(options);
    });

});

describe('(SQL) model methods (#models, #model)', () => {

    beforeEach(() => {
        buildStubs();
        modelStub.restore();
    });
    afterEach(() => restoreStubs());

    it('#models should works', () => {
        // @ts-ignore
        defineStub.callsFake(() => true);
        sheetNamesStub.onFirstCall().returns({ main: ['foo', 'bar'] } as any);

        const result = SheetsSQL.models();
        expect(result).to.eql({ foo: true, bar: true });
    });

    it('#model should works', () => {
        // @ts-ignore
        defineStub.callsFake(options => options);

        const result = SheetsSQL.model('foo');
        expect(result).to.eql({ sheetName: 'foo' });
    });

});

describe('(SQL) helper methods (#keyField, #processItems)', () => {

    it('#keyField should work', () => {
        const SheetsSQL = sheetsSQL({
            keyFields: {
                foo: 'key',
                bar: 'slug',
            },
        });
        const result1 = SheetsSQL.keyField('foo');
        const result2 = SheetsSQL.keyField('bar');
        const result3 = SheetsSQL.keyField('baz');
        expect(result1).to.equal('key');
        expect(result2).to.equal('slug');
        expect(result3).to.equal('#');
    });

    it('#processItems should remove items (private rows)', () => {
        const result = SheetsSQL.processItems('foo', [
            { '#': 1, slug: '_foo-1', title: 'Foo 1' },
            { '#': 2, slug: 'foo-2', title: 'Foo 2' },
            { '#': 3, slug: '_foo-3', title: 'Foo 3' },
        ]);
        expect(result).to.eql([
            { '#': 2, slug: 'foo-2', title: 'Foo 2' },
        ]);
    });

    it('#processItems should remove items (contains private column)', () => {
        const result = SheetsSQL.processItems('foo', [
            { '#': 1, slug: 'foo-1', title: 'Foo 1' },
            { '#': 2, slug: 'foo-2', _title: 'Foo 2' },
            { '#': 3, slug: 'foo-3', _title: 'Foo 3' },
        ]);
        expect(result).to.eql([
            { '#': 1, slug: 'foo-1', title: 'Foo 1' },
        ]);
    });
});

describe('(SQL) #all', () => {

    beforeEach(() => {
        buildStubs();
        allStub.restore();
    });
    afterEach(() => restoreStubs());

    it('return no item', () => {
        modelStub.onFirstCall().returns({ all: () => [] });

        const result = SheetsSQL.all('foo');
        expect(result).to.eql([]);
    });

    it('return items', () => {
        modelStub.onFirstCall().returns({
            all: () => [
                { '#': 1, title: 'Foo 1', content: 'xxx' },
                { '#': 2, title: 'Foo 2', content: '{"a":1,"b":2,"c":3}' },
            ],
        });

        const result = SheetsSQL.all('foo');
        expect(result).to.eql([
            { '#': 1, title: 'Foo 1', content: 'xxx' },
            { '#': 2, title: 'Foo 2', content: { a: 1, b: 2, c: 3 } },
        ]);
    });

});

describe('(SQL) #item', () => {

    beforeEach(() => {
        buildStubs();
        itemStub.restore();
    });
    afterEach(() => restoreStubs());

    it('should use right idOrCondition values', () => {
        modelStub.onFirstCall().returns({
            find: (id) => ({ id }), // prevent private column error
        });
        modelStub.onSecondCall().returns({
            where: (condition) => ({ first: () => condition }),
        });

        const result1 = SheetsSQL.item('foo', 1);
        const result2 = SheetsSQL.item('foo', { slug: 'foo-1' });
        expect(result1).to.eql({ id: 1 });
        expect(result2).to.eql({ slug: 'foo-1' });
    });

    it('should find by id, but not exists', () => {
        modelStub.onFirstCall().returns({
            // tamotsux find() throw error if no item=id
            find: (id) => { throw null; },
        });

        const result = SheetsSQL.item('foo', 0);
        expect(result).to.equal(null);
    });

    it('should find by condition, but not exists', () => {
        modelStub.onFirstCall().returns({
            where: (condition) => ({ first: () => null }),
        });

        const result = SheetsSQL.item('foo', { slug: 'foo-x' });
        expect(result).to.equal(null);
    });

    it('should find by id', () => {
        modelStub.onFirstCall().returns({
            find: (id) => ({ '#': 1, title: 'Foo 1', content: '{"a":1,"b":2}' }),
        });

        const result = SheetsSQL.item('foo', 1);
        expect(result).to.eql({ '#': 1, title: 'Foo 1', content: { a: 1, b: 2 } });
    });

    it('should find by condition', () => {
        modelStub.onFirstCall().returns({
            where: (condition) => ({
                first: () => ({ '#': 1, title: 'Foo 1', content: 'xxx' }),
            }),
        });

        const result = SheetsSQL.item('foo', { slug: 'foo-1' });
        expect(result).to.eql({ '#': 1, title: 'Foo 1', content: 'xxx' });
    });

});

describe('(SQL) #query', () => {

    beforeEach(() => buildStubs());
    afterEach(() => restoreStubs());

    it('should using { where }', () => {
        modelStub.onFirstCall().returns({
            where: (where) => ({
                all: () => [],
            }),
        });

        const result = SheetsSQL.query('foo', {
            where: { x: 'xx' },
        });
        expect(result).to.eql([]);
    });

    it('should using { orderBy, order }', () => {
        modelStub.onFirstCall().returns({
            order: (order) => ({
                all: () => [],
            }),
        });

        const result = SheetsSQL.query('foo', {
            orderBy: 'xxx',
        });
        expect(result).to.eql([]);
    });

    it('should using { limit, offset }', () => {
        modelStub.onFirstCall().returns({
            all: () => [
                { '#': 1 },
                { '#': 2 },
                { '#': 3 },
                { '#': 4 },
                { '#': 5 },
            ],
        });
        modelStub.onSecondCall().returns({
            all: () => [
                { '#': 1 },
                { '#': 2 },
                { '#': 3 },
                { '#': 4 },
                { '#': 5 },
            ],
        });

        const result1 = SheetsSQL.query('foo', {
            limit: 3,
        });
        const result2 = SheetsSQL.query('foo', {
            limit: 3, offset: 2,
        });
        expect(result1).to.eql([
            { '#': 1 },
            { '#': 2 },
            { '#': 3 },
        ]);
        expect(result2).to.eql([
            { '#': 3 },
            { '#': 4 },
            { '#': 5 },
        ]);
    });

});

describe('(SQL) #search', () => {

    beforeEach(() => buildStubs());
    afterEach(() => restoreStubs());

    it('should return no items', () => {
        allStub.onFirstCall().returns([]);

        const result = SheetsSQL.search('foo', 'xxx');
        expect(result).to.eql([]);
    });

    it('should return items', () => {
        allStub.onFirstCall().returns([
            { '#': 1, title: 'Lorem ipsum' },
            { '#': 2, title: 'Dolat init' },
            { '#': 3, title: 'Foo ipsum' },
            { '#': 4, title: 'Blah blah blah' },
            { '#': 5, title: 'Ipsum lorem' },
        ]);

        const result = SheetsSQL.search('foo', 'ipsum');
        expect(result).to.eql([
            { '#': 1, title: 'Lorem ipsum' },
            { '#': 3, title: 'Foo ipsum' },
            { '#': 5, title: 'Ipsum lorem' },
        ]);
    });

    it('should return items (custom fields)', () => {
        allStub.onFirstCall().returns([
            { '#': 1, content: 'Lorem ipsum' },
            { '#': 2, title: 'Dolat init' },
            { '#': 3, content: 'Bar ipsum' },
            { '#': 4, title: 'Blah blah blah' },
            { '#': 5, xxx: 'Ipsum lorem' },
        ]);

        const result = SheetsSQL.search('bar', 'ipsum');
        expect(result).to.eql([
            { '#': 1, content: 'Lorem ipsum' },
            { '#': 3, content: 'Bar ipsum' },
        ]);
    });

});

describe('(SQL) #update (correct id)', () => {

    let recorder: any;

    beforeEach(() => {
        buildStubs();
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { recorder = data; },
        });
    });
    afterEach(() => restoreStubs());

    it('should not have id', () => {
        SheetsSQL.update('foo', { slug: 'xxx' });
        expect(recorder['#']).to.equal(undefined);
    });

    it('should not have id (id provided but no coresponding item)', () => {
        itemStub.onFirstCall().returns(null);

        SheetsSQL.update('foo', { slug: 'xxx' }, 1);
        expect(recorder['#']).to.equal(undefined);
    });

    it('should not have id (condition provided but no coresponding item)', () => {
        itemStub.onFirstCall().returns(null);

        SheetsSQL.update('foo', { slug: 'xxx' }, { slug: 'foo-1' });
        expect(recorder['#']).to.equal(undefined);
    });

    it('should have id (id provided and item exists)', () => {
        itemStub.onFirstCall().returns({ '#': 1 });

        SheetsSQL.update('foo', {}, 1);
        expect(recorder['#']).to.equal(1);
    });

    it('should have id (condition provided and item exists)', () => {
        itemStub.onFirstCall().returns({ '#': 2 });

        SheetsSQL.update('foo', {}, { slug: 'foo-2' });
        expect(recorder['#']).to.equal(2);
    });

});

describe('(SQL) #update (correct data, new item)', () => {

    let recorder: any;

    beforeEach(() => {
        buildStubs();
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { recorder = data; },
        });
    });
    afterEach(() => restoreStubs());

    it('should throw error (no key field)', () => {
        expect(
            SheetsSQL.update.bind(SheetsSQL, 'foo', {}),
        ).to.throw('New item must have the key field of "slug".');
    });

    it('should throw error (item exists with the key field)', () => {
        itemStub.onFirstCall().returns({ slug: 'foo-1' });

        expect(
            SheetsSQL.update.bind(SheetsSQL, 'foo', { slug: 'foo-1' }),
        ).to.throw('Item exist with slug=foo-1.');
    });

    it('should have correct data', () => {
        SheetsSQL.update('foo', { slug: 'xxx', a: 1, b: 2 });
        expect(recorder).to.eql({ slug: 'xxx', a: 1, b: 2 });
    });

});

describe('(SQL) #update (correct data, existing item)', () => {

    let recorder: any;

    beforeEach(() => {
        buildStubs();
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { recorder = data; },
        });
    });
    afterEach(() => restoreStubs());

    it('should have correct data', () => {
        itemStub.onFirstCall().returns({
            '#': 1, slug: 'foo-1', a: 1, b: 2,
        });

        SheetsSQL.update('foo', {
            '#': 100, // no
            slug: 'xxx', // no
            a: 100, // yes
            b: 200, // yes
            c: 3, // yes
        }, 1); // item with id=1 exists
        expect(recorder).to.eql({
            '#': 1, slug: 'foo-1', a: 100, b: 200, c: 3,
        });
    });

});

describe('(SQL) #registerRoutes', () => {

    it('#registerRoutes should work');

});
