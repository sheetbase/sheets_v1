import * as Sheets from './public_api';

// test helpers
function describe_(description: string, handler: () => void) {
    Logger.log(description);
    return handler();
}

function it_(description: string, result: () => boolean) {
    if (result()) {
        Logger.log('   (OK) ' + description);
    } else {
        Logger.log('   [FAILED] ' + description);
    }
}

// create sheets instance
function load_() {
    return Sheets.sheets({
        databaseId: '1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI',
        keyFields: { bax: 'xxx' },
        security: {
            foo: { '.read': true, '.write': true },
            bar: { '.read': true },
            baz: { '.read': false, '.write': true },
            bax: {
                $xxx: {
                    '.read': '$xxx == "abc" || $xxx == "xyz"',
                },
            },
        },
    });
}

function test() {
    const describe = describe_;
    const it = it_;
    const Sheets = load_();

    describe('Root ref', () => {

        it('Generate auto key', () => {
            const key = Sheets.ref().key();
            return (typeof key === 'string');
        });

        it('Read (fail for no read permission)', () => {
            let error = null;
            try {
                Sheets.ref().toObject();
            } catch (err) {
                error = err;
            }
            return !!error;
        });

        it('Write (can not update root ref)', () => {
            let error = null;
            try {
                Sheets.ref().update({ a: 1, b: 2 });
            } catch (err) {
                error = err;
            }
            return !!error;
        });

    });

    describe('Foo table', () => {

        it('Get all foo', () => {
            const foo = Sheets.all('foo');
            return (foo.length === 3);
        });

        it('Get a foo', () => {
            const foo = Sheets.item<any>('foo', 'foo-3');
            return (foo.title === 'Foo 3');
        });

        it('Query foo', () => {
            const foo = Sheets.query<any>('foo', item => {
                return (!!item.content && item.content.indexOf('Hello') > -1);
            });
            return (foo.length === 2);
        });

        it('Add a foo', () => {
            Sheets.add('foo', 'foo-x', { title: 'Foo x', content: 'Foo x content.' });
            const foo = Sheets.item<any>('foo', 'foo-x');
            return (foo.title === 'Foo x');
        });

        it('Add a foo (auto key)', () => {
            Sheets.add('foo', null, { title: 'Foo auto', content: 'Foo auto content.' });
            // clean up
            const sheet = Sheets.spreadsheet.getSheetByName('foo');
            sheet.deleteRow(sheet.getLastRow());
            return true;
        });

        it('Update a foo', () => {
            Sheets.update('foo', 'foo-x', { content: 'Foo x new content!' });
            const foo = Sheets.item<any>('foo', 'foo-x');
            return (foo.content === 'Foo x new content!');
        });

        it('Delete a foo', () => {
            Sheets.remove('foo', 'foo-x');
            const foo = Sheets.item<any>('foo', 'foo-x');
            return (foo === null);
        });

    });

    describe('Bar table', () => {

        it('Get all bar', () => {
            const bar = Sheets.all('bar');
            return (bar.length === 3);
        });

        it('Get a bar', () => {
            const bar = Sheets.item<any>('bar', 'bar-2');
            return (bar.title === 'Bar 2');
        });

        it('Query bar', () => {
            const bar = Sheets.query<any>('bar', item => {
                return (!!item.content && item.content.indexOf('Hello') > -1);
            });
            return (bar.length === 1);
        });

        it('Add a bar (fail for no read permission)', () => {
            let error = null;
            try {
                Sheets.add('bar', 'bar-x', { title: 'Bar x', content: 'Bar x content.' });
            } catch (err) {
                error = err;
            }
            return !!error;
        });

        it('Update a bar (fail for no read permission)', () => {
            let error = null;
            try {
                Sheets.update('bar', 'bar-x', { content: 'Bar x new content!' });
            } catch (err) {
                error = err;
            }
            return !!error;
        });

        it('Delete a bar (fail for no read permission)', () => {
            let error = null;
            try {
                Sheets.remove('bar', 'bar-x');
            } catch (err) {
                error = err;
            }
            return !!error;
        });

    });

    describe('Baz table', () => {

        it('Get all baz (fail for no read permission)', () => {
            let error = null;
            try {
                const baz = Sheets.all('baz');
            } catch (err) {
                error = err;
            }
            return !!error;
        });

        it('Get a baz (fail for no read permission)', () => {
            let error = null;
            try {
                const baz = Sheets.item<any>('baz', 'baz-2');
            } catch (err) {
                error = err;
            }
            return !!error;
        });

        it('Query baz (fail for no read permission)', () => {
            let error = null;
            try {
                const baz = Sheets.query<any>('baz', item => {
                    return (!!item.content && item.content.indexOf('Baz') > -1);
                });
            } catch (err) {
                error = err;
            }
            return !!error;
        });

        it('Add a baz', () => {
            let error = null;
            try {
                Sheets.add('baz', 'baz-x', { title: 'Baz x', content: 'Baz x content.' });
            } catch (err) {
                error = err;
            }
            return !error;
        });

        it('Update a baz', () => {
            let error = null;
            try {
                Sheets.update('baz', 'baz-x', { content: 'Baz x new content!' });
            } catch (err) {
                error = err;
            }
            return !error;
        });

        it('Delete a baz', () => {
            let error = null;
            try {
                Sheets.remove('baz', 'baz-x');
            } catch (err) {
                error = err;
            }
            return !error;
        });

    });

    describe('Bax table', () => {

        it('Get all bax (fail for no permission)', () => {
            let error = null;
            try {
                const bax = Sheets.all('bax');
            } catch (err) {
                error = err;
            }
            return !!error;
        });

        it('Get a bax (has permission)', () => {
            const bax = Sheets.item('bax', 'abc');
            return !!bax;
        });

        it('Get a bax (fail for no permission)', () => {
            let error = null;
            try {
                const bax = Sheets.item('bax', 'def');
            } catch (err) {
                error = err;
            }
            return !!error;
        });

        it('Query bax (has permission)', () => {
            const bax = Sheets.query<any>('bax', item => {
                return (item.xxx === 'abc' || item.xxx === 'xyz');
            });
            return (bax.length === 2);
        });

        it('Query bax (fail for no permission)', () => {
            let error = null;
            try {
                const bax = Sheets.query<any>('bax', item => {
                    return (!!item.content);
                });
            } catch (err) {
                error = err;
            }
            return !!error;
        });

    });
}
