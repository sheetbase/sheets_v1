import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { DataFilterService } from '../src/lib/filter';

const dataFilter = new DataFilterService();

describe('(Database/filter) #convertShorthandQueryToSingleQuery', () => {

  it('#convertShorthandQueryToSingleQuery', () => {
    const result = dataFilter.convertShorthandQueryToSingleQuery({ a: 1 });
    expect(result).eql({ where: 'a', equal: 1 });
  });

});

describe('(Database/filter) #convertSingleQueryToAdvancedFilter', () => {

  it('invalid (no input)', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter(null);
    expect(result({})).equal(true, '1');
    expect(result({ a: 1 })).equal(true, '2');
  });

  it('invalid (no where clause)', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: undefined, equal: 1 });
    expect(result({})).equal(true, '1');
    expect(result({ a: 1 })).equal(true, '2');
  });

  it('equal', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', equal: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 2 })).equal(false, 'not equal');
    expect(result({ a: 1 })).equal(true, 'equal');
  });

  it('exists', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', exists: true });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: '' })).equal(false, 'empty string');
    expect(result({ a: null })).equal(false, 'null');
    expect(result({ a: undefined })).equal(false, 'undefined');
    expect(result({ a: 1 })).equal(true, 'exists');
  });

  it('not exists', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', exists: false });
    expect(result({ a: 1 })).equal(false, 'exists');
    expect(result({ a: '' })).equal(true, 'empty string');
    expect(result({ a: null })).equal(true, 'null');
    expect(result({ a: undefined })).equal(true, 'undedined');
    expect(result({})).equal(true, 'not exists');
  });

  it('contains', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', contains: 'xxx' });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 1 })).equal(false, 'not string');
    expect(result({ a: 'abc xxx def'})).equal(true, 'contains');
  });

  it('lt', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', lt: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not number');
    expect(result({ a: 1 })).equal(false, 'equal');
    expect(result({ a: 0 })).equal(true, 'less than');
  });

  it('lte', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', lte: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not number');
    expect(result({ a: 1 })).equal(true, 'equal');
    expect(result({ a: 0 })).equal(true, 'less than');
  });

  it('gt', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', gt: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not number');
    expect(result({ a: 1 })).equal(false, 'equal');
    expect(result({ a: 2 })).equal(true, 'greater than');
  });

  it('gte', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', gte: 1 });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not number');
    expect(result({ a: 1 })).equal(true, 'equal');
    expect(result({ a: 2 })).equal(true, 'greater than');
  });

  it('childExists, object', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', childExists: 'xxx' });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({ a: {} })).equal(false, 'not exists');
    expect(result({ a: { xxx: '' } })).equal(false, 'empty string');
    expect(result({ a: { xxx: null } })).equal(false, 'null');
    expect(result({ a: { xxx: undefined } })).equal(false, 'undefined');
    expect(result({ a: { xxx: 1 } })).equal(true, 'exists');
  });

  it('childExists, array', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', childExists: 'xxx' });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({ a: [] })).equal(false, 'not exists');
    expect(result({ a: ['xxx'] })).equal(true, 'exists');
  });

  it('not childExists, object', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', childExists: '!xxx' });
    expect(result({ a: { xxx: 1 } })).equal(false, 'exists');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({})).equal(true, 'no key');
    expect(result({ a: {} })).equal(true, 'not exists');
    expect(result({ a: { xxx: '' } })).equal(true, 'empty string');
    expect(result({ a: { xxx: null } })).equal(true, 'null');
    expect(result({ a: { xxx: undefined } })).equal(true, 'undefined');
  });

  it('not childExists, array', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', childExists: '!xxx' });
    expect(result({ a: ['xxx'] })).equal(false, 'exists');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({})).equal(true, 'no key');
    expect(result({ a: [] })).equal(true, 'not exists');
  });

  it('childEqual, string', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', childEqual: 'xxx=def' });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({ a: {} })).equal(false, 'not exists');
    expect(result({ a: { xxx: '' } })).equal(false, 'empty string');
    expect(result({ a: { xxx: null } })).equal(false, 'null');
    expect(result({ a: { xxx: undefined } })).equal(false, 'undefined');
    expect(result({ a: { xxx: 'abc' } })).equal(false, 'not equal');
    expect(result({ a: { xxx: 'def' } })).equal(true, 'equal');
  });

  it('childEqual, number', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', childEqual: 'xxx=1' });
    expect(result({ a: { xxx: 1 } })).equal(true, 'equal');
  });

  it('not childEqual', () => {
    const result = dataFilter.convertSingleQueryToAdvancedFilter({ where: 'a', childEqual: 'xxx!=1' });
    expect(result({ a: { xxx: 1 } })).equal(false, 'equal');
    expect(result({ a: 'xxx' })).equal(false, 'not object');
    expect(result({})).equal(true, 'no key');
    expect(result({ a: {} })).equal(true, 'not exists');
    expect(result({ a: { xxx: '' } })).equal(true, 'empty string');
    expect(result({ a: { xxx: null } })).equal(true, 'null');
    expect(result({ a: { xxx: undefined } })).equal(true, 'undefined');
    expect(result({ a: { xxx: 'abc' } })).equal(true, 'not equal');
  });

});

