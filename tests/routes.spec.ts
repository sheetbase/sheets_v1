import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as sinon from 'sinon';

import { SheetsService } from '../src/lib/sheets';

global['SpreadsheetApp'] = {};

let Sheets: SheetsService;

let itemStub: sinon.SinonStub;
let queryStub: sinon.SinonStub;
let dataStub: sinon.SinonStub;
let allStub: sinon.SinonStub;
let updateStub: sinon.SinonStub;
let setStub: sinon.SinonStub;
let increaseStub: sinon.SinonStub;
let contentStub: sinon.SinonStub;

function before() {
  global['SpreadsheetApp'].openById = () => true;

  Sheets = new SheetsService({
    databaseId: 'xxx',
  }, {});

  // build stubs
  itemStub = sinon.stub(Sheets, 'item');
  queryStub = sinon.stub(Sheets, 'query');
  dataStub = sinon.stub(Sheets, 'data');
  allStub = sinon.stub(Sheets, 'all');
  updateStub = sinon.stub(Sheets, 'update');
  setStub = sinon.stub(Sheets, 'set');
  increaseStub = sinon.stub(Sheets, 'increase');
  contentStub = sinon.stub(Sheets, 'content');
}

function after() {
  itemStub.restore();
  queryStub.restore();
  dataStub.restore();
  allStub.restore();
  updateStub.restore();
  setStub.restore();
  increaseStub.restore();
  contentStub.restore();
}

