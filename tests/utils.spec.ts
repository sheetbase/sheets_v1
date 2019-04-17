import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
  translateRangeValues,
  parseData,
  o2a,
  uniqueId,
} from '../src/lib/utils';

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
    expect(result1).to.eql([{ value1: 1, value2: 2, _row: 1 }]);
    expect(result2).to.eql([{ value1: 1, value2: 2, _row: 1 }, { value1: 3, value2: 4, _row: 2 }]);
  });

  it('#translateRangeValues should work', () => {
    const result1 = translateRangeValues([['id', 'title'], [1, 2]]);
    const result2 = translateRangeValues([['id', 'title'], [1, 2], [3, 4]]);
    expect(result1).to.eql([{ id: 1, title: 2, _row: 2 }]);
    expect(result2).to.eql([{ id: 1, title: 2, _row: 2 }, { id: 3, title: 4, _row: 3 }]);
  });

  it('#translateRangeValues should work (with modifier)', () => {
    const result = translateRangeValues<any>([['id', 'title'], [1, 2]], false, (item) => {
      if (item.title === 2) item.title = 'xxx';
      return item;
    });
    expect(result).to.eql([{ id: 1, title: 'xxx', _row: 2 }]);
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

  it('#o2a should work', () => {
    const result = o2a({ a: 1, b: 2, c: { c1: 1, c2: 2 } });
    expect(result).to.eql([
      { $key: 'a', value: 1 },
      { $key: 'b', value: 2 },
      { $key: 'c', c1: 1, c2: 2 },
    ]);
  });

  it('#o2a should work (custom key name)', () => {
    const result = o2a({ a: 1 }, 'xxx');
    expect(result).to.eql([{ xxx: 'a', value: 1 }]);
  });

  it('#uniqueId should works', () => {
    const id = uniqueId();
    expect(id.substr(0, 1)).to.equal('-');
    expect(id.length).to.equal(12);
  });

  it('#uniqueId should create id (32 chars)', () => {
    const id = uniqueId(32);
    expect(id.length).to.equal(32);
  });

  it('#uniqueId should create id (12 chars, start with 1)', () => {
    const id = uniqueId(null, '1');
    expect(id.substr(0, 1)).to.equal('1');
  });

});