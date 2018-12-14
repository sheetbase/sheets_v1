import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { sheetsNoSQL } from '../src/public_api';

global['SpreadsheetApp'] = {
    openById: () => null,
    getActive: () => null,
};

const SheetsNoSQL = sheetsNoSQL({
    databaseId: 'database_id_xxx',
    securityRules: { '.read': true },
});

let allStub: sinon.SinonStub;
let searchStub: sinon.SinonStub;
let updateStub: sinon.SinonStub;
let collectionStub: sinon.SinonStub;
let docStub: sinon.SinonStub;
let objectStub: sinon.SinonStub;
let updateDocStub: sinon.SinonStub;

function buildStubs() {
    // @ts-ignore
    allStub = sinon.stub(SheetsNoSQL.sqlService, 'all');
    // @ts-ignore
    searchStub = sinon.stub(SheetsNoSQL.sqlService, 'search');
    // @ts-ignore
    updateStub = sinon.stub(SheetsNoSQL.sqlService, 'update');
    collectionStub = sinon.stub(SheetsNoSQL, 'collection');
    docStub = sinon.stub(SheetsNoSQL, 'doc');
    objectStub = sinon.stub(SheetsNoSQL, 'object');
    updateDocStub = sinon.stub(SheetsNoSQL, 'updateDoc');
}

function restoreStubs() {
    allStub.restore();
    searchStub.restore();
    updateStub.restore();
    collectionStub.restore();
    docStub.restore();
    objectStub.restore();
    updateDocStub.restore();
}

describe('(NoSQL) helper methods (#key)', () => {

    it('#key should work', () => {
        const result = SheetsNoSQL.key();
        expect(!!result).to.equal(true);
        expect(typeof result).to.equal('string');
    });

});

describe('(NoSQL) #collection', () => {

    beforeEach(() => {
        buildStubs();
        collectionStub.restore();
    });
    afterEach(() => restoreStubs());

    it('should return no items', () => {
        allStub.onFirstCall().returns([]);

        const result = SheetsNoSQL.collection('foo');
        expect(result).to.eql([]);
    });

    it('should return no items, as object', () => {
        allStub.onFirstCall().returns([]);

        const result = SheetsNoSQL.collection('foo', true);
        expect(result).to.eql({});
    });

    it('should return items', () => {
        allStub.onFirstCall().returns([
            {'#': 1, title: 'Foo 1'},
            {'#': 2, title: 'Foo 2'},
        ]);

        const result = SheetsNoSQL.collection('foo');
        expect(result).to.eql([
            {'#': 1, title: 'Foo 1'},
            {'#': 2, title: 'Foo 2'},
        ]);
    });

    it('should return items, as object', () => {
        allStub.onFirstCall().returns([
            {'#': 1, title: 'Foo 1'},
            {'#': 2, title: 'Foo 2'},
        ]);

        const result = SheetsNoSQL.collection('foo', true);
        expect(result).to.eql({
            1: {'#': 1, title: 'Foo 1'},
            2: {'#': 2, title: 'Foo 2'},
        });
    });

});

describe('(NoSQL) #doc', () => {

    beforeEach(() => {
        buildStubs();
        docStub.restore();
    });
    afterEach(() => restoreStubs());

    it('should return null when item is not exists', () => {
        collectionStub.onFirstCall().returns({});

        const result = SheetsNoSQL.doc('foo', '1');
        expect(result).to.equal(null);
    });

    it('should return item when exists', () => {
        collectionStub.onFirstCall().returns({
            1: {'#': 1, title: 'Foo 1'},
            2: {'#': 2, title: 'Foo 2'},
        });

        const result = SheetsNoSQL.doc('foo', '1');
        expect(result).to.eql({'#': 1, title: 'Foo 1'});
    });

});

describe('(NoSQL) #object', () => {

    beforeEach(() => {
        buildStubs();
        objectStub.restore();
    });
    afterEach(() => restoreStubs());

    it('should return collection as object (no docId)', () => {
        collectionStub.onFirstCall().returns({});

        const result = SheetsNoSQL.object('/foo');
        expect(result).to.eql({});
    });

    it('should return no item (has docId, but item not exists)', () => {
        docStub.onFirstCall().returns(null);

        const result = SheetsNoSQL.object('/foo/foo-1');
        expect(result).to.equal(null);
    });

    it('should return the item', () => {
        docStub.onFirstCall().returns({ '#': 1, slug: 'foo-1', title: 'Foo 1' });

        const result = SheetsNoSQL.object('/foo/foo-1');
        expect(result).to.eql({ '#': 1, slug: 'foo-1', title: 'Foo 1' });
    });

    it('should return data (deep)', () => {
        docStub.onFirstCall().returns({ '#': 1, slug: 'foo-1', title: 'Foo 1' });
        docStub.onSecondCall().returns({ '#': 1, slug: 'foo-1', content: {a: {a1: 1, a2: 2}, b: 2} });
        docStub.onThirdCall().returns({ '#': 1 });

        const result1 = SheetsNoSQL.object('/foo/foo-1/title');
        const result2 = SheetsNoSQL.object('/foo/foo-1/content/a');
        const result3 = SheetsNoSQL.object('/foo/foo-1/title');
        expect(result1).to.equal('Foo 1');
        expect(result2).to.eql({a1: 1, a2: 2});
        expect(result3).to.equal(null);
    });

});

