import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
    sheets,
    spreadsheet,
    sheetsSQL,
    sheetsNoSQL,

    translateRangeValues,
    parseData,
    stringifyData,
} from '../src/public_api';

/**
 * test start
 */

describe('Module creation', () => {
    const Sheets = sheets({ databaseId: 'database_id_xxx' });
    const Spreadsheet = spreadsheet({ databaseId: 'database_id_xxx' });
    const SheetsSQL = sheetsSQL({ databaseId: 'database_id_xxx' });
    const SheetsNoSQL = sheetsNoSQL({ databaseId: 'database_id_xxx' });

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