describe('(Database/filter) #convertMultiQueryToAdvancedFilter', () => {

  it('invalid (no input)', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter(null);
    expect(result({})).equal(true, '1');
    expect(result({ a: 1 })).equal(true, '2');
  });

  it('invalid (empty input)', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter({});
    expect(result({})).equal(true, '1');
    expect(result({ a: 1 })).equal(true, '2');
  });

  it('invalid (empty AND', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter({ and: [] });
    expect(result({})).equal(true, '1');
    expect(result({ a: 1 })).equal(true, '2');
  });

  it('invalid (empty OR', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter({ or: [] });
    expect(result({})).equal(true, '1');
    expect(result({ a: 1 })).equal(true, '2');
  });

  it('invalid (empty AND & OR)', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter({ and: [], or: [] });
    expect(result({})).equal(true, '1');
    expect(result({ a: 1 })).equal(true, '2');
  });

  it('only AND, single', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter({
      and: [{ where: 'a', equal: 1 }],
    });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 2 })).equal(false, 'not equal');
    expect(result({ a: 1 })).equal(true, 'equal');
  });

  it('only OR, single', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter({
      or: [{ where: 'a', equal: 1 }],
    });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 2 })).equal(false, 'not equal');
    expect(result({ a: 1 })).equal(true, 'equal');
  });

  it('only AND, multiple', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter({
      and: [
        { where: 'a', equal: 1 },
        { where: 'b', equal: 2 },
      ],
    });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 1, b: 3 })).equal(false, 'not equal');
    expect(result({ a: 1, b: 2 })).equal(true, 'equal');
  });

  it('only OR, multiple', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter({
      or: [
        { where: 'a', equal: 1 },
        { where: 'b', equal: 2 },
      ],
    });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 2, b: 3 })).equal(false, 'not equal');
    expect(result({ a: 1, b: 3 })).equal(true, 'equal 1');
    expect(result({ a: 2, b: 2 })).equal(true, 'equal 2');
  });

  it('OR & AND', () => {
    const result = dataFilter.convertMultiQueryToAdvancedFilter({
      and: [
        { where: 'a', equal: 1 },
        { where: 'b', equal: 2 },
      ],
      or: [
        { where: 'c', equal: 3 },
      ],
    });
    expect(result({})).equal(false, 'no key');
    expect(result({ a: 1, b: 3 })).equal(false, 'not equal 1');
    expect(result({ a: 2, b: 2 })).equal(false, 'not equal 2');
    expect(result({ a: 1, b: 2 })).equal(true, 'equal 1');
    expect(result({ a: 2, b: 2, c: 3 })).equal(true, 'equal 2');
  });

});