describe('(NoSQL) #list', () => {

    beforeEach(() => buildStubs());
    afterEach(() => restoreStubs());

    it('should return empty list (no data)', () => {
        objectStub.onFirstCall().returns(null);

        const result = SheetsNoSQL.list('/');
        expect(result).to.eql([]);
    });

    it('should return list of one item for primitive value', () => {
        objectStub.onFirstCall().returns('a string');

        const result = SheetsNoSQL.list('/');
        expect(result).to.eql([{ $key: 'value', value: 'a string' }]);
    });

    it('should return list of items for array value', () => {
        objectStub.onFirstCall().returns([1,2,3]);

        const result = SheetsNoSQL.list('/');
        expect(result).to.eql([
            { $key: '0', value: 1 },
            { $key: '1', value: 2 },
            { $key: '2', value: 3 },
        ]);
    });

    it('should return list of items', () => {
        objectStub.onFirstCall().returns({a: 1});
        objectStub.onSecondCall().returns({b: {b1: 1, b2: 2}});

        const result1 = SheetsNoSQL.list('/');
        const result2 = SheetsNoSQL.list('/');
        expect(result1).to.eql([{ $key: 'a', value: 1 }]);
        expect(result2).to.eql([{ $key: 'b', b1: 1, b2: 2 }]);
    });

});

describe('(NoSQL) #query', () => {

    it('#query should work');

});

describe('(NoSQL) #search', () => {

    beforeEach(() => buildStubs());
    afterEach(() => restoreStubs());

    it('should forward search to SQL#search', () => {
        const value = [{ '#': 1, slug: 'foo-1', title: 'Foo 1' }];
        searchStub.onFirstCall().returns(value);

        const result = SheetsNoSQL.search('foo', 'search me');
        expect(result).to.eql(value);
    });

});

describe('(NoSQL) #updateDoc', () => {

    beforeEach(() => {
        buildStubs();
        updateDocStub.restore();
    });
    afterEach(() => restoreStubs());

    it('should forward SQL#update correct values when no idOrCondition', () => {
        let result;
        updateStub.callsFake((collectionId, data, idOrCondition) => {
            result = {collectionId, data, idOrCondition};
        });

        SheetsNoSQL.updateDoc('foo', {});
        expect(result).to.eql({
            collectionId: 'foo',
            data: {},
            idOrCondition: null,
        });
    });

    it('should forward SQL#update correct values when get item by id', () => {
        let result;
        updateStub.callsFake((collectionId, data, idOrCondition) => {
            result = {collectionId, data, idOrCondition};
        });

        SheetsNoSQL.updateDoc('foo', { a: 1}, 1);
        expect(result).to.eql({
            collectionId: 'foo',
            data: { a: 1 },
            idOrCondition: 1,
        });
    });

    it('should forward SQL#update correct values when get item by key', () => {
        let result;
        updateStub.callsFake((collectionId, data, idOrCondition) => {
            result = {collectionId, data, idOrCondition};
        });

        SheetsNoSQL.updateDoc('foo', {}, 'foo-1');
        expect(result).to.eql({
            collectionId: 'foo',
            data: {},
            idOrCondition: { '#': 'foo-1' }, // default key field = #
        });
    });

    it('should forward SQL#update correct values when get item by condition', () => {
        let result;
        updateStub.callsFake((collectionId, data, idOrCondition) => {
            result = {collectionId, data, idOrCondition};
        });

        SheetsNoSQL.updateDoc('foo', {}, { slug: 'foo-1' });
        expect(result).to.eql({
            collectionId: 'foo',
            data: {},
            idOrCondition: { slug: 'foo-1' },
        });
    });

});

describe('(NoSQL) #update', () => {

    beforeEach(() => buildStubs());
    afterEach(() => restoreStubs());

    it('should forward correct values', () => {
        const result = [];
        updateDocStub.callsFake((collectionId, data, docId) => {
            result.push({collectionId, data, docId});
        });

        SheetsNoSQL.update({
            '/foo': {},
            '/bar/bar-1': { title: 'Bar x1' },
        });
        expect(result).to.eql([
            { collectionId: 'foo', data: {}, docId: null },
            { collectionId: 'bar', data: { title: 'Bar x1' }, docId: 'bar-1' },
        ]);
    });

    it('should forward correct values with deep path, but item not exists', () => {
        const result = [];
        updateDocStub.callsFake((collectionId, data, docId) => {
            result.push({collectionId, data, docId});
        });
        docStub.onFirstCall().returns(null);
        docStub.onSecondCall().returns(null);

        SheetsNoSQL.update({
            '/foo/foo-1/title': 'Foo 1',
            '/bar/bar-1/content': { a: 1, b: 2 },
        });
        expect(result).to.eql([
            { collectionId: 'foo', docId: 'foo-1', data: { title: 'Foo 1' } },
            { collectionId: 'bar', docId: 'bar-1', data: { content: { a: 1, b: 2 } } },
        ]);
    });

    it('should forward correct values with deep path, and item exists', () => {
        const result = [];
        updateDocStub.callsFake((collectionId, data, docId) => {
            result.push({collectionId, data, docId});
        });
        docStub.onFirstCall().returns({ x: 'xxx' });
        docStub.onSecondCall().returns({ x2: 'xxx2' });

        SheetsNoSQL.update({
            '/foo/foo-1/title': 'Foo 1',
            '/bar/bar-1/content': { a: 1, b: 2 },
        });
        expect(result).to.eql([
            { collectionId: 'foo', docId: 'foo-1', data: { x: 'xxx', title: 'Foo 1' } },
            { collectionId: 'bar', docId: 'bar-1', data: { x2: 'xxx2', content: { a: 1, b: 2 } } },
        ]);
    });

});

describe('(NoSQL) #registerRoutes', () => {

    it('#registerRoutes should work');

});
