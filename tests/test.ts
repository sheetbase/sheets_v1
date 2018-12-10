import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import * as TamotsuX from '@sheetbase/tamotsux-server';

import {
    sheets,
    spreadsheet,
    sheetsSQL,
    sheetsNoSQL,

    translateRangeValues,
    parseData,
    stringifyData,
} from '../src/public_api';
import { SecurityService } from '../src/lib/security';

import './polyfill'; // mocked global

const databaseId = '1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI';

/**
 * test start
 */

describe('Module', () => {
    const Sheets = sheets({ databaseId });
    const Spreadsheet = spreadsheet({ databaseId });
    const SheetsSQL = sheetsSQL({ databaseId });
    const SheetsNoSQL = sheetsNoSQL({ databaseId });

    it('Sheets service should be created', () => {
        expect(!!Sheets).to.equal(true);
    });

    it('Sheets service should have members', () => {
        expect(!!Sheets.Spreadsheet).to.equal(true);
        expect(!!Sheets.SQL).to.equal(true);
        expect(!!Sheets.NoSQL).to.equal(true);
    });

    it('Spreadsheet service should be created', () => {
        expect(!!Spreadsheet).to.equal(true);
    });

    it('SheetsSQL service should be created', () => {
        expect(!!SheetsSQL).to.equal(true);
    });

    it('SheetsNoSQL service should be created', () => {
        expect(!!SheetsNoSQL).to.equal(true);
    });

});

describe('Options', () => {
    it('.options should have default values', () => {
        const Spreadsheet = spreadsheet();
        const SheetsSQL = sheetsSQL();
        // @ts-ignore
        expect(Spreadsheet.options).to.eql({});
        // @ts-ignore
        expect(SheetsSQL.options).to.eql({ keyFields: {} });
    });

    it('.options should have values', () => {
        const Spreadsheet = spreadsheet({ databaseId: 'xxx' });
        const SheetsSQL = sheetsSQL({
            databaseId: 'xxx',
            keyFields: {
                foo: 'key',
            },
        });
        // @ts-ignore
        expect(Spreadsheet.options.databaseId).to.equal('xxx');
        // @ts-ignore
        expect(SheetsSQL.options.databaseId).to.equal('xxx');
        // @ts-ignore
        expect(SheetsSQL.options.keyFields).to.eql({ foo: 'key' });
    });

});

