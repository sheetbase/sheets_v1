import { expect } from 'chai';
import { describe, it } from 'mocha';

import { sheets, sheetsAdmin, SheetsService } from '../src/public_api';

global['SpreadsheetApp'] = {};

/**
 * test start
 */

describe('Module creation', () => {

  it('Sheets service should be created', () => {
    global['SpreadsheetApp'].openById = () => true;
    const Sheets = sheets({ databaseId: 'database_id_xxx' });
    expect(Sheets instanceof SheetsService).to.equal(true);
  });

  it('SheetsAdmin should be created', () => {
    global['SpreadsheetApp'].openById = () => true;
    const SheetsAdmin = sheetsAdmin({ databaseId: 'database_id_xxx' });
    expect(SheetsAdmin instanceof SheetsService).to.equal(true);
  });

});
