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

    it('.options should have default values', () => {
        const Spreadsheet = spreadsheet();
        // @ts-ignore
        const { options } = Spreadsheet;
        expect(options).to.eql({});
    });

    it('.options should have values', () => {
        const Spreadsheet = spreadsheet({ databaseId: 'xxx' });
        // @ts-ignore
        const { options } = Spreadsheet;
        expect(options.databaseId).to.equal('xxx');
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
    const SheetsSQL = sheetsSQL({ databaseId });

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

    it('.options should have default values', () => {
        const SheetsSQL = sheetsSQL();
        // @ts-ignore
        const { options } = SheetsSQL;
        expect(options).to.eql({});
    });

    it('.options should have values', () => {
        const SheetsSQL = sheetsSQL({ databaseId: 'xxx' });
        // @ts-ignore
        const { options } = SheetsSQL;
        expect(options.databaseId).to.equal('xxx');
    });

    it('#model should works', () => {
        // @ts-ignore
        defineStub.callsFake(options => options);
        modelStub.restore();

        const result = SheetsSQL.model('foo');
        expect(result).to.eql({ sheetName: 'foo' });
    });

    it('#models should works', () => {
        // @ts-ignore
        defineStub.callsFake(() => true);
        sheetNamesStub.onFirstCall().returns({ main: ['foo', 'bar'] } as any);

        const result = SheetsSQL.models();
        expect(result).to.eql({ foo: true, bar: true });
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
            find: (id) => id,
        });
        modelStub.onSecondCall().returns({
            where: (condition) => ({ first: () => condition }),
        });
        itemStub.restore();

        const result1 = SheetsSQL.item('foo', 1);
        const result2 = SheetsSQL.item('foo', { slug: 'foo-1' });
        expect(result1).to.equal(1);
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

});

describe('NoSQL service', () => {
    const SheetsNoSQL = sheetsNoSQL({ databaseId });

    it('.options should have default values', () => {
        const SheetsNoSQL = sheetsNoSQL();
        // @ts-ignore
        const { options } = SheetsNoSQL;
        expect(options).to.eql({ keyFields: {} });
    });

    it('.options should have values', () => {
        const SheetsNoSQL = sheetsNoSQL({
            databaseId: 'xxx',
            keyFields: {
                foo: 'key',
            },
        });
        // @ts-ignore
        const { options } = SheetsNoSQL;
        expect(options.databaseId).to.equal('xxx');
        expect(options.keyFields).to.eql({ foo: 'key' });
    });

    it('#keyField should work', () => {

    });

    it('#key should work', () => {

    });

    it('#collection should work', () => {

    });

    it('#doc should work', () => {

    });

    it('#list should work', () => {

    });

    it('#object should work', () => {

    });

    it('#updateDoc should work', () => {

    });

    it('#update should work', () => {

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