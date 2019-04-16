import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import { SheetsService } from '../src/lib/sheets';
import { SecurityService } from '../src/lib/security';
import { RefService } from '../src/lib/ref';

global['SpreadsheetApp'] = {};

let Sheets: SheetsService;

let refStub: sinon.SinonStub;
let allStub: sinon.SinonStub;
let queryStub: sinon.SinonStub;
let updateStub: sinon.SinonStub;

function before() {
  global['SpreadsheetApp'].openById = () => true;

  Sheets = new SheetsService({
    databaseId: 'xxx',
  }, {});
  // build stubs
  refStub = sinon.stub(Sheets, 'ref');
  allStub = sinon.stub(Sheets, 'all');
  queryStub = sinon.stub(Sheets, 'query');
  updateStub = sinon.stub(Sheets, 'update');
}

function after() {
  refStub.restore();
  allStub.restore();
  queryStub.restore();
  updateStub.restore();
}

describe('(SheetsService)', () => {

  beforeEach(before);
  afterEach(after);

  it('options', () => {
    expect(Sheets.options).eql({
      databaseId: 'xxx',
      keyFields: {},
      security: {},
      securityHelpers: {},
    });
  });

  it('members', () => {
    expect(Sheets.database).eql({});
    expect(Sheets.Security instanceof SecurityService).equal(true);
    expect(Sheets.spreadsheet).equal(true);
  });

  it('#setIntegration', () => {
    Sheets.setIntegration('AuthToken', 'xxx');
    expect(Sheets.options.AuthToken).equal('xxx');
  });

  it('#extend', () => {
    const Sheets2 = Sheets.extend({ security: false });
    expect(Sheets2 instanceof SheetsService).equal(true);
    expect(Sheets2.options.security).equal(false);
    expect(Sheets.options.security).eql({});
  });

  it('#toAdmin', () => {
    const SheetsAdmin = Sheets.toAdmin();
    expect(SheetsAdmin instanceof SheetsService).equal(true);
    expect(SheetsAdmin.options.security).equal(false);
    expect(Sheets.options.security).eql({});
  });

  it('#ref', () => {
    refStub.restore();

    const Ref = Sheets.ref('/xxx');
    expect(Ref instanceof RefService).equal(true);
    // @ts-ignore
    expect(Ref.paths).eql(['xxx']);
  });

  it('#key', () => {
    refStub.returns({
      key: (length, startWith) => ({ length, startWith }),
    });

    const result1 = Sheets.key();
    const result2 = Sheets.key(32, '1');
    expect(result1).eql({ length: 27, startWith: '-' });
    expect(result2).eql({ length: 32, startWith: '1' });
  });

  it('#data', () => {
    refStub.returns({
      toObject: () => ({}),
    });

    const result = Sheets.data('xxx');
    expect(result).eql({});
  });

  it('#all', () => {
    allStub.restore();

    refStub.returns({
      toArray: () => [],
    });

    const result = Sheets.all('xxx');
    expect(result).eql([]);
  });

  it('#query', () => {
    queryStub.restore();

    refStub.returns({
      query: () => [],
    });

    const result = Sheets.query('xxx', { abc: 123 });
    expect(result).eql([]);
  });

  it('#items (all)', () => {
    allStub.returns('all');
    const result = Sheets.items('xxx');
    expect(result).equal('all');
  });

  it('#items (query)', () => {
    queryStub.returns('query');
    const result = Sheets.items('xxx', () => true);
    expect(result).equal('query');
  });

  it('#item (string)', () => {
    refStub.returns({
      toObject: () => ({}),
    });

    const result = Sheets.item('xxx', 'abc');
    expect(result).eql({});
  });

  it('#item (query, multiple items)', () => {
    queryStub.returns([ 1, 2 ]);

    const result = Sheets.item('xxx', () => true);
    expect(result).equal(null);
  });

  it('#item (query, single item)', () => {
    queryStub.returns([ 1 ]);

    const result = Sheets.item('xxx', () => true);
    expect(result).equal(1);
  });

  it('#set', () => {
    refStub.returns({
      set: data => data,
    });
    const result = Sheets.set('xxx', 'abc', { a: 1 });
    expect(result).eql({ a: 1 });
  });

  it('#update', () => {
    updateStub.restore();

    refStub.returns({
      update: data => data,
    });
    const result = Sheets.update('xxx', 'abc', { a: 1 });
    expect(result).eql({ a: 1 });
  });

  it('#add', () => {
    updateStub.callsFake((sheetName, key, data) => ({ sheetName, key, data }));

    const result = Sheets.add('xxx', 'abc', { a: 1 });
    expect(result).eql({ sheetName: 'xxx', key: 'abc', data: { a: 1} });
  });

  it('#remove', () => {
    updateStub.callsFake((sheetName, key, data) => ({ sheetName, key, data }));

    const result = Sheets.remove('xxx', 'abc');
    expect(result).eql({ sheetName: 'xxx', key: 'abc', data: null });
  });

  it('#increase', () => {
    refStub.returns({
      increase: data => data,
    });
    const result = Sheets.increase('xxx', 'abc', 'likeCount');
    expect(result).equal('likeCount');
  });

});