describe('(Database/filter) #buildAdvancedFilter', () => {

  it('advanced filter', () => {
    const result = dataFilter.buildAdvancedFilter(item => true);
    expect(result instanceof Function).equal(true);
  });

  it('multi query', () => {
    const convertMultiQueryToAdvancedFilterStub = sinon.stub(dataFilter, 'convertMultiQueryToAdvancedFilter');

    let converterArgs;
    convertMultiQueryToAdvancedFilterStub.callsFake((...args) => {
      converterArgs = args;
      return item => true;
    });

    const result1 = dataFilter.buildAdvancedFilter({ and: [] });
    const result2 = dataFilter.buildAdvancedFilter({ or: [] });
    expect(converterArgs).eql([ { or: [] } ]);
    expect(result1 instanceof Function).equal(true, 'and');
    expect(result2 instanceof Function).equal(true, 'or');

    convertMultiQueryToAdvancedFilterStub.restore();
  });

  it('short hand query', () => {
    const convertShorthandQueryToSingleQueryStub = sinon
    .stub(dataFilter, 'convertShorthandQueryToSingleQuery');
    const convertSingleQueryToAdvancedFilterStub = sinon
    .stub(dataFilter, 'convertSingleQueryToAdvancedFilter');

    let shorthandArgs;
    convertShorthandQueryToSingleQueryStub.callsFake((...args) => {
      shorthandArgs = args;
      return { where: 'a', equal: 1 };
    });
    let converterArgs;
    convertSingleQueryToAdvancedFilterStub.callsFake((...args) => {
      converterArgs = args;
      return item => true;
    });

    const result = dataFilter.buildAdvancedFilter({ a: 1 });
    expect(shorthandArgs).eql([ { a: 1 } ]);
    expect(converterArgs).eql([ { where: 'a', equal: 1 } ]);
    expect(result instanceof Function).equal(true);

    convertShorthandQueryToSingleQueryStub.restore();
    convertSingleQueryToAdvancedFilterStub.restore();
  });

  it('short hand query', () => {
    const convertShorthandQueryToSingleQueryStub = sinon
    .stub(dataFilter, 'convertShorthandQueryToSingleQuery');
    const convertSingleQueryToAdvancedFilterStub = sinon
    .stub(dataFilter, 'convertSingleQueryToAdvancedFilter');

    let shorthandArgs;
    convertShorthandQueryToSingleQueryStub.callsFake((...args) => {
      shorthandArgs = args;
      return { where: 'a', equal: 1 };
    });
    let converterArgs;
    convertSingleQueryToAdvancedFilterStub.callsFake((...args) => {
      converterArgs = args;
      return item => true;
    });

    const result = dataFilter.buildAdvancedFilter({ where: 'a', equal: 1 });
    expect(shorthandArgs).eql(undefined);
    expect(converterArgs).eql([ { where: 'a', equal: 1 } ]);
    expect(result instanceof Function).equal(true);

    convertShorthandQueryToSingleQueryStub.restore();
    convertSingleQueryToAdvancedFilterStub.restore();
  });

});

describe('(Database/filter) #buildSegmentFilter', () => {

  it('no segment', () => {
    const result = dataFilter.buildSegmentFilter(null);
    expect(result({})).equal(true);
  });

  it('empty segment', () => {
    const result = dataFilter.buildSegmentFilter({});
    expect(result({})).equal(true);
  });

  it('1, matched, no field', () => {
    const result = dataFilter.buildSegmentFilter({ xxx: 1 });
    expect(result({})).equal(true);
  });

  it('1, not matched', () => {
    const result = dataFilter.buildSegmentFilter({ xxx: 1 });
    expect(result({ xxx: 2 })).equal(false);
  });

  it('1, matched', () => {
    const result = dataFilter.buildSegmentFilter({ xxx: 1 });
    expect(result({ xxx: 1 })).equal(true);
  });

  it('>1 & <=3, not matched', () => {
    const result = dataFilter.buildSegmentFilter({ a: 1, b: 2 });
    expect(result({ a: 1, b: 3 })).equal(false);
  });

  it('>1 & <=3, matched', () => {
    const result = dataFilter.buildSegmentFilter({ a: 1, b: 2, c: 3 });
    expect(result({ a: 1, b: 2, c: 3 })).equal(true);
  });

  it('>3, matched, no field', () => {
    const result = dataFilter.buildSegmentFilter({ a: 1, b: 2, c: 3, d: 4 });
    expect(result({ a: 1, b: 2, c: 3 })).equal(true);
  });

  it('>3, not matched', () => {
    const result = dataFilter.buildSegmentFilter({ a: 1, b: 2, c: 3, d: 4 });
    expect(result({ a: 1, b: 2, c: 3, d: 5 })).equal(false);
  });

  it('>3, matched', () => {
    const result = dataFilter.buildSegmentFilter({ a: 1, b: 2, c: 3, d: 4 });
    expect(result({ a: 1, b: 2, c: 3, d: 4 })).equal(true);
  });

});

