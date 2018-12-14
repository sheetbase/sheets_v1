import { expect } from 'chai';
import { describe, it } from 'mocha';

import { SecurityService } from '../src/lib/security';

const Security = new SecurityService({
    securityRules: {
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
    },
});

describe('(Security) .options', () => {

    it('should have default values', () => {
        const Security = new SecurityService();
        // @ts-ignore
        expect(Security.options).to.eql({
            admin: false,
            securityRules: {},
        });
    });

    it('should have values', () => {
        const options = {
            admin: true,
            securityRules: {
                '.read': true, '.write': true,
            },
        };
        const Security = new SecurityService(options);
        // @ts-ignore
        expect(Security.options).to.eql(options);
    });

});

describe('(Security) misc methods (#setRequest, #addRules)', () => {

    const Security = new SecurityService();

    it('#setRequest should work', () => {
        Security.setRequest(true as any);
        // @ts-ignore
        expect(Security.request).to.equal(true);
    });

    it('#addRules should work', () => {
        Security.addRules({
            blah: { '.read': true },
        });
        // @ts-ignore
        expect(Security.options.securityRules).to.eql({
            blah: { '.read': true },
        });
    });

});

describe('(Security) #parseRule (.rule)', () => {

    it('should have default values for root path', () => {
        const Security = new SecurityService();
        const result1 = Security.parseRule('/', 'read');
        const result2 = Security.parseRule('/', 'write');
        expect(result1.rule).to.equal(false);
        expect(result2.rule).to.equal(false);
    });

    it('should have values for root path', () => {
        const result1 = Security.parseRule('/', 'read');
        const result2 = Security.parseRule('/', 'write');
        expect(result1.rule).to.equal(true);
        expect(result2.rule).to.equal(true);
    });

    it('should have latest values for invalid path', () => {
        const result1 = Security.parseRule('/xxx', 'read');
        const result2 = Security.parseRule('/xxx', 'write');
        expect(result1.rule).to.equal(true);
        expect(result2.rule).to.equal(true);
    });

    it('should have latest values for invalid format', () => {
        const result1 = Security.parseRule('/foo', 'read');
        const result2 = Security.parseRule('/foo', 'write');
        expect(result1.rule).to.equal(true);
        expect(result2.rule).to.equal(true);
    });

    it('should inherit values', () => {
        const result1 = Security.parseRule('/posts', 'read');
        const result2 = Security.parseRule('/posts', 'write');
        expect(result1.rule).to.equal(true);
        expect(result2.rule).to.equal(true);
    });

    it('should override values', () => {
        const result1 = Security.parseRule('/users', 'read');
        const result2 = Security.parseRule('/users', 'write');
        expect(result1.rule).to.equal(false);
        expect(result2.rule).to.equal(false);
    });

    it('should use dynamic field', () => {
        const result1 = Security.parseRule('/users/uid-xxx', 'read');
        const result2 = Security.parseRule('/users/uid-xxx', 'write');
        expect(result1.rule).to.equal('$uid === auth.uid');
        expect(result2.rule).to.equal('$uid === auth.uid');
    });

    it('should not use dynamic field (has the specific field)', () => {
        const result1 = Security.parseRule('/posts/content', 'read');
        const result2 = Security.parseRule('/posts/content', 'write');
        expect(result1.rule).to.equal(true);
        expect(result2.rule).to.equal(true);
    });

    it('should use dynamic field (not has the specific field)', () => {
        const result1 = Security.parseRule('/posts/title', 'read');
        const result2 = Security.parseRule('/posts/title', 'write');
        expect(result1.rule).to.equal(false);
        expect(result2.rule).to.equal(false);
    });

    it('should use dynamic field, deeper & multiple', () => {
        const result1 = Security.parseRule('/posts/content/sec1/h1', 'read');
        const result2 = Security.parseRule('/posts/content/sec1/h1', 'write');
        expect(result1.rule).to.equal('$section === "xxx"');
        expect(result2.rule).to.equal(false);
    });

});

describe('(Security) #parseRule (.dynamicData)', () => {

    it('should use dynamic field', () => {
        const result = Security.parseRule('/users/uid-xxx', 'read');
        expect(result.dynamicData).to.eql({ $uid: 'uid-xxx' });
    });

    it('should use dynamic field, deeper & multiple', () => {
        const result = Security.parseRule('/posts/content/sec1/h1', 'read');
        expect(result.dynamicData).to.eql({ $section: 'sec1', $header: 'h1' });
    });
});

