import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import * as TamotsuX from '@sheetbase/tamotsux-server';

import { sheets } from '../src/public_api';

const Sheets = sheets({
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
    sheetNamesStub = sinon.stub(Sheets.spreadsheetService, 'sheetNames');
    modelStub = sinon.stub(Sheets, 'model');
    allStub = sinon.stub(Sheets, 'all');
    itemStub = sinon.stub(Sheets, 'item');
}

function restoreStubs() {
    defineStub.restore();
    sheetNamesStub.restore();
    modelStub.restore();
    allStub.restore();
    itemStub.restore();
}

describe('.options', () => {

    it('should have default values', () => {
        const Sheets = sheets();
        // @ts-ignore
        expect(Sheets.options).to.eql({
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
        const Sheets = sheets(options);
        // @ts-ignore
        expect(Sheets.options).to.eql(options);
    });

});

describe('model methods (#models, #model)', () => {

    beforeEach(() => {
        buildStubs();
        modelStub.restore();
    });
    afterEach(() => restoreStubs());

    it('#models should works', () => {
        // @ts-ignore
        defineStub.callsFake(() => true);
        sheetNamesStub.onFirstCall().returns({ main: ['foo', 'bar'] } as any);

        const result = Sheets.models();
        expect(result).to.eql({ foo: true, bar: true });
    });

    it('#model should works', () => {
        // @ts-ignore
        defineStub.callsFake(options => options);

        const result = Sheets.model('foo');
        expect(result).to.eql({ sheetName: 'foo' });
    });

});

describe('helper methods (#keyField, #processItems)', () => {

    it('#keyField should work', () => {
        const Sheets = sheets({
            keyFields: {
                foo: 'key',
                bar: 'slug',
            },
        });
        const result1 = Sheets.keyField('foo');
        const result2 = Sheets.keyField('bar');
        const result3 = Sheets.keyField('baz');
        expect(result1).to.equal('key');
        expect(result2).to.equal('slug');
        expect(result3).to.equal('#');
    });

    it('#key should work', () => {
        const result = Sheets.key();
        expect(!!result).to.equal(true);
        expect(typeof result).to.equal('string');
    });

    it('#searchField should work', () => {
        const Sheets = sheets({
            searchFields: {
                foo: ['content'],
                bar: ['somewhere'],
            },
        });
        const result1 = Sheets.searchField('foo');
        const result2 = Sheets.searchField('bar');
        const result3 = Sheets.searchField('baz');
        expect(result1).to.eql(['content']);
        expect(result2).to.eql(['somewhere']);
        expect(result3).to.eql([]);
    });

    it('#processItems should remove items (private rows)', () => {
        const result = Sheets.processItems('foo', [
            { '#': 1, slug: '_foo-1', title: 'Foo 1' },
            { '#': 2, slug: 'foo-2', title: 'Foo 2' },
            { '#': 3, slug: '_foo-3', title: 'Foo 3' },
        ]);
        expect(result).to.eql([
            { '#': 2, slug: 'foo-2', title: 'Foo 2' },
        ]);
    });

    it('#processItems should remove items (contains private column)', () => {
        const result = Sheets.processItems('foo', [
            { '#': 1, slug: 'foo-1', title: 'Foo 1' },
            { '#': 2, slug: 'foo-2', _title: 'Foo 2' },
            { '#': 3, slug: 'foo-3', _title: 'Foo 3' },
        ]);
        expect(result).to.eql([
            { '#': 1, slug: 'foo-1', title: 'Foo 1' },
        ]);
    });
});

describe('#all', () => {

    beforeEach(() => {
        buildStubs();
        allStub.restore();
    });
    afterEach(() => restoreStubs());

    it('return no item', () => {
        modelStub.onFirstCall().returns({ all: () => [] });

        const result = Sheets.all('foo');
        expect(result).to.eql([]);
    });

    it('return items', () => {
        modelStub.onFirstCall().returns({
            all: () => [
                { '#': 1, title: 'Foo 1', content: 'xxx' },
                { '#': 2, title: 'Foo 2', content: '{"a":1,"b":2,"c":3}' },
            ],
        });

        const result = Sheets.all('foo');
        expect(result).to.eql([
            { '#': 1, title: 'Foo 1', content: 'xxx' },
            { '#': 2, title: 'Foo 2', content: { a: 1, b: 2, c: 3 } },
        ]);
    });

});

describe('#item', () => {

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

        const result1 = Sheets.item('foo', 1);
        const result2 = Sheets.item('foo', { slug: 'foo-1' });
        expect(result1).to.eql({ id: 1 });
        expect(result2).to.eql({ slug: 'foo-1' });
    });

    it('should find by id, but not exists', () => {
        modelStub.onFirstCall().returns({
            // tamotsux find() throw error if no item=id
            find: (id) => { throw null; },
        });

        const result = Sheets.item('foo', 0);
        expect(result).to.equal(null);
    });

    it('should find by condition, but not exists', () => {
        modelStub.onFirstCall().returns({
            where: (condition) => ({ first: () => null }),
        });

        const result = Sheets.item('foo', { slug: 'foo-x' });
        expect(result).to.equal(null);
    });

    it('should find by id', () => {
        modelStub.onFirstCall().returns({
            find: (id) => ({ '#': 1, title: 'Foo 1', content: '{"a":1,"b":2}' }),
        });

        const result = Sheets.item('foo', 1);
        expect(result).to.eql({ '#': 1, title: 'Foo 1', content: { a: 1, b: 2 } });
    });

    it('should find by condition', () => {
        modelStub.onFirstCall().returns({
            where: (condition) => ({
                first: () => ({ '#': 1, title: 'Foo 1', content: 'xxx' }),
            }),
        });

        const result = Sheets.item('foo', { slug: 'foo-1' });
        expect(result).to.eql({ '#': 1, title: 'Foo 1', content: 'xxx' });
    });

});

describe('#query', () => {

    beforeEach(() => buildStubs());
    afterEach(() => restoreStubs());

    it('should using { where }', () => {
        modelStub.onFirstCall().returns({
            where: (where) => ({
                all: () => [],
            }),
        });

        const result = Sheets.query('foo', {
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

        const result = Sheets.query('foo', {
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

        const result1 = Sheets.query('foo', {
            limit: 3,
        });
        const result2 = Sheets.query('foo', {
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

describe.skip('#search', () => {

    beforeEach(() => buildStubs());
    afterEach(() => restoreStubs());

    it('should return no items', () => {
        allStub.onFirstCall().returns([]);

        const result = Sheets.search('foo', 'xxx');
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

        const result = Sheets.search('foo', 'ipsum');
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

        const result = Sheets.search('bar', 'ipsum');
        expect(result).to.eql([
            { '#': 1, content: 'Lorem ipsum' },
            { '#': 3, content: 'Bar ipsum' },
        ]);
    });

});

describe('#update (correct id)', () => {

    let recorder: any;

    beforeEach(() => {
        buildStubs();
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { recorder = data; },
        });
    });
    afterEach(() => restoreStubs());

    it('should not have id', () => {
        Sheets.update('foo', { slug: 'xxx' });
        expect(recorder['#']).to.equal(undefined);
    });

    it('should not have id (id provided but no coresponding item)', () => {
        itemStub.onFirstCall().returns(null);

        Sheets.update('foo', { slug: 'xxx' }, 1);
        expect(recorder['#']).to.equal(undefined);
    });

    it('should not have id (condition provided but no coresponding item)', () => {
        itemStub.onFirstCall().returns(null);

        Sheets.update('foo', { slug: 'xxx' }, { slug: 'foo-1' });
        expect(recorder['#']).to.equal(undefined);
    });

    it('should have id (id provided and item exists)', () => {
        itemStub.onFirstCall().returns({ '#': 1 });

        Sheets.update('foo', {}, 1);
        expect(recorder['#']).to.equal(1);
    });

    it('should have id (condition provided and item exists)', () => {
        itemStub.onFirstCall().returns({ '#': 2 });

        Sheets.update('foo', {}, { slug: 'foo-2' });
        expect(recorder['#']).to.equal(2);
    });

});

describe('#update (correct data, new item)', () => {

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
            Sheets.update.bind(Sheets, 'foo', {}),
        ).to.throw('New item must have the key field of "slug".');
    });

    it('should throw error (item exists with the key field)', () => {
        itemStub.onFirstCall().returns({ slug: 'foo-1' });

        expect(
            Sheets.update.bind(Sheets, 'foo', { slug: 'foo-1' }),
        ).to.throw('Item exist with slug=foo-1.');
    });

    it('should have correct data', () => {
        Sheets.update('foo', { slug: 'xxx', a: 1, b: 2 });
        expect(recorder).to.eql({ slug: 'xxx', a: 1, b: 2 });
    });

});

describe('#update (correct data, existing item)', () => {

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

        Sheets.update('foo', {
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

describe('#delete', () => {

    beforeEach(() => buildStubs());
    afterEach(() => restoreStubs());

    it('should do nothing for no item', () => {
        let result;
        itemStub.onFirstCall().returns(null);
        modelStub.onFirstCall().returns({
            find: (id) => ({
                destroy: () => { result = true; },
            }),
        });
        Sheets.delete('foo', 1);
        expect(result).to.equal(undefined);
    });

    it('should delete the item', () => {
        let result;
        itemStub.onFirstCall().returns({ '#': 1 });
        modelStub.onFirstCall().returns({
            find: (id) => ({
                destroy: () => { result = true; },
            }),
        });
        Sheets.delete('foo', 1);
        expect(result).to.equal(true);
    });

});
