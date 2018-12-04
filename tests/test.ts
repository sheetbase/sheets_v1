import { expect } from 'chai';
import { describe, it } from 'mocha';

import { sheets } from '../src/public_api';

const Sheets = sheets({ databaseId: '1Zz5kvlTn2cXd41ZQZlFeCjvVR_XhpUnzKlDGB8QsXoI' });

describe('Sheets module test', () => {

    it('Sheets service should be created', () => {
        expect(!!Sheets).to.equal(true);
    });

});