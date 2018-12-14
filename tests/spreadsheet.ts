import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { spreadsheet } from '../src/public_api';

const Spreadsheet = spreadsheet({ databaseId: 'database_id_xxx' });

let getActiveStub: sinon.SinonStub;
let openByIdStub: sinon.SinonStub;
let spreadsheetStub: sinon.SinonStub;
let rangeStub: sinon.SinonStub;
let sheetsStub: sinon.SinonStub;
let sheetStub: sinon.SinonStub;

function buildStubs() {
    getActiveStub = sinon.stub(SpreadsheetApp, 'getActive');
    openByIdStub = sinon.stub(SpreadsheetApp, 'openById');
    spreadsheetStub = sinon.stub(Spreadsheet, 'spreadsheet');
    rangeStub = sinon.stub(Spreadsheet, 'range');
    sheetsStub = sinon.stub(Spreadsheet, 'sheets');
    sheetStub = sinon.stub(Spreadsheet, 'sheet');
}

function restoreStubs() {
    getActiveStub.restore();
    openByIdStub.restore();
    spreadsheetStub.restore();
    rangeStub.restore();
    sheetsStub.restore();
    sheetStub.restore();
}

describe('(Spreadsheet) .options', () => {

    it('.options should have default values', () => {
        const Spreadsheet = spreadsheet();
        // @ts-ignore
        expect(Spreadsheet.options).to.eql({});
    });

    it('.options should have values', () => {
        const Spreadsheet = spreadsheet({ databaseId: 'database_id_xxx' });
        // @ts-ignore
        expect(Spreadsheet.options.databaseId).to.equal('database_id_xxx');
    });

});

describe('(Spreadsheet) all methods', () => {

    beforeEach(() => buildStubs());
    afterEach(() => restoreStubs());

    it('#spreadsheet SpreadsheetApp should use active spreadsheet (no databaseId)', () => {
        getActiveStub.onFirstCall().returns('SpreadsheetApp.getActive()' as any);

        const Spreadsheet = spreadsheet();
        const result = Spreadsheet.spreadsheet();
        expect(result).to.equal('SpreadsheetApp.getActive()');
    });

    it('#spreadsheet SpreadsheetApp should use databaseId', () => {
        openByIdStub.onFirstCall().returns('SpreadsheetApp.openById()' as any);

        const Spreadsheet = spreadsheet({ databaseId: 'database_id_xxx' });
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

describe('(Spreadsheet) #createSheet', () => {

    it('#createSheet should work');

});