describe('(Security) #executeRule', () => {

    it('should return false (throw error)', () => {
        const result = Security.executeRule('throw null');
        expect(result).to.equal(false);
    });

    it('should have correct .now', () => {
        const result = Security.executeRule('typeof now === "number"');
        expect(result).to.equal(true);
    });

    it('should have correct .auth', () => {
        const result = Security.executeRule('auth instanceof Object');
        expect(result).to.equal(true);
    });

    it('should have correct .data', () => {
        const result = Security.executeRule(
            'data.a === 1 && data.b !== 1',
            { a: 1, b: 2 },
        );
        expect(result).to.equal(true);
    });

    it('should have correct .newData', () => {
        const result = Security.executeRule(
            'newData.a === "xxx"', {},
            { a: 'xxx' },
        );
        expect(result).to.equal(true);
    });

    it('should have correct dynamic values', () => {
        const result = Security.executeRule(
            '$uid === "uid-xxx" && $foo === "bar"', {}, {},
            { $uid: 'uid-xxx', $foo: 'bar' },
        );
        expect(result).to.equal(true);
    });

});

describe('(Security) has/check permission', () => {

    it('#hasPermission should return true (admin)', () => {
        const Security = new SecurityService({ admin: true });
        const result = Security.hasPermission('read', '/');
        expect(result).to.equal(true);
    });

    it('#hasPermission return true (right away, no #executeRule)', () => {
        const result = Security.hasPermission('read', '/');
        expect(result).to.equal(true);
    });

    it('#hasPermission should return false (right away, no #executeRule)', () => {
        const result = Security.hasPermission('read', '/users');
        expect(result).to.equal(false);
    });

    it('#hasReadPermission should work', () => {
        const result = Security.hasReadPermission('/');
        expect(result).to.equal(true);
    });

    it('#hasWritePermission should work', () => {
        const result = Security.hasWritePermission('/');
        expect(result).to.equal(true);
    });

    it('#checkReadPermission should work', () => {
        expect(
            Security.checkReadPermission.bind(Security, '/users'),
        ).to.throw('No read permission.');
    });

    it('#checkWritePermission should work', () => {
        expect(
            Security.checkWritePermission.bind(Security, '/users'),
        ).to.throw('No write permission.');
    });

});

describe('(Security) #isPrivate', () => {

    it('should be true', () => {
        const result1 = Security.isPrivate('foo');
        const result2 = Security.isPrivate('_foo');
        const result3 = Security.isPrivate('__foo');
        expect(result1).to.equal(false);
        expect(result2).to.equal(true);
        expect(result3).to.equal(true);
    });

    it('should be not true (admin right)', () => {
        const Security = new SecurityService({ admin: true });

        const result1 = Security.isPrivate('foo');
        const result2 = Security.isPrivate('_foo');
        const result3 = Security.isPrivate('__foo');
        expect(result1).to.equal(false);
        expect(result2).to.equal(false);
        expect(result3).to.equal(false);
    });

});

describe('(Security) is private X methods', () => {

    it('#isPrivateSheet', () => {
        const result1 = Security.isPrivateSheet('_foo'); // yes
        const result2 = Security.isPrivateSheet('foo');
        expect(result1).to.equal(true);
        expect(result2).to.equal(false);
    });

    it('#isPrivateRow', () => {
        const result1 = Security.isPrivateRow('_foo-1'); // yes
        const result2 = Security.isPrivateRow('foo-1');
        expect(result1).to.equal(true);
        expect(result2).to.equal(false);
    });

    it('#isPrivateColumn (data is not an object)', () => {
        const result1 = Security.isPrivateColumn('a value'); // yes
        const result2 = Security.isPrivateColumn('a value', '_a-key'); // yes
        const result3 = Security.isPrivateColumn('a value', 'a-key');
        expect(result1).to.equal(true);
        expect(result2).to.equal(true);
        expect(result3).to.equal(false);
    });

    it('#isPrivateColumn (data = object)', () => {
        const result1 = Security.isPrivateColumn({ a: 1, _b: 2, c: 3 }); // yes
        const result2 = Security.isPrivateColumn({ a: 1, b: 2 });
        expect(result1).to.equal(true);
        expect(result2).to.equal(false);
    });

});

describe('(Security) #checkPrivate', () => {

    it('private sheet', () => {
        expect(Security.checkPrivate.bind(Security, { sheetName: '_foo' })).to.throw('Private sheet.');
    });

    it('private row', () => {
        expect(Security.checkPrivate.bind(Security, { key: '_foo-1' })).to.throw('Private row.');
    });

    it('private properties', () => {
        expect(
            Security.checkPrivate.bind(Security, { data: { a: 1, _b: 2 } }),
        ).to.throw('Data contains private columns.');
    });

    it('private column, not provided dataKey', () => {
        expect(
            Security.checkPrivate.bind(Security, { data: 'value' }),
        ).to.throw('Data contains private columns.');
    });

    it('private column', () => {
        expect(
            Security.checkPrivate.bind(Security, { data: 'value', dataKey: '_me' }),
        ).to.throw('Data contains private columns.');
    });

});