describe('Spreadsheet service', () => {
    const Spreadsheet = spreadsheet({ databaseId });

    let getActiveStub: sinon.SinonStub;
    let openByIdStub: sinon.SinonStub;
    let spreadsheetStub: sinon.SinonStub;
    let rangeStub: sinon.SinonStub;
    let sheetsStub: sinon.SinonStub;
    let sheetStub: sinon.SinonStub;

    beforeEach(() => {
        getActiveStub = sinon.stub(SpreadsheetApp, 'getActive');
        openByIdStub = sinon.stub(SpreadsheetApp, 'openById');
        spreadsheetStub = sinon.stub(Spreadsheet, 'spreadsheet');
        rangeStub = sinon.stub(Spreadsheet, 'range');
        sheetsStub = sinon.stub(Spreadsheet, 'sheets');
        sheetStub = sinon.stub(Spreadsheet, 'sheet');
    });

    afterEach(() => {
        getActiveStub.restore();
        openByIdStub.restore();
        spreadsheetStub.restore();
        rangeStub.restore();
        sheetsStub.restore();
        sheetStub.restore();
    });

    it('#spreadsheet SpreadsheetApp should use active spreadsheet is no databaseId', () => {
        getActiveStub.onFirstCall().returns('SpreadsheetApp.getActive()' as any);

        const Spreadsheet = spreadsheet();
        const result = Spreadsheet.spreadsheet();
        expect(result).to.equal('SpreadsheetApp.getActive()');
    });

    it('#spreadsheet SpreadsheetApp should use databaseId', () => {
        openByIdStub.onFirstCall().returns('SpreadsheetApp.openById()' as any);

        const Spreadsheet = spreadsheet({ databaseId });
        const result = Spreadsheet.spreadsheet();
        expect(result).to.equal('SpreadsheetApp.openById()');
    });

    it('#sheets should work', () => {
        spreadsheetStub.onFirstCall().returns({ getSheets: () => true });
        sheetsStub.restore();

        const result = Spreadsheet.sheets();
        expect(result).to.equal(true);
    });

    it('#sheet should work', () => {
        spreadsheetStub.callsFake(() => ({
            getActiveSheet: () => 'getActiveSheet()',
            getSheetByName: (name) => 'getSheetByName("' + name + '")',
        }));
        sheetStub.restore();

        const result1 = Spreadsheet.sheet();
        const result2 = Spreadsheet.sheet('foo');
        expect(result1).to.equal('getActiveSheet()');
        expect(result2).to.equal('getSheetByName("foo")');
    });

    it('#range should work', () => {
        spreadsheetStub.callsFake(() => ({
            getActiveRange: () => 'getActiveRange()',
            getRange: (notation) => 'getRange("' + notation + '")',
        }));
        rangeStub.restore();

        const result1 = Spreadsheet.range();
        const result2 = Spreadsheet.range('foo!A1');
        expect(result1).to.equal('getActiveRange()');
        expect(result2).to.equal('getRange("foo!A1")');
    });

    it('#getValues should work', () => {
        rangeStub.onFirstCall().returns({ getValues: () => true });

        const result = Spreadsheet.getValues();
        expect(result).to.equal(true);
    });

    it('#setValues should work', () => {
        rangeStub.onFirstCall().returns({ setValues: (values) => values });

        const result = Spreadsheet.setValues([1,2,3]);
        expect(result).to.eql([1,2,3]);
    });

    it('#sheetNames should work', () => {
        sheetsStub.onFirstCall().returns([
            { getName: () => 'foo' },
            { getName: () => 'bar' },
            { getName: () => '__taxonomies__' },
        ]);

        const result = Spreadsheet.sheetNames();
        expect(result).to.eql({
            all: ['foo', 'bar', '__taxonomies__'],
            main: ['foo', 'bar'],
            meta: ['__taxonomies__'],
        });
    });

    it('#lastCol should work', () => {
        sheetStub.onFirstCall().returns({ getLastColumn: () => 'G' });
        const result = Spreadsheet.lastCol('foo');
        expect(result).to.equal('G');
    });

    it('#lastRow should work', () => {
        sheetStub.onFirstCall().returns({ getLastRow: () => 77 });
        const result = Spreadsheet.lastRow('foo');
        expect(result).to.equal(77);
    });

});

