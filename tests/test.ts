import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import * as TamotsuX from '@sheetbase/tamotsux-server';

import {
    sheets,
    spreadsheet,
    sheetsSQL,
    sheetsNoSQL,

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

    it('SpreadsheetApp should use active spreadsheet is no databaseId', () => {
        const getActiveStub = sinon.stub(SpreadsheetApp, 'getActive');
        getActiveStub.onFirstCall().returns('SpreadsheetApp.getActive()' as any);

        const Spreadsheet = spreadsheet();
        const result = Spreadsheet.spreadsheet();
        expect(result).to.equal('SpreadsheetApp.getActive()');

        // restore
        getActiveStub.restore();
    });

    it('SpreadsheetApp should use databaseId', () => {
        const openByIdStub = sinon.stub(SpreadsheetApp, 'openById');
        openByIdStub.onFirstCall().returns('SpreadsheetApp.openById()' as any);

        const Spreadsheet = spreadsheet({ databaseId });
        const result = Spreadsheet.spreadsheet();
        expect(result).to.equal('SpreadsheetApp.openById()');

        // restore
        openByIdStub.restore();
    });

    it('#spreadsheet should work', () => {

    });

    it('#sheets should work', () => {

    });

    it('#sheet should work', () => {

    });

    it('#range should work', () => {

    });

    it('#getValues should work', () => {

    });

    it('#setValues should work', () => {

    });

    it('#sheetNames should work', () => {

    });

    it('#lastCol should work', () => {

    });

    it('#lastRow should work', () => {

    });

});

describe('SQL service', () => {
    const SheetsSQL = sheetsSQL({ databaseId });

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
        const defineStub = sinon.stub(TamotsuX.Table, 'define');
        // @ts-ignore
        defineStub.callsFake(options => options);

        const result = SheetsSQL.model('foo');
        expect(result).to.eql({ sheetName: 'foo' });

        // restore
        defineStub.restore();
    });

    it('#models should works', () => {
        const defineStub = sinon.stub(TamotsuX.Table, 'define');
        // @ts-ignore
        defineStub.callsFake(() => true);

        // @ts-ignore
        const sheetNamesStub = sinon.stub(SheetsSQL.spreadsheetService, 'sheetNames');
        sheetNamesStub.onFirstCall().returns({ main: ['foo', 'bar'] } as any);

        const result = SheetsSQL.models();
        expect(result).to.eql({ foo: true, bar: true });

        // restore
        defineStub.restore();
        sheetNamesStub.restore();
    });

    it('#all should work', () => {

    });

    it('#item should work', () => {

    });

    it('#update should work', () => {

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

    it('#translateRangeValues should work', () => {

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