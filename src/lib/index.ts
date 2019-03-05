import { Options } from './types';
import { SpreadsheetService } from './spreadsheet';
import { SheetsService } from './sheets';

// TODO: TODO
// add routing errors
// indexing & cache

export function spreadsheet(options?: Options): SpreadsheetService {
    return new SpreadsheetService(options);
}

export function sheets(options?: Options) {
    return new SheetsService(options);
}

export function sheetsAdmin(options?: Options) {
    return new SheetsService({ ... options, admin: true });
}
