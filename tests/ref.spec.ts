import { describe, it, afterEach } from 'mocha';
import { expect } from 'chai';
import * as sinon from 'sinon';

import { RefService } from '../src/lib/ref';

let Ref: RefService;

let loadDataBySheetStub: sinon.SinonStub;
let loadRootDataStub: sinon.SinonStub;
let dataStub: sinon.SinonStub;
let toObjectStub: sinon.SinonStub;
let updateStub: sinon.SinonStub;

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
  toObjectStub = sinon.stub(Ref, 'toObject');
  updateStub = sinon.stub(Ref, 'update');
}

function after() {
  loadDataBySheetStub.restore();
  loadRootDataStub.restore();
  dataStub.restore();
  toObjectStub.restore();
  updateStub.restore();
}

describe('(RefService) ', () => {

  beforeEach(before);
  afterEach(after);

  it('#keyField (default)', () => {
    // @ts-ignore
    const result = Ref.keyField('xxx');
    expect(result).equal('$key');
  });

  it('#keyField (custom)', () => {
    // @ts-ignore
    Ref.Sheets.options.keyFields = { xxx: 'xxx' };
    // @ts-ignore
    const result = Ref.keyField('xxx');
    expect(result).equal('xxx');
  });

  it('#loadDataBySheet (has data in db)', () => {
    loadDataBySheetStub.restore();

    // @ts-ignore
    Ref.Sheets.database['xxx'] = { item1: 'Item 1' };
    // @ts-ignore
    const result = Ref.loadDataBySheet('xxx');
    expect(result).eql({ item1: 'Item 1' });
  });

  it('#loadDataBySheet (no data in db)', () => {
    loadDataBySheetStub.restore();

    // @ts-ignore
    Ref.Sheets.spreadsheet = {
      getRange: () => ({ getValues: () => [['title', '$key'], ['Item 1', 'item1']] }),
    };
    // @ts-ignore
    const result = Ref.loadDataBySheet('xxx');
    expect(result).eql({
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
    expect(result).eql({
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
    expect(result).eql({
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
    expect(result).eql({ a: 1 });
  });

  it('#data (items)', () => {
    dataStub.restore();

    loadDataBySheetStub.returns({ a: 1 });
    // @ts-ignore
    Ref.paths = ['xxx'];
    // @ts-ignore
    const result = Ref.data();
    expect(result).eql({ a: 1 });
  });

  it('#data (deeper)', () => {
    dataStub.restore();

    loadDataBySheetStub.returns({ a: 1, b: { b1: 2 } });
    // @ts-ignore
    Ref.paths = ['xxx', 'b'];
    // @ts-ignore
    const result = Ref.data();
    expect(result).eql({ b1: 2 });
  });

  it('#root', () => {
    const ref = new RefService(['xxx', 'abc'], {} as any);
    const result = ref.root();
    // @ts-ignore
    expect(result.paths).eql([]);
    // @ts-ignore
    expect(ref.paths).eql(['xxx', 'abc']);
  });

  it('#parent', () => {
    const ref = new RefService(['xxx', 'abc'], {} as any);
    const result = ref.parent();
    // @ts-ignore
    expect(result.paths).eql(['xxx']);
    // @ts-ignore
    expect(ref.paths).eql(['xxx', 'abc']);
  });

  it('#child', () => {
    const ref = new RefService(['xxx'], {} as any);
    const result = ref.child('abc');
    // @ts-ignore
    expect(result.paths).eql(['xxx', 'abc']);
    // @ts-ignore
    expect(ref.paths).eql(['xxx']);
  });

  it('#key', () => {
    const result = Ref.key();
    expect(typeof result === 'string').equal(true);
  });

  it('#toObject', () => {
    toObjectStub.restore();

    let checkpointResult: any;
    // @ts-ignore
    Ref.Sheets.Security = { checkpoint: (...args) => checkpointResult = args };

    Ref.toObject();
    expect(dataStub.callCount).equal(1);
    const [ permisson, paths, ref ] = checkpointResult;
    expect(permisson).equal('read');
    expect(paths).eql([]);
    expect(ref instanceof RefService).equal(true);
  });

  it('#toArray', () => {
    toObjectStub.returns({ a: 1, b: 2 });
    const result = Ref.toArray();
    expect(result).eql([
      { $key: 'a', value: 1 },
      { $key: 'b', value: 2 },
    ]);
  });

  it('#query (not list ref)', () => {
    let error: Error;
    try {
      Ref.query(() => true);
    } catch (err) {
      error = err;
    }
    expect(error.message).equal('Can only query list ref.');
  });

  it('#query', () => {
    let checkpointResult: any;
    // @ts-ignore
    Ref.Sheets.Security = { checkpoint: (...args) => checkpointResult = args };

    dataStub.returns({ abc: 1 });
    // @ts-ignore
    Ref.paths = ['xxx'];
    const result = Ref.query(() => true);
    expect(result).eql([1]);
    const [ permisson, paths, ref ] = checkpointResult;
    expect(permisson).equal('read');
    expect(paths).eql(['xxx', 'abc']);
    expect(ref instanceof RefService).equal(true);
  });

  it('#update (not item ref)', () => {
    updateStub.restore();

    let error: Error;
    try {
      Ref.update();
    } catch (err) {
      error = err;
    }
    expect(error.message).equal('Can only modify list ref (new) and item ref.');
  });

  it('#update (new)', () => {
    updateStub.restore();

    let checkpointResult: any;
    let setValuesResult: any;

    // @ts-ignore
    Ref.Sheets.Security = { checkpoint: (...args) => checkpointResult = args };

    loadDataBySheetStub.returns({}); // no item
    // @ts-ignore
    Ref.Sheets.spreadsheet = {
      getSheetByName: () => ({
        getLastRow: () => 2,
        getRange: (range: string) => ({
          getValues: () => {
            if (range !== 'A1:1') { // get latest #
              return [[1]];
            } else { // get headers
              return [['#', '$key', 'a']];
            }
          },
          setValues: values => setValuesResult = values,
        }),
      }),
    };

    // @ts-ignore
    Ref.paths = ['xxx', 'abc'];
    const result = Ref.update({ a: 1, b: 2 });
    const item = {
      '#': 2,
      $key: 'abc',
      a: 1,
      _row: 3,
      b: 2, // ignore
    };
    expect(result).eql(item);
    expect(setValuesResult).eql([
      [2, 'abc', 1],
    ]);
    const [ permisson, paths, ref, newData, inputData ] = checkpointResult;
    expect(permisson).equal('write');
    expect(paths).eql(['xxx', 'abc']);
    expect(ref instanceof RefService).equal(true);
    expect(newData).eql(item);
    expect(inputData).eql({ a: 1, b: 2 });
  });

  it('#update (update)', () => {
    updateStub.restore();

    let checkpointResult: any;
    let setValuesResult: any;

    // @ts-ignore
    Ref.Sheets.Security = { checkpoint: (...args) => checkpointResult = args };

    loadDataBySheetStub.returns({
      abc: {
        '#': 2,
        $key: 'abc',
        a: 1,
        _row: 3,
      },
    }); // no item
    // @ts-ignore
    Ref.Sheets.spreadsheet = {
      getSheetByName: () => ({
        getRange: () => ({
          getValues: () => {
            return [['#', '$key', 'a']];
          },
          setValues: values => setValuesResult = values,
        }),
      }),
    };

    // @ts-ignore
    Ref.paths = ['xxx', 'abc'];
    const result = Ref.update({ a: 'xxx', $key: 'xxx', b: 2 }); // ignore $key and b
    const item = {
      '#': 2,
      $key: 'abc',
      a: 'xxx',
      _row: 3,
      b: 2, // ignore
    };
    expect(result).eql(item);
    expect(setValuesResult).eql([
      [2, 'abc', 'xxx'],
    ]);
    const [ permisson, paths, ref, newData, inputData ] = checkpointResult;
    expect(permisson).equal('write');
    expect(paths).eql(['xxx', 'abc']);
    expect(ref instanceof RefService).equal(true);
    expect(newData).eql(item);
    expect(inputData).eql({ a: 'xxx', $key: 'xxx', b: 2 });
  });

  it('#update (remove)', () => {
    updateStub.restore();

    let checkpointResult: any;
    let deleteRowResult: any;

    // @ts-ignore
    Ref.Sheets.Security = { checkpoint: (...args) => checkpointResult = args };

    loadDataBySheetStub.returns({
      abc: {
        '#': 2,
        $key: 'abc',
        a: 1,
        _row: 3,
      },
    }); // no item
    // @ts-ignore
    Ref.Sheets.spreadsheet = {
      getSheetByName: () => ({
        deleteRow: row => deleteRowResult = row,
      }),
    };

    // @ts-ignore
    Ref.paths = ['xxx', 'abc'];
    const result = Ref.update();
    const item = {
      '#': 2,
      $key: 'abc',
      a: 1,
      _row: 3,
    };
    expect(result).eql(undefined);
    expect(deleteRowResult).equal(3);
    const [ permisson, paths, ref, newData, inputData ] = checkpointResult;
    expect(permisson).equal('write');
    expect(paths).eql(['xxx', 'abc']);
    expect(ref instanceof RefService).equal(true);
    expect(newData).eql(item);
    expect(inputData).equal(null);
  });

  it('#increase (not item ref)', () => {
    let error: Error;
    try {
      Ref.increase('likeCount');
    } catch (err) {
      error = err;
    }
    expect(error.message).equal('Can only increasing item ref.');
  });

  it('#increase (not item ref)', () => {
    let error: Error;
    try {
      Ref.increase('likeCount');
    } catch (err) {
      error = err;
    }
    expect(error.message).equal('Can only increasing item ref.');
  });

  it('#increase (single, default)', () => {
    let updateStubResult: any;
    dataStub.returns({});
    updateStub.callsFake(data => updateStubResult = data);
    // @ts-ignore
    Ref.paths = ['xxx', 'abc'];
    Ref.increase('likeCount');
    expect(updateStubResult).eql({ likeCount: 1 });
  });

  it('#increase (multiple, default)', () => {
    let updateStubResult: any;
    dataStub.returns({ likeCount: 1, xxx: 1 });
    updateStub.callsFake(data => updateStubResult = data);
    // @ts-ignore
    Ref.paths = ['xxx', 'abc'];
    Ref.increase(['likeCount', 'xxx']);
    expect(updateStubResult).eql({ likeCount: 2, xxx: 2 });
  });

  it('#increase (multiple, custom)', () => {
    let updateStubResult: any;
    dataStub.returns({ likeCount: 1, xxx: 1 });
    updateStub.callsFake(data => updateStubResult = data);
    // @ts-ignore
    Ref.paths = ['xxx', 'abc'];
    Ref.increase({ likeCount: 2, xxx: 3});
    expect(updateStubResult).eql({ likeCount: 3, xxx: 4 });
  });

  it('#increase (deep)', () => {
    let updateStubResult: any;
    dataStub.returns({ xxx: { def: 1 } });
    updateStub.callsFake(data => updateStubResult = data);
    // @ts-ignore
    Ref.paths = ['xxx', 'abc'];
    Ref.increase({ 'xxx/abc': 3, 'xxx/def': 3 });
    expect(updateStubResult).eql({ xxx: { abc: 3, def: 4 } });
  });

});