import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { DataSnapshot } from '../src/lib/snapshot';
import { RefService } from '../src/lib/ref';

let Snapshot: DataSnapshot;

function before() {
  Snapshot = new DataSnapshot({ value: 'xxx' });
}

function after() {

}

describe('(DataSnapshot) ', () => {

  beforeEach(before);
  afterEach(after);

  it('#val() (input is an object)', () => {
    const result = Snapshot.val();
    expect(result).to.eql({ value: 'xxx' });
  });

  it('#val() (input is a ref)', () => {
    const Ref = new RefService([], {} as any);
    // @ts-ignore
    const loadRootDataStub = sinon.stub(Ref, 'loadRootData');
    loadRootDataStub.returns({ item1: 'Item 1' });
    const Snapshot = new DataSnapshot(Ref);
    const result = Snapshot.val();
    loadRootDataStub.restore();
    expect(result).to.eql({ item1: 'Item 1' });
  });

  it('#only (no props)', () => {
    // @ts-ignore
    Snapshot.input = { a: 1, b: 2, c: 3 };
    const result = Snapshot.only([]);
    expect(result).to.equal(true);
  });

  it('#only (false)', () => {
    // @ts-ignore
    Snapshot.input = { a: 1, b: 2, c: 3 };
    const result = Snapshot.only(['a', 'b']);
    expect(result).to.equal(false);
  });

  it('#only (true)', () => {
    // @ts-ignore
    Snapshot.input = { a: 1, b: 2, c: 3 };
    const result = Snapshot.only(['a', 'b', 'c']);
    expect(result).to.equal(true);
  });

  it('#only (no data)', () => {
    // @ts-ignore
    Snapshot.input = null;
    const result = Snapshot.only(['a']);
    expect(result).to.equal(false);
  });

  it('#only (data is not an object)', () => {
    // @ts-ignore
    Snapshot.input = 'xxx';
    const result = Snapshot.only(['a']);
    expect(result).to.equal(false);
  });

  it('custom helpers', () => {
    const Snapshot = new DataSnapshot({ value: 'xxx' }, {
      xxx: () => 'xxx',
    });
    expect(!!Snapshot['xxx']).to.equal(true);
    expect(Snapshot['xxx']()).to.equal('xxx');
  });

});