describe('(Database/filter) #applyListingFilter', () => {

  it('no filter', () => {
    const items = [1];
    const result = dataFilter.applyListingFilter(items);
    expect(result).eql(items);
  });

  it('default orderBy (asc)', () => {
    const items = [
      { '#': 2 },
      { '#': 1 },
      { '#': 3 },
    ];
    const result = dataFilter.applyListingFilter(items, { order: 'asc' });
    expect(result[0]).eql({ '#': 1 });
    expect(result[1]).eql({ '#': 2 });
    expect(result[2]).eql({ '#': 3 });
  });

  it('default orderBy (desc)', () => {
    const items = [
      { '#': 2 },
      { '#': 1 },
      { '#': 3 },
    ];
    const result = dataFilter.applyListingFilter(items, { order: 'desc' });
    expect(result[0]).eql({ '#': 3 });
    expect(result[1]).eql({ '#': 2 });
    expect(result[2]).eql({ '#': 1 });
  });

  it('custom orderBy (default order)', () => {
    const items = [
      { '#': 2, a: 1 },
      { '#': 1, a: 3 },
      { '#': 3, a: 2 },
    ];
    const result = dataFilter.applyListingFilter(items, { orderBy: 'a' });
    expect(result[0]).eql({ '#': 2, a: 1 });
    expect(result[1]).eql({ '#': 3, a: 2 });
    expect(result[2]).eql({ '#': 1, a: 3 });
  });

  it('custom orderBy (custom order)', () => {
    const items = [
      { '#': 2, a: 1 },
      { '#': 1, a: 3 },
      { '#': 3, a: 2 },
    ];
    const result = dataFilter.applyListingFilter(items, { orderBy: 'a', order: 'desc' });
    expect(result[0]).eql({ '#': 1, a: 3 });
    expect(result[1]).eql({ '#': 3, a: 2 });
    expect(result[2]).eql({ '#': 2, a: 1 });
  });

  it('offset first', () => {
    const items = [
      { '#': 1 },
      { '#': 2 },
      { '#': 3 },
      { '#': 4 },
      { '#': 5 },
    ];
    const result = dataFilter.applyListingFilter(items, { offset: 2 });
    expect(result).eql([
      { '#': 3 },
      { '#': 4 },
      { '#': 5 },
    ]);
  });

  it('offset last', () => {
    const items = [
      { '#': 1 },
      { '#': 2 },
      { '#': 3 },
      { '#': 4 },
      { '#': 5 },
    ];
    const result = dataFilter.applyListingFilter(items, { offset: -2 });
    expect(result).eql([
      { '#': 1 },
      { '#': 2 },
      { '#': 3 },
    ]);
  });

  it('limit first', () => {
    const items = [
      { '#': 1 },
      { '#': 2 },
      { '#': 3 },
      { '#': 4 },
      { '#': 5 },
    ];
    const result = dataFilter.applyListingFilter(items, { limit: 2 });
    expect(result).eql([
      { '#': 1 },
      { '#': 2 },
    ]);
  });

  it('limit last', () => {
    const items = [
      { '#': 1 },
      { '#': 2 },
      { '#': 3 },
      { '#': 4 },
      { '#': 5 },
    ];
    const result = dataFilter.applyListingFilter(items, { limit: -2 });
    expect(result).eql([
      { '#': 4 },
      { '#': 5 },
    ]);
  });

});