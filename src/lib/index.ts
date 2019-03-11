import { Options } from './types';
import { SheetsService } from './sheets';

export function sheets(options: Options) {
    return new SheetsService(options);
}

export function sheetsAdmin(options: Options) {
    return new SheetsService({ ... options, security: false });
}
