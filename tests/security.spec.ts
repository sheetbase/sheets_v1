import { expect } from 'chai';
import { describe, it } from 'mocha';

import { SheetsService } from '../src/lib/sheets';
import { SecurityService } from '../src/lib/security';

let Security: SecurityService;

function before() {
  Security = new SecurityService({
    options: {},
  } as SheetsService);
  // @ts-ignore
  Security.Sheets.options.security = {
    '.read': true,
    '.write': true,
    users: {
      '.read': false,
      '.write': false,
      $uid: {
        '.read': '$uid === auth.uid',
        '.write': '$uid === auth.uid',
      },
    },
    posts: {
      content: {
        $section: {
          '.read': '$section === "xxx"',
          '.write': '$section === "xxx"',
          $header: {
            '.write': false,
          },
        },
      },
      $other: {
        '.read': false,
        '.write': false,
      },
    },
    foo: null,
  };
}

function after() {}

describe('(Security) helper methods (#setRequest)', () => {

  beforeEach(before);
  afterEach(after);

  it('#setRequest should work (empty)', () => {
    Security.setRequest({ query: {}, body: {}, data: {} });
    // @ts-ignore
    expect(Security.req).to.eql({ query: {}, body: {}, data: {} });
  });

  it('#setRequest should work (with idToken, no AuthToken)', () => {
    Security.setRequest({ query: { idToken: 'xxx' } });
    // @ts-ignore
    expect(Security.auth).to.equal(null);
  });

  it('#setRequest should work (with idToken, has AuthToken)', () => {
    // mock options Auth token
    // @ts-ignore
    Security.Sheets.options['AuthToken'] = {
      decodeIdToken: () => ({ uid: 'xxx' }),
    };

    Security.setRequest({ query: { idToken: 'xxx' } });
    // @ts-ignore
    expect(Security.auth).to.eql({ uid: 'xxx' });
  });

});

describe('(Security) #parseRule', () => {

  beforeEach(before);
  afterEach(after);

  it('should have correct (security = false)', () => {
    // @ts-ignore
    Security.Sheets.options.security = false;
    // @ts-ignore
    const result1 = Security.parseRule('read', []);
    // @ts-ignore
    const result2 = Security.parseRule('write', []);
    expect(result1.rule).to.equal(true);
    expect(result2.rule).to.equal(true);
  });

  it('should have correct (security = undefined)', () => {
    // @ts-ignore
    Security.Sheets.options.security = undefined;
    // @ts-ignore
    const result1 = Security.parseRule('read', []);
    // @ts-ignore
    const result2 = Security.parseRule('write', []);
    expect(result1.rule).to.equal(false);
    expect(result2.rule).to.equal(false);
  });

  it('should have correct (security = true)', () => {
    // @ts-ignore
    Security.Sheets.options.security = true;
    // @ts-ignore
    const result1 = Security.parseRule('read', []);
    // @ts-ignore
    const result2 = Security.parseRule('write', []);
    expect(result1.rule).to.equal(false);
    expect(result2.rule).to.equal(false);
  });

  it('should have correct (security = {})', () => {
    // @ts-ignore
    Security.Sheets.options.security = {};
    // @ts-ignore
    const result1 = Security.parseRule('read', []);
    // @ts-ignore
    const result2 = Security.parseRule('write', []);
    expect(result1.rule).to.equal(false);
    expect(result2.rule).to.equal(false);
  });

  it('should have values for root path', () => {
    // @ts-ignore
    const result1 = Security.parseRule('read', []);
    // @ts-ignore
    const result2 = Security.parseRule('write', []);
    expect(result1.rule).to.equal(true);
    expect(result2.rule).to.equal(true);
  });

  it('should have latest values for invalid path', () => {
    // @ts-ignore
    const result1 = Security.parseRule('read', ['xxx']);
    // @ts-ignore
    const result2 = Security.parseRule('write', ['xxx']);
    expect(result1.rule).to.equal(true);
    expect(result2.rule).to.equal(true);
  });

  it('should have latest values for invalid format', () => {
    // @ts-ignore
    const result1 = Security.parseRule('read', ['foo']);
    // @ts-ignore
    const result2 = Security.parseRule('write', ['foo']);
    expect(result1.rule).to.equal(true);
    expect(result2.rule).to.equal(true);
  });

  it('should inherit values', () => {
    // @ts-ignore
    const result1 = Security.parseRule('read', ['posts']);
    // @ts-ignore
    const result2 = Security.parseRule('write', ['posts']);
    expect(result1.rule).to.equal(true);
    expect(result2.rule).to.equal(true);
  });

  it('should override values', () => {
    // @ts-ignore
    const result1 = Security.parseRule('read', ['users']);
    // @ts-ignore
    const result2 = Security.parseRule('write', ['users']);
    expect(result1.rule).to.equal(false);
    expect(result2.rule).to.equal(false);
  });

  it('should use dynamic field', () => {
    // @ts-ignore
    const result1 = Security.parseRule('read', ['users', 'xxx']);
    // @ts-ignore
    const result2 = Security.parseRule('write', ['users', 'xxx']);
    expect(result1.rule).to.equal('$uid === auth.uid');
    expect(result2.rule).to.equal('$uid === auth.uid');
  });

  it('should not use dynamic field (has the specific field)', () => {
    // @ts-ignore
    const result1 = Security.parseRule('read', ['posts', 'content']);
    // @ts-ignore
    const result2 = Security.parseRule('write', ['posts', 'content']);
    expect(result1.rule).to.equal(true);
    expect(result2.rule).to.equal(true);
  });

  it('should use dynamic field (not has the specific field)', () => {
    // @ts-ignore
    const result1 = Security.parseRule('read', ['posts', 'title']);
    // @ts-ignore
    const result2 = Security.parseRule('write', ['posts', 'title']);
    expect(result1.rule).to.equal(false);
    expect(result2.rule).to.equal(false);
  });

  it('should use dynamic field, deeper & multiple', () => {
    // @ts-ignore
    const result1 = Security.parseRule('read', ['posts', 'content', 'sec1', 'h1']);
    // @ts-ignore
    const result2 = Security.parseRule('write', ['posts', 'content', 'sec1', 'h1']);
    expect(result1.rule).to.equal('$section === "xxx"');
    expect(result2.rule).to.equal(false);
  });

});