describe('SQL service', () => {
    const SheetsSQL = sheetsSQL({
        databaseId,
        keyFields: { foo: 'slug' },
    });

    let defineStub: sinon.SinonStub;
    let sheetNamesStub: sinon.SinonStub;
    let modelStub: sinon.SinonStub;
    let itemStub: sinon.SinonStub;

    beforeEach(() => {
        defineStub = sinon.stub(TamotsuX.Table, 'define');
        // @ts-ignore
        sheetNamesStub = sinon.stub(SheetsSQL.spreadsheetService, 'sheetNames');
        modelStub = sinon.stub(SheetsSQL, 'model');
        itemStub = sinon.stub(SheetsSQL, 'item');
    });

    afterEach(() => {
        defineStub.restore();
        sheetNamesStub.restore();
        modelStub.restore();
        itemStub.restore();
    });

    it('#model should works', () => {
        // @ts-ignore
        defineStub.callsFake(options => options);
        modelStub.restore();

        const result = SheetsSQL.model('foo');
        expect(result).to.eql({ sheetName: 'foo' });
    });

    it('#model should show error (private table)', () => {
        modelStub.restore();

        expect(SheetsSQL.model.bind(SheetsSQL, '_foo')).to.throw('Private sheet.');
    });

    it('#models should works', () => {
        // @ts-ignore
        defineStub.callsFake(() => true);
        sheetNamesStub.onFirstCall().returns({ main: ['foo', 'bar'] } as any);

        const result = SheetsSQL.models();
        expect(result).to.eql({ foo: true, bar: true });
    });

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

    it('#processItems should work (remove private rows)', () => {
        const result = SheetsSQL.processItems('foo', [
            { '#': 1, slug: '_foo-1', title: 'Foo 1' },
            { '#': 2, slug: 'foo-2', title: 'Foo 2' },
            { '#': 3, slug: '_foo-3', title: 'Foo 3' },
        ]);
        expect(result).to.eql([
            { '#': 2, slug: 'foo-2', title: 'Foo 2' },
        ]);
    });

    it('#processItems should work (remove private - columns)', () => {
        const result = SheetsSQL.processItems('foo', [
            { '#': 1, slug: 'foo-1', title: 'Foo 1' },
            { '#': 2, slug: 'foo-2', _title: 'Foo 2' },
            { '#': 3, slug: 'foo-3', _title: 'Foo 3' },
        ]);
        expect(result).to.eql([
            { '#': 1, slug: 'foo-1', title: 'Foo 1' },
        ]);
    });

    it('#all should work (no item)', () => {
        modelStub.onFirstCall().returns({ all: () => [] });

        const result = SheetsSQL.all('foo');
        expect(result).to.eql([]);
    });

    it('#all should work', () => {
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

    it('#item should use right values', () => {
        modelStub.onFirstCall().returns({
            find: (id) => ({ id }), // prevent private column error
        });
        modelStub.onSecondCall().returns({
            where: (condition) => ({ first: () => condition }),
        });
        itemStub.restore();

        const result1 = SheetsSQL.item('foo', 1);
        const result2 = SheetsSQL.item('foo', { slug: 'foo-1' });
        expect(result1).to.eql({ id: 1 });
        expect(result2).to.eql({ slug: 'foo-1' });
    });

    it('#item should work (not exists, by id)', () => {
        modelStub.onFirstCall().returns({
            find: (id) => { throw null; },
        });
        itemStub.restore();

        const result = SheetsSQL.item('foo', 0);
        expect(result).to.equal(null);
    });

    it('#item should work (not exists, by condition)', () => {
        modelStub.onFirstCall().returns({
            where: (condition) => ({ first: () => null }),
        });
        itemStub.restore();

        const result = SheetsSQL.item('foo', { slug: 'foo-x' });
        expect(result).to.equal(null);
    });

    it('#item should work (by id)', () => {
        modelStub.onFirstCall().returns({
            find: (id) => ({ '#': 1, title: 'Foo 1', content: '{"a":1,"b":2}' }),
        });
        itemStub.restore();

        const result = SheetsSQL.item('foo', 1);
        expect(result).to.eql({ '#': 1, title: 'Foo 1', content: { a: 1, b: 2 } });
    });

    it('#item should work (by condition)', () => {
        modelStub.onFirstCall().returns({
            where: (condition) => ({
                first: () => ({ '#': 1, title: 'Foo 1', content: 'xxx' }),
            }),
        });
        itemStub.restore();

        const result = SheetsSQL.item('foo', { slug: 'foo-1' });
        expect(result).to.eql({ '#': 1, title: 'Foo 1', content: 'xxx' });
    });

    it('#item should throw error (private rows)', () => {
        modelStub.onFirstCall().returns({
            find: (id) => ({ '#': 1, slug: '_foo-1', title: 'Foo 1' }),
        });
        itemStub.restore();

        expect(SheetsSQL.item.bind(SheetsSQL, 'foo', 1)).to.throw('Private row.');
    });

    it('#item should throw error (private column)', () => {
        modelStub.onFirstCall().returns({
            find: (id) => ({ '#': 1, _title: 'Foo 1' }),
        });
        itemStub.restore();

        expect(SheetsSQL.item.bind(SheetsSQL, 'foo', 1)).to.throw('Data contain private properties.');
    });

    it('#update should has right data', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });

        SheetsSQL.update('foo', { title: 'Foo x' });
        expect(result).to.eql({ title: 'Foo x', '#': null });
    });

    it('#update should not allow # in data', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });

        SheetsSQL.update('foo', { '#': 1, title: 'Foo x' });
        expect(result).to.eql({ title: 'Foo x', '#': null });
    });

    it('#update should remove the key field', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });
        itemStub.onFirstCall().returns(true); // item exists

        SheetsSQL.update('foo', { slug: 'foo-1' }, 1);
        expect(result.slug).to.equal(undefined);
    });

    it('#update should keep the key field (new itm)', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });

        SheetsSQL.update('foo', { slug: 'foo-1' });
        expect(result.slug).to.equal('foo-1');
    });

    it('#update should remove private fields', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });
        itemStub.onFirstCall().returns(true); // item exists

        SheetsSQL.update('foo', { _title: 'foo-1', a: 1, _b: 2 }, 1);
        expect(result).to.eql({ a: 1, '#': 1 });
    });

    it('#update should keep private fields', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });

        SheetsSQL.update('foo', { _title: 'foo-1', a: 1, _b: 2 });
        expect(result).to.eql({ _title: 'foo-1', a: 1, _b: 2, '#': null });
    });

    it('#update should work (update, by id and item exists)', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });
        itemStub.onFirstCall().returns(true); // item exists

        SheetsSQL.update('foo', {}, 1);
        expect(result).to.eql({ '#': 1 });
    });

    it('#update should work (create new, by id but item not exists)', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });
        itemStub.onFirstCall().returns(false); // item not exists

        SheetsSQL.update('foo', {}, 0);
        expect(result).to.eql({ '#': null });
    });

    it('#update should work (update, by condition and item exists)', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });
        itemStub.onFirstCall().returns({ '#': 3 }); // item exists

        SheetsSQL.update('foo', {}, { slug: 'foo-3' });
        expect(result).to.eql({ '#': 3 });
    });

    it('#update should work (update, by condition but item not exists)', () => {
        let result: any;
        modelStub.onFirstCall().returns({
            createOrUpdate: (data) => { result = data; },
        });
        itemStub.onFirstCall().returns(null); // item not exists

        SheetsSQL.update('foo', {}, { slug: 'foo-x' });
        expect(result).to.eql({ '#': null });
    });

    it('#query should work', () => {
    });

});