describe('Sheets routes', () => {

  const routerRecorder = {};
  const Router = {
    get: (endpoint, ...handlers) => {
      routerRecorder['GET:' + endpoint] = handlers;
    },
    post: (endpoint, ...handlers) => {
      routerRecorder['POST:' + endpoint] = handlers;
    },
    put: (endpoint, ...handlers) => {
      routerRecorder['PUT:' + endpoint] = handlers;
    },
    patch: (endpoint, ...handlers) => {
      routerRecorder['PATCH:' + endpoint] = handlers;
    },
    delete: (endpoint, ...handlers) => {
      routerRecorder['DELETE:' + endpoint] = handlers;
    },
    setDisabled: () => true,
    setErrors: () => true,
  };

  // prepare
  before();
  allStub.callsFake((...args) => ['all', ...args]);
  dataStub.callsFake((...args) => ['data', ...args]);
  itemStub.callsFake((...args) => ['item', ...args]);
  queryStub.callsFake((...args) => ['query', ...args]);

  let updateResult: any;
  let setResult: any;
  let increaseResult: any;
  updateStub.callsFake((...args) => updateResult = ['update', ...args]);
  setStub.callsFake((...args) => setResult = ['set', ...args]);
  increaseStub.callsFake((...args) => increaseResult = ['increase', ...args]);

  contentStub.returns('xxx ...');

  // register routes
  Sheets.registerRoutes({
    router: Router as any,
    disabledRoutes: [],
  });

  it('register routes', () => {
    expect(Object.keys(routerRecorder)).to.eql([
      'GET:/database',
      'POST:/database',
      'PUT:/database',
      'PATCH:/database',
      'DELETE:/database',
      'GET:/database/content',
    ]);
    expect(routerRecorder['GET:/database'].length).to.equal(3);
    expect(routerRecorder['POST:/database'].length).to.equal(3);
    expect(routerRecorder['PUT:/database'].length).to.equal(3);
    expect(routerRecorder['PATCH:/database'].length).to.equal(3);
    expect(routerRecorder['DELETE:/database'].length).to.equal(3);
    expect(routerRecorder['GET:/database/content'].length).to.equal(3);
  });

  it('GET /database (error)', () => {
    const handler = routerRecorder['GET:/database'][2];
    const result = handler({
      query: {},
    }, {
      error: data => data,
    });
    expect(result).to.equal('No path/table/sheet.');
  });

  it('GET /database (all, sheet)', () => {
    const handler = routerRecorder['GET:/database'][2];
    const result = handler({
      query: {
        sheet: 'xxx',
      },
    }, {
      success: data => data,
    });
    expect(result).to.eql(['all', 'xxx']);
  });

  it('GET /database (all, table)', () => {
    const handler = routerRecorder['GET:/database'][2];
    const result = handler({
      query: {
        table: 'xxx',
      },
    }, {
      success: data => data,
    });
    expect(result).to.eql(['all', 'xxx']);
  });

  it('GET /database (all, path)', () => {
    const handler = routerRecorder['GET:/database'][2];
    const result = handler({
      query: {
        path: '/xxx',
      },
    }, {
      success: data => data,
    });
    expect(result).to.eql(['all', 'xxx']);
  });

  it('GET /database (data)', () => {
    const handler = routerRecorder['GET:/database'][2];
    const result = handler({
      query: {
        sheet: 'xxx',
        type: 'object',
      },
    }, {
      success: data => data,
    });
    expect(result).to.eql(['data', 'xxx']);
  });

  it('GET /database (item, key)', () => {
    const handler = routerRecorder['GET:/database'][2];
    const result = handler({
      query: {
        sheet: 'xxx',
        key: 'abc',
      },
    }, {
      success: data => data,
    });
    expect(result).to.eql(['item', 'xxx', 'abc']);
  });

  it('GET /database (item, id)', () => {
    const handler = routerRecorder['GET:/database'][2];
    const result = handler({
      query: {
        sheet: 'xxx',
        id: 'abc',
      },
    }, {
      success: data => data,
    });
    expect(result).to.eql(['item', 'xxx', 'abc']);
  });

  it('GET /database (query)', () => {
    const handler = routerRecorder['GET:/database'][2];
    const result = handler({
      query: {
        sheet: 'xxx',
        where: 'a',
        equal: 1,
      },
    }, {
      success: data => data,
    });
    expect(result).to.eql(['query', 'xxx', {
      where: 'a',
      equal: 1,
      exists: undefined,
      contains: undefined,
      lt: undefined,
      lte: undefined,
      gt: undefined,
      gte: undefined,
      childExists: undefined,
      childEqual: undefined,
    }]);
  });

  it('POST /database (error)', () => {
    const handler = routerRecorder['POST:/database'][2];
    const result = handler({
      body: {},
    }, {
      error: data => data,
    });
    expect(result).to.equal('No path/table/sheet.');
  });

  it('POST /database (update, sheet, new)', () => {
    const handler = routerRecorder['POST:/database'][2];
    const result = handler({
      body: {
        sheet: 'xxx',
      },
    }, {
      success: data => data,
    });
    expect(updateResult).to.eql(['update', 'xxx', null, null]);
    expect(result).eql({ acknowledge: true });
  });

  it('POST /database (update, table, new)', () => {
    const handler = routerRecorder['POST:/database'][2];
    const result = handler({
      body: {
        table: 'xxx',
      },
    }, {
      success: data => data,
    });
    expect(updateResult).to.eql(['update', 'xxx', null, null]);
    expect(result).eql({ acknowledge: true });
  });

  it('POST /database (update, path, new)', () => {
    const handler = routerRecorder['POST:/database'][2];
    const result = handler({
      body: {
        path: '/xxx',
      },
    }, {
      success: data => data,
    });
    expect(updateResult).to.eql(['update', 'xxx', null, null]);
    expect(result).eql({ acknowledge: true });
  });

  it('POST /database (update, sheet + key, delete)', () => {
    const handler = routerRecorder['POST:/database'][2];
    const result = handler({
      body: {
        sheet: 'xxx',
        key: 'abc',
      },
    }, {
      success: data => data,
    });
    expect(updateResult).to.eql(['update', 'xxx', 'abc', null]);
    expect(result).eql({ acknowledge: true });
  });

  it('POST /database (update, sheet + id, delete)', () => {
    const handler = routerRecorder['POST:/database'][2];
    const result = handler({
      body: {
        sheet: 'xxx',
        id: 'abc',
      },
    }, {
      success: data => data,
    });
    expect(updateResult).to.eql(['update', 'xxx', 'abc', null]);
    expect(result).eql({ acknowledge: true });
  });

  it('POST /database (update, sheet + key, update)', () => {
    const handler = routerRecorder['POST:/database'][2];
    const result = handler({
      body: {
        sheet: 'xxx',
        key: 'abc',
        data: { a: 1 },
      },
    }, {
      success: data => data,
    });
    expect(updateResult).to.eql(['update', 'xxx', 'abc', { a: 1 }]);
    expect(result).eql({ acknowledge: true });
  });

  it('POST /database (set, sheet + key, update)', () => {
    const handler = routerRecorder['POST:/database'][2];
    const result = handler({
      body: {
        sheet: 'xxx',
        key: 'abc',
        data: { a: 1 },
        clean: true,
      },
    }, {
      success: data => data,
    });
    expect(setResult).to.eql(['set', 'xxx', 'abc', { a: 1 }]);
    expect(result).eql({ acknowledge: true });
  });

  it('POST /database (increasing, sheet + key)', () => {
    const handler = routerRecorder['POST:/database'][2];
    const result = handler({
      body: {
        sheet: 'xxx',
        key: 'abc',
        increasing: 'likeCount',
      },
    }, {
      success: data => data,
    });
    expect(increaseResult).to.eql(['increase', 'xxx', 'abc', 'likeCount']);
    expect(result).eql({ acknowledge: true });
  });

  it('GET /database/content', () => {
    const handler = routerRecorder['GET:/database/content'][2];
    const result = handler({
      query: {
        docId: 'xxx',
      },
    }, {
      success: data => data,
    });
    expect(result).eql({ docId: 'xxx', content: 'xxx ...'  });
  });

});