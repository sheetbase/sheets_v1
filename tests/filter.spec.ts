import { describe, it } from 'mocha';
import { expect } from 'chai';

import { buildQuery, buildAdvancedFilter, buildSegmentFilter } from '../src/lib/filter';

describe('(Filter)', () => {

  it('#buildQuery (shorthand)', () => {
    const result = buildQuery({ a: 1 });
    expect(result).eql({ where: 'a', equal: 1 });
  });

  it('#buildQuery', () => {
    const result = buildQuery({ where: 'a', childEqual: 'xxx' });
    expect(result).eql({ where: 'a', childEqual: 'xxx' });
  });

  it('#buildAdvancedFilter (equal)', () => {
    const result = buildAdvancedFilter({ where: 'a', equal: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 2 })).equal(false, 'not equal');
    expect(result({ a: 1 })).equal(true, 'equal');
  });

  it('#buildAdvancedFilter (exists)', () => {
    const result = buildAdvancedFilter({ where: 'a', exists: true });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: '' })).equal(false, 'empty string');
    expect(result({ a: null })).equal(false, 'null');
    expect(result({ a: undefined })).equal(false, 'undefined');
    expect(result({ a: 1 })).equal(true, 'exists');
  });

  it('#buildAdvancedFilter (not exists)', () => {
    const result = buildAdvancedFilter({ where: 'a', exists: false });
    expect(result({ a: 1 })).equal(false, 'exists');
    expect(result({ a: '' })).equal(true, 'empty string');
    expect(result({ a: null })).equal(true, 'null');
    expect(result({ a: undefined })).equal(true, 'undedined');
    expect(result({})).equal(true, 'not exists');
  });

  it('#buildAdvancedFilter (contains)', () => {
    const result = buildAdvancedFilter({ where: 'a', contains: 'xxx' });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 1 })).equal(false, 'not string');
    expect(result({ a: 'abc xxx def'})).equal(true, 'contains');
  });

  it('#buildAdvancedFilter (lt)', () => {
    const result = buildAdvancedFilter({ where: 'a', lt: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not number');
    expect(result({ a: 1 })).equal(false, 'equal');
    expect(result({ a: 0 })).equal(true, 'less than');
  });

  it('#buildAdvancedFilter (lte)', () => {
    const result = buildAdvancedFilter({ where: 'a', lte: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not number');
    expect(result({ a: 1 })).equal(true, 'equal');
    expect(result({ a: 0 })).equal(true, 'less than');
  });

  it('#buildAdvancedFilter (gt)', () => {
    const result = buildAdvancedFilter({ where: 'a', gt: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not number');
    expect(result({ a: 1 })).equal(false, 'equal');
    expect(result({ a: 2 })).equal(true, 'greater than');
  });

  it('#buildAdvancedFilter (gte)', () => {
    const result = buildAdvancedFilter({ where: 'a', gte: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not number');
    expect(result({ a: 1 })).equal(true, 'equal');
    expect(result({ a: 2 })).equal(true, 'greater than');
  });

  it('#buildAdvancedFilter (childExists, object)', () => {
    const result = buildAdvancedFilter({ where: 'a', childExists: 'xxx' });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({ a: {} })).equal(false, 'not exists');
    expect(result({ a: { xxx: '' } })).equal(false, 'empty string');
    expect(result({ a: { xxx: null } })).equal(false, 'null');
    expect(result({ a: { xxx: undefined } })).equal(false, 'undefined');
    expect(result({ a: { xxx: 1 } })).equal(true, 'exists');
  });

  it('#buildAdvancedFilter (childExists, array)', () => {
    const result = buildAdvancedFilter({ where: 'a', childExists: 'xxx' });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({ a: [] })).equal(false, 'not exists');
    expect(result({ a: ['xxx'] })).equal(true, 'exists');
  });

  it('#buildAdvancedFilter (not childExists, object)', () => {
    const result = buildAdvancedFilter({ where: 'a', childExists: '!xxx' });
    expect(result({ a: { xxx: 1 } })).equal(false, 'exists');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({})).equal(true, 'no key');
    expect(result({ a: {} })).equal(true, 'not exists');
    expect(result({ a: { xxx: '' } })).equal(true, 'empty string');
    expect(result({ a: { xxx: null } })).equal(true, 'null');
    expect(result({ a: { xxx: undefined } })).equal(true, 'undefined');
  });

  it('#buildAdvancedFilter (not childExists, array)', () => {
    const result = buildAdvancedFilter({ where: 'a', childExists: '!xxx' });
    expect(result({ a: ['xxx'] })).equal(false, 'exists');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({})).equal(true, 'no key');
    expect(result({ a: [] })).equal(true, 'not exists');
  });

  it('#buildAdvancedFilter (childEqual, string)', () => {
    const result = buildAdvancedFilter({ where: 'a', childEqual: 'xxx=def' });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({ a: {} })).equal(false, 'not exists');
    expect(result({ a: { xxx: '' } })).equal(false, 'empty string');
    expect(result({ a: { xxx: null } })).equal(false, 'null');
    expect(result({ a: { xxx: undefined } })).equal(false, 'undefined');
    expect(result({ a: { xxx: 'abc' } })).equal(false, 'not equal');
    expect(result({ a: { xxx: 'def' } })).equal(true, 'equal');
  });

  it('#buildAdvancedFilter (childEqual, number)', () => {
    const result = buildAdvancedFilter({ where: 'a', childEqual: 'xxx=1' });
    expect(result({ a: { xxx: 1 } })).equal(true, 'equal');
  });

  it('#buildAdvancedFilter (not childEqual)', () => {
    const result = buildAdvancedFilter({ where: 'a', childEqual: 'xxx!=1' });
    expect(result({ a: { xxx: 1 } })).equal(false, 'equal');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({})).equal(true, 'no key');
    expect(result({ a: {} })).equal(true, 'not exists');
    expect(result({ a: { xxx: '' } })).equal(true, 'empty string');
    expect(result({ a: { xxx: null } })).equal(true, 'null');
    expect(result({ a: { xxx: undefined } })).equal(true, 'undefined');
    expect(result({ a: { xxx: 'abc' } })).equal(true, 'not equal');
  });

  it('#buildSegmentFilter (no segment)', () => {
    const result = buildSegmentFilter(null);
    expect(result({})).equal(true);
  });

  it('#buildSegmentFilter (empty segment)', () => {
    const result = buildSegmentFilter({});
    expect(result({})).equal(true);
  });

  it('#buildSegmentFilter (1, matched, no field)', () => {
    const result = buildSegmentFilter({ xxx: 1 });
    expect(result({})).equal(true);
  });

  it('#buildSegmentFilter (1, not matched)', () => {
    const result = buildSegmentFilter({ xxx: 1 });
    expect(result({ xxx: 2 })).equal(false);
  });

  it('#buildSegmentFilter (1, matched)', () => {
    const result = buildSegmentFilter({ xxx: 1 });
    expect(result({ xxx: 1 })).equal(true);
  });

  it('#buildSegmentFilter (>1 & <=3, not matched)', () => {
    const result = buildSegmentFilter({ a: 1, b: 2 });
    expect(result({ a: 1, b: 3 })).equal(false);
  });

  it('#buildSegmentFilter (>1 & <=3, matched)', () => {
    const result = buildSegmentFilter({ a: 1, b: 2, c: 3 });
    expect(result({ a: 1, b: 2, c: 3 })).equal(true);
  });

  it('#buildSegmentFilter (>3, matched, no field)', () => {
    const result = buildSegmentFilter({ a: 1, b: 2, c: 3, d: 4 });
    expect(result({ a: 1, b: 2, c: 3 })).equal(true);
  });

  it('#buildSegmentFilter (>3, not matched)', () => {
    const result = buildSegmentFilter({ a: 1, b: 2, c: 3, d: 4 });
    expect(result({ a: 1, b: 2, c: 3, d: 5 })).equal(false);
  });

  it('#buildSegmentFilter (>3, matched)', () => {
    const result = buildSegmentFilter({ a: 1, b: 2, c: 3, d: 4 });
    expect(result({ a: 1, b: 2, c: 3, d: 4 })).equal(true);
  });

});