describe('NoSQL service', () => {
    const SheetsNoSQL = sheetsNoSQL({ databaseId });

    let allStub: sinon.SinonStub;
    let updateStub: sinon.SinonStub;
    let collectionStub: sinon.SinonStub;
    let docStub: sinon.SinonStub;
    let objectStub: sinon.SinonStub;
    let updateDocStub: sinon.SinonStub;

    beforeEach(() => {
        // @ts-ignore
        allStub = sinon.stub(SheetsNoSQL.sqlService, 'all');
        // @ts-ignore
        updateStub = sinon.stub(SheetsNoSQL.sqlService, 'update');
        collectionStub = sinon.stub(SheetsNoSQL, 'collection');
        docStub = sinon.stub(SheetsNoSQL, 'doc');
        objectStub = sinon.stub(SheetsNoSQL, 'object');
        updateDocStub = sinon.stub(SheetsNoSQL, 'updateDoc');
    });

    afterEach(() => {
        allStub.restore();
        updateStub.restore();
        collectionStub.restore();
        docStub.restore();
        objectStub.restore();
        updateDocStub.restore();
    });

    it('#key should work', () => {
        const result = SheetsNoSQL.key();
        expect(!!result).to.equal(true);
        expect(typeof result).to.equal('string');
    });

    it('#collection should work (empty)', () => {
        allStub.onFirstCall().returns([]);
        collectionStub.restore();

        const result = SheetsNoSQL.collection('foo');
        expect(result).to.eql([]);
    });

    it('#collection should work (empty, object)', () => {
        allStub.onFirstCall().returns([]);
        collectionStub.restore();

        const result = SheetsNoSQL.collection('foo', true);
        expect(result).to.eql({});
    });

    it('#collection should work', () => {
        allStub.onFirstCall().returns([
            {'#': 1, title: 'Foo 1'},
            {'#': 2, title: 'Foo 2'},
        ]);
        collectionStub.restore();

        const result = SheetsNoSQL.collection('foo');
        expect(result).to.eql([
            {'#': 1, title: 'Foo 1'},
            {'#': 2, title: 'Foo 2'},
        ]);
    });

    it('#collection should work (object)', () => {
        allStub.onFirstCall().returns([
            {'#': 1, title: 'Foo 1'},
            {'#': 2, title: 'Foo 2'},
        ]);
        collectionStub.restore();

        const result = SheetsNoSQL.collection('foo', true);
        expect(result).to.eql({
            1: {'#': 1, title: 'Foo 1'},
            2: {'#': 2, title: 'Foo 2'},
        });
    });

    it('#doc should work (not exists)', () => {
        collectionStub.onFirstCall().returns({});
        docStub.restore();

        const result = SheetsNoSQL.doc('foo', '1');
        expect(result).to.equal(null);
    });

    it('#doc should work', () => {
        collectionStub.onFirstCall().returns({
            1: {'#': 1, title: 'Foo 1'},
            2: {'#': 2, title: 'Foo 2'},
        });
        docStub.restore();

        const result = SheetsNoSQL.doc('foo', '1');
        expect(result).to.eql({'#': 1, title: 'Foo 1'});
    });

    it('#object should show error (private properties)', () => {
        docStub.onFirstCall().returns({ slug: 'foo-1', _title: 'Foo 1' });
        objectStub.restore();

        expect(SheetsNoSQL.object.bind(SheetsNoSQL, '/foo/foo-1/_title')).to.throw('Private column.');
    });

    it('#object should work (no docId)', () => {
        collectionStub.onFirstCall().returns([]);
        objectStub.restore();

        const result = SheetsNoSQL.object('/foo');
        expect(result).to.eql([]);
    });

    it('#object should work (has docId, not exists)', () => {
        docStub.onFirstCall().returns(null);
        objectStub.restore();

        const result = SheetsNoSQL.object('/foo/foo-1');
        expect(result).to.equal(null);
    });

    it('#object should work (has docId, exists)', () => {
        docStub.onFirstCall().returns({ '#': 1, slug: 'foo-1', title: 'Foo 1' });
        objectStub.restore();

        const result = SheetsNoSQL.object('/foo/foo-1');
        expect(result).to.eql({ '#': 1, slug: 'foo-1', title: 'Foo 1' });
    });

    it('#object should work (has docId, exists, deep)', () => {
        docStub.onFirstCall().returns({ '#': 1, slug: 'foo-1', title: 'Foo 1' });
        docStub.onSecondCall().returns({ '#': 2, slug: 'foo-2', content: {a: {a1: 1, a2: 2}, b: 2} });
        docStub.onThirdCall().returns({ '#': 3 });
        objectStub.restore();

        const result1 = SheetsNoSQL.object('/foo/foo-1/title');
        const result2 = SheetsNoSQL.object('/foo/foo-1/content/a');
        const result3 = SheetsNoSQL.object('/foo/foo-1/title');
        expect(result1).to.equal('Foo 1');
        expect(result2).to.eql({a1: 1, a2: 2});
        expect(result3).to.equal(null);
    });

    it('#list should work (null)', () => {
        objectStub.onFirstCall().returns(null);

        const result = SheetsNoSQL.list('/');
        expect(result).to.eql([]);
    });

    it('#list should work (primitive value)', () => {
        objectStub.onFirstCall().returns('a string');

        const result = SheetsNoSQL.list('/');
        expect(result).to.eql([{ $key: 'value', value: 'a string' }]);
    });

    it('#list should work (array value)', () => {
        objectStub.onFirstCall().returns([1,2,3]);

        const result = SheetsNoSQL.list('/');
        expect(result).to.eql([
            { $key: '0', value: 1 },
            { $key: '1', value: 2 },
            { $key: '2', value: 3 },
        ]);
    });

    it('#list should work', () => {
        objectStub.onFirstCall().returns({a: 1});
        objectStub.onSecondCall().returns({b: {b1: 1, b2: 2}});

        const result1 = SheetsNoSQL.list('/');
        const result2 = SheetsNoSQL.list('/');
        expect(result1).to.eql([{ $key: 'a', value: 1 }]);
        expect(result2).to.eql([{ $key: 'b', b1: 1, b2: 2 }]);
    });

    it('#updateDoc should work (no docId)', () => {
        let result;
        updateStub.callsFake((collectionId, data, idOrCondition) => {
            result = {collectionId, data, idOrCondition};
        });
        updateDocStub.restore();

        SheetsNoSQL.updateDoc('foo', {});
        expect(result).to.eql({
            collectionId: 'foo',
            data: {},
            idOrCondition: null,
        });
    });

    it('#updateDoc should work (key)', () => {
        let result;
        updateStub.callsFake((collectionId, data, idOrCondition) => {
            result = {collectionId, data, idOrCondition};
        });
        updateDocStub.restore();

        SheetsNoSQL.updateDoc('foo', {}, '1');
        expect(result).to.eql({
            collectionId: 'foo',
            data: {},
            idOrCondition: { '#': '1' },
        });
    });

    it('#updateDoc should work (condition)', () => {
        let result;
        updateStub.callsFake((collectionId, data, idOrCondition) => {
            result = {collectionId, data, idOrCondition};
        });
        updateDocStub.restore();

        SheetsNoSQL.updateDoc('foo', {}, {slug: 'foo-1'});
        expect(result).to.eql({
            collectionId: 'foo',
            data: {},
            idOrCondition: { slug: 'foo-1' },
        });
    });

    it('#update should work', () => {
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

    it('#update should work (deep, no exist)', () => {
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

    it('#update should work (deep, exist)', () => {
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

describe('Security', () => {
    const Security = new SecurityService();

    it('.options should have default values', () => {
        const Security = new SecurityService();
        // @ts-ignore
        expect(Security.options).to.eql({ admin: false });
    });

    it('.options should have values', () => {
        const Security = new SecurityService({ admin: true });
        // @ts-ignore
        expect(Security.options).to.eql({ admin: true });
    });

    it('#isPrivate should work', () => {
        const result1 = Security.isPrivate('foo');
        const result2 = Security.isPrivate('_foo');
        const result3 = Security.isPrivate('__foo');
        expect(result1).to.equal(false);
        expect(result2).to.equal(true);
        expect(result3).to.equal(true);
    });

    it('#isPrivate should work (admin)', () => {
        const Security = new SecurityService({ admin: true });

        const result1 = Security.isPrivate('foo');
        const result2 = Security.isPrivate('_foo');
        const result3 = Security.isPrivate('__foo');
        expect(result1).to.equal(false);
        expect(result2).to.equal(false);
        expect(result3).to.equal(false);
    });

    it('#checkPrivate should do nothing (nothing to check)', () => {
        const result = Security.checkPrivate();
        expect(result).to.equal(undefined);
    });

    it('#checkPrivate should do nothing (admin)', () => {
        const Security = new SecurityService({ admin: true });
        const result1 = Security.checkPrivate({ sheetName: 'foo' });
        const result2 = Security.checkPrivate({ sheetName: '_foo' });
        expect(result1).to.equal(undefined);
        expect(result2).to.equal(undefined);
    });

    it('#checkPrivate should pass', () => {
        const result1 = Security.checkPrivate({ sheetName: 'foo' });
        const result2 = Security.checkPrivate({ sheetName: 'foo', key: 'foo-1' });
        const result3 = Security.checkPrivate({
            sheetName: 'foo', key: 'foo-1', data: 'a value', dataKey: 'a_key',
        });
        const result4 = Security.checkPrivate({
            sheetName: 'foo', key: 'foo-1', data: { a: 1, b: 2 },
        });
        expect(result1).to.equal(undefined);
        expect(result2).to.equal(undefined);
        expect(result3).to.equal(undefined);
        expect(result4).to.equal(undefined);
    });

    it('#checkPrivate should not pass (private sheet)', () => {
        expect(Security.checkPrivate.bind(Security, { sheetName: '_foo' })).to.throw('Private sheet.');
    });

    it('#checkPrivate should not pass (private row)', () => {
        expect(Security.checkPrivate.bind(Security, { key: '_foo-1' })).to.throw('Private row.');
    });

    it('#checkPrivate should not pass (private properties)', () => {
        expect(
            Security.checkPrivate.bind(Security, { data: { a: 1, _b: 2 } }),
        ).to.throw('Data contain private properties.');
    });

    it('#checkPrivate should not pass (private column, no dataKey)', () => {
        expect(
            Security.checkPrivate.bind(Security, { data: 'value' }),
        ).to.throw('Private column.');
    });

    it('#checkPrivate should not pass (private column)', () => {
        expect(
            Security.checkPrivate.bind(Security, { data: 'value', dataKey: '_column' }),
        ).to.throw('Private column.');
    });

});

describe('Utils', () => {

    it('#translateRangeValues should work (empty)', () => {
        const result1 = translateRangeValues(null);
        const result2 = translateRangeValues([]);
        const result3 = translateRangeValues([[]]);
        expect(result1).to.eql([]);
        expect(result2).to.eql([]);
        expect(result3).to.eql([]);
    });

    it('#translateRangeValues should work (no headers)', () => {
        const result1 = translateRangeValues([[1, 2]], true);
        const result2 = translateRangeValues([[1, 2], [3, 4]], true);
        expect(result1).to.eql([{ value1: 1, value2: 2 }]);
        expect(result2).to.eql([{ value1: 1, value2: 2 }, { value1: 3, value2: 4 }]);
    });

    it('#translateRangeValues should work', () => {
        const result1 = translateRangeValues([['id', 'title'], [1, 2]]);
        const result2 = translateRangeValues([['id', 'title'], [1, 2], [3, 4]]);
        expect(result1).to.eql([{ id: 1, title: 2 }]);
        expect(result2).to.eql([{ id: 1, title: 2 }, { id: 3, title: 4 }]);
    });

    it('#translateRangeValues should work (with modifier)', () => {
        const result = translateRangeValues([['id', 'title'], [1, 2]], false, (item) => {
            if (item.title === 2) item.title = '2';
            return item;
        });
        expect(result).to.eql([{ id: 1, title: '2' }]);
    });

    it('#parseData should work', () => {
        const result = parseData({
            a: 1,
            b: '',
            c: null,
            d: undefined,
            e: 'true',
            e1: 'TRUE',
            f: 'false',
            f1: 'FALSE',
            g: '2',
            h: '3.14',
            i: '{"a":1,"b":2}',
            i2: '[{"a":1,"b":2}]',
            j: 'me',
            j1: true,
            j2: false,
            j3: 4,
            j4: 5.9,
            j5: {c:3},
            j6: [{c:3, d:4}],
        });
        expect(result).to.eql({
            a: 1,
            e: true,
            e1: true,
            f: false,
            f1: false,
            g: 2,
            h: 3.14,
            i: {a:1,b:2},
            i2: [{a:1,b:2}],
            j: 'me',
            j1: true,
            j2: false,
            j3: 4,
            j4: 5.9,
            j5: {c:3},
            j6: [{c:3, d:4}],
        });
    });

    it('#stringifyData should work', () => {
        const result = stringifyData({
            a: 1,
            b: 'a string',
            c: true,
            d: { d1: 1, d2: 2 },
        });
        expect(result).to.eql({
            a: 1,
            b: 'a string',
            c: true,
            d: JSON.stringify({ d1: 1, d2: 2 }),
        });
    });

});