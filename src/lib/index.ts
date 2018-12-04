import { Options } from './types';
import { SheetsService } from './sheets';
import { SheetsSqlService } from './sql';
import { SheetsNosqlService } from './nosql';

export function sheets(options: Options): SheetsService {
    return new SheetsService(options);
}

export function sheetsNosql(options: Options): SheetsNosqlService {
    return new SheetsNosqlService(options);
}

export function sheetsSql(options: Options): SheetsSqlService {
    return new SheetsSqlService(options);
}
