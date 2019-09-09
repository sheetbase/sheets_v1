import { Options, Database } from './types';
import { SheetsService } from './sheets';

export const DATABASE: Database = {};

export function sheets(options: Options) {
  return new SheetsService(options, DATABASE);
}

export function sheetsAdmin(options: Options) {
  return sheets(options).toAdmin();
}