describe('(Security) #parseRule (test dynamicData)', () => {

  beforeEach(before);
  afterEach(after);

  it('should use dynamic field', () => {
    // @ts-ignore
    const result = Security.parseRule('read', ['users', 'xxx']);
    expect(result.dynamicData).to.eql({ $uid: 'xxx' });
  });

  it('should use dynamic field, deeper & multiple', () => {
    // @ts-ignore
    const result = Security.parseRule('read', ['posts', 'content', 'sec1', 'h1']);
    expect(result.dynamicData).to.eql({ $section: 'sec1', $header: 'h1' });
  });
});

describe('(Security) #executeRule', () => {

  beforeEach(before);
  afterEach(after);

  const fakedRef: any = {
    root: () => ({}) as any,
  };

  it('should return false (throw error)', () => {
    // faked RefService
    // @ts-ignore
    const result = Security.executeRule(
      'throw null',
      fakedRef,
    );
    expect(result).to.equal(false);
  });

  it('should have correct .now', () => {
    // @ts-ignore
    const result = Security.executeRule(
      'now instanceof Date',
      fakedRef,
    );
    expect(result).to.equal(true);
  });

  it('should not have .auth', () => {
    // @ts-ignore
    const result = Security.executeRule(
      '!auth',
      fakedRef,
    );
    expect(result).to.equal(true);
  });

  it('should not have .auth (throw error if access)', () => {
    // @ts-ignore
    const result = Security.executeRule(
      'auth.uid === $uid',
      fakedRef,
    );
    expect(result).to.equal(false);
  });

  it('should have correct dynamic values', () => {
    // @ts-ignore
    const result = Security.executeRule(
      '$uid === "xxx" && $foo === "bar"',
      fakedRef,
      {},
      {},
      { $uid: 'xxx', $foo: 'bar' },
    );
    expect(result).to.equal(true);
  });

});

describe('(Security) has/check permission', () => {

  beforeEach(before);
  afterEach(after);

  const fakedRef: any = {
    root: () => ({}) as any,
  };

  it('#hasPermission should return true (admin)', () => {
    // @ts-ignore
    Security.Sheets.options.security = false;
    // @ts-ignore
    const result = Security.hasPermission('read', [], fakedRef);
    expect(result).to.equal(true);
  });

  it('#hasPermission should return true (auth admin)', () => {
    // @ts-ignore
    Security.auth = { isAdmin: true };
    // @ts-ignore
    const result = Security.hasPermission('read', ['users'], fakedRef);
    expect(result).to.equal(true);
  });

  it('#hasPermission return true (right away, no #executeRule)', () => {
    // @ts-ignore
    const result = Security.hasPermission('read', [], fakedRef);
    expect(result).to.equal(true);
  });

  it('#hasPermission should return false (right away, no #executeRule)', () => {
    // @ts-ignore
    const result = Security.hasPermission('read', ['users'], fakedRef);
    expect(result).to.equal(false);
  });

});
