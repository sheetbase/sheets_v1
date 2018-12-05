import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
    sheets,
    spreadsheet,
    sheetsSQL,
    sheetsNoSQL,

    parseData,
} from '../src/public_api';

const databaseId = '1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI';

const Sheets = sheets({ databaseId });
const Spreadsheet = spreadsheet({ databaseId });
const SheetsSQL = sheetsSQL({ databaseId });
const SheetsNoSQL = sheetsNoSQL({ databaseId });

/**
 * faked globals
 */
const g: any = global;

g.SpreadsheetApp = {

};

/**
 * test start
 */

describe('Sheets module test', () => {

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

describe('Utils test', () => {

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

});