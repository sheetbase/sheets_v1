import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import { RefService } from '../src/lib/ref';

let Ref: RefService;

let loadDataBySheetStub: sinon.SinonStub;
let loadRootDataStub: sinon.SinonStub;
let dataStub: sinon.SinonStub;

function before() {
  // create an instance
  Ref = new RefService([], {
    database: {},
    options: {
      keyFields: {},
      security: {},
      securityHelpers: {},
    },
  } as any);
  // build stubs
  // @ts-ignore
  loadDataBySheetStub = sinon.stub(Ref, 'loadDataBySheet');
  // @ts-ignore
  loadRootDataStub = sinon.stub(Ref, 'loadRootData');
  // @ts-ignore
  dataStub = sinon.stub(Ref, 'data');
}

function after() {
  loadDataBySheetStub.restore();
  loadRootDataStub.restore();
  dataStub.restore();
}

describe('(RefService) ', () => {

  beforeEach(before);
  afterEach(after);

  it('#keyField (default)', () => {
    // @ts-ignore
    const result = Ref.keyField('xxx');
    expect(result).to.equal('$key');
  });

  it('#keyField (custom)', () => {
    // @ts-ignore
    Ref.Sheets.options.keyFields = { xxx: 'xxx' };
    // @ts-ignore
    const result = Ref.keyField('xxx');
    expect(result).to.equal('xxx');
  });

  it('#loadDataBySheet (has data in db)', () => {
    loadDataBySheetStub.restore();

    // @ts-ignore
    Ref.Sheets.database['xxx'] = { item1: 'Item 1' };
    // @ts-ignore
    const result = Ref.loadDataBySheet('xxx');
    expect(result).to.eql({ item1: 'Item 1' });
  });

  it('#loadDataBySheet (no data in db)', () => {
    loadDataBySheetStub.restore();

    // @ts-ignore
    Ref.Sheets.spreadsheet = {
      getRange: () => ({ getValues: () => [['title', '$key'], ['Item 1', 'item1']] }),
    };
    // @ts-ignore
    const result = Ref.loadDataBySheet('xxx');
    expect(result).to.eql({
      item1: {
        $key: 'item1',
        title: 'Item 1',
        _row: 2,
      },
    });
  });

  it('#loadDataBySheet (has data in db, force fresh)', () => {
    loadDataBySheetStub.restore();

    // @ts-ignore
    Ref.Sheets.database['xxx'] = { item1: 'Item 1' };

    // @ts-ignore
    Ref.Sheets.spreadsheet = {
      getRange: () => ({ getValues: () => [['title', '$key'], ['Item 1', 'item1']] }),
    };
    // @ts-ignore
    const result = Ref.loadDataBySheet('xxx', true);
    expect(result).to.eql({
      item1: {
        $key: 'item1',
        title: 'Item 1',
        _row: 2,
      },
    });
  });

  it('#loadRootData', () => {
    loadRootDataStub.restore();

    loadDataBySheetStub.onFirstCall().callsFake(() => {
      // @ts-ignore
      Ref.Sheets.database['xxx'] = { a: 1 };
    });
    loadDataBySheetStub.onSecondCall().callsFake(() => {
      // @ts-ignore
      Ref.Sheets.database['xxx2'] = { b: 2 };
    });
    loadDataBySheetStub.onThirdCall().callsFake(() => {
      // @ts-ignore
      Ref.Sheets.database['xxx3'] = { c: 3 };
    });

    // @ts-ignore
    Ref.Sheets.spreadsheet = {
      getSheets: () => [
        { getName: () => 'xxx' },
        { getName: () => 'xxx2' },
        { getName: () => 'xxx3' },
      ],
    };

    // @ts-ignore
    const result = Ref.loadRootData();
    expect(result).to.eql({
      xxx: { a: 1 },
      xxx2: { b: 2 },
      xxx3: { c: 3 },
    });
  });

  it('#data (root)', () => {
    dataStub.restore();

    loadRootDataStub.returns({ a: 1 });
    // @ts-ignore
    const result = Ref.data();
    expect(result).to.eql({ a: 1 });
  });

  it('#data (items)', () => {
    dataStub.restore();

    loadDataBySheetStub.returns({ a: 1 });
    // @ts-ignore
    Ref.paths = ['xxx'];
    // @ts-ignore
    const result = Ref.data();
    expect(result).to.eql({ a: 1 });
  });

  it('#data (deeper)', () => {
    dataStub.restore();

    loadDataBySheetStub.returns({ a: 1, b: { b1: 2 } });
    // @ts-ignore
    Ref.paths = ['xxx', 'b'];
    // @ts-ignore
    const result = Ref.data();
    expect(result).to.eql({ b1: 2 });
  });

});