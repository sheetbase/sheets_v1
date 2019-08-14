import { SheetsService } from './sheets';
import { DataSegment } from './types';
import { buildSegmentFilter } from './filter';
import { translateRangeValues, parseData, o2a, uniqueId } from './utils';

export class RefService {
  private Sheets: SheetsService;

  private paths: string[];

  constructor(paths: string[], Sheets: SheetsService) {
    this.paths = paths;
    this.Sheets = Sheets;
  }

  private keyField(sheetName: string) {
    return this.Sheets.options.keyFields[sheetName] || '$key';
  }

  // load sheet data
  private loadDataBySheet<Item>(sheetName: string, fresh = false) {
    if (!this.Sheets.database[sheetName] || fresh) {
      // load raw items
      const rawItems = translateRangeValues(
        this.Sheets.spreadsheet.getRange(sheetName + '!A1:ZZ').getValues());
      // process items
      const items: {[$key: string]: Item} = {};
      for (let i = 0; i < rawItems.length; i++) {
        const item = parseData<Item>(rawItems[i] as Item);
        // get item key
        const key = item[this.keyField(sheetName)];
        // add '$key' field
        item['$key'] = key;
        // set items
        items[key] = item;
      }
      // save to database
      this.Sheets.database[sheetName] = items;
    }
    return this.Sheets.database[sheetName];
  }

  // load all data
  private loadRootData() {
    // load all sheets
    const sheets = this.Sheets.spreadsheet.getSheets();
    // load data sheet by sheet
    for (let i = 0; i < sheets.length; i++) {
      const sheetName = sheets[i].getName();
      if (
        sheetName.substr(0, 2) === '__' &&
        sheetName.substr(sheetName.length - 2, 2) === '__'
      ) {
        // meta sheets
        // ignore
      } else {
        this.loadDataBySheet(sheetName);
      }
    }
    return this.Sheets.database;
  }

  // get data at this ref location
  private data() {
    const [ sheetName, ...paths ] = this.paths;
    let data = {};
    if (!sheetName) { // root data
      data = { ... this.loadRootData() };
    } else { // sheet data
      data = { ... this.loadDataBySheet(sheetName) };
    }
    // get deep
    for (let i = 0; i < paths.length; i++) {
      if (data instanceof Object) {
        data = data[paths[i]] || null;
      } else {
        data = null; break;
      }
    }
    return data;
  }

  /**
   * ref navigation
   */
  root() {
    return new RefService([], this.Sheets);
  }

  parent() {
    const paths = [ ... this.paths ];
    if (paths.length > 0) {
      paths.pop();
      return new RefService(paths, this.Sheets);
    } else {
      return this.root();
    }
  }

  child(path: string) {
    const childPaths = path.split('/').filter(Boolean);
    const paths = [ ... this.paths, ... childPaths ];
    return new RefService(paths, this.Sheets);
  }

  /**
   * read data
   */

  key(length = 27, startWith = '-'): string {
    return uniqueId(length, startWith);
  }

  toObject() {
    this.Sheets.Security.checkpoint('read', this.paths, this);
    return this.data();
  }

  toArray() {
    return o2a(this.toObject());
  }

  query<Item>(
    advancedFilter: (item: Item) => boolean,
    segment: DataSegment = null,
  ) {
    if (this.paths.length === 1) {
      const result: Item[] = [];
      // build segment filter
      const segmentFilter = buildSegmentFilter<Item>(segment);
      // go through items, filter and check for security
      const items = this.data();
      for (const key of Object.keys(items)) {
        const item = items[key];
        if (
          !!segmentFilter(item) &&
          !!advancedFilter(item)
        ) {
          const itemRef = this.child(key);
          this.Sheets.Security.checkpoint('read', itemRef.paths, itemRef);
          result.push(item);
        }
      }
      return result;
    } else {
      throw new Error('Can only query list ref.');
    }
  }

  /**
   * add/update/remove/...
   */

  set<Item, Data>(data: Data = null): Item {
    return this.update(data, true);
  }

  update<Item, Data>(data: Data = null, clean = false): Item {
    if (this.paths.length > 0) {
      const [ sheetName, _itemKey ] = this.paths;

      // get sheet
      const sheet = this.Sheets.spreadsheet.getSheetByName(sheetName);

      // get item
      const items = this.loadDataBySheet(sheetName);
      const itemKey = _itemKey || this.key();
      let item = items[itemKey];

      // determine which action
      let action: 'remove' | 'update' | 'new';
      if (!data && !!item) { // remove
        action = 'remove';
      } else if (!!data && !!item) { // update
        action = 'update';
      } else if (!!data && !item) { // new
        action = 'new';
      }

      // prepare data
      let _row: number;
      if (action === 'remove') { // remove
        _row = item._row;
      } else if (action === 'update') { // update
        _row = item._row;
        const newItem = {
          ... data,
          '#': item['#'],
          [this.keyField(sheetName)]: itemKey,
          _row,
        };
        if (clean) { // set
          item = newItem;
        } else { // update
          item = {
            ... item,
            ... newItem,
          };
        }
      } else if (action === 'new') { // new
        const lastRow = sheet.getLastRow();
        const lastItemId = sheet.getRange('A' + lastRow + ':' + lastRow).getValues()[0][0];
        _row = lastRow + 1;
        item = {
          ... data,
          '#': !isNaN(lastItemId) ? (lastItemId + 1) : 1,
          [this.keyField(sheetName)]: itemKey,
          _row,
        };
      }

      // check permission
      this.Sheets.Security.checkpoint('write', this.paths, this, item, data);

      // build range values
      const rangeValues = [];
      const [ headers ] = sheet.getRange('A1:1').getValues();
      for (let i = 0; i < headers.length; i++) {
        if (action === 'remove') {
          rangeValues.push('');
        } else {
          let value = item[headers[i]];
          // stringify
          if (value instanceof Object) {
            value = JSON.stringify(value);
          }
          rangeValues.push(value || '');
        }
      }

      // set snapshot database
      if (action === 'remove') { // remove
        delete items[itemKey];
      } else { // update / new
        items[itemKey] = item;
      }

      // set live database
      sheet.getRange('A' + _row + ':' + _row).setValues([rangeValues]);
      return action === 'remove' ? null : item;
    } else {
      throw new Error('Can only modify list ref (new) and item ref.');
    }
  }

  increase(increasing: string | string[] | {[path: string]: number}) {
    if (this.paths.length === 2) {
      const item = this.data();
      const data: any = {}; // changed data
      // turn a path or array of paths to increasing object
      if (typeof increasing === 'string') {
        increasing = { [increasing]: 1 };
      } else if (increasing instanceof Array) {
        const _increasing = {};
        for (let i = 0; i < increasing.length; i++) {
          _increasing[increasing[i]] = 1;
        }
        increasing = _increasing;
      }
      // increase props
      for (const path of Object.keys(increasing)) {
        const [ itemKey, childKey ] = path.split('/').filter(Boolean);
        const increasedBy = increasing[path] || 1;
        if (!isNaN(increasedBy)) { // only number
          // set value
          if (!!childKey) { // deep props
            const child = item[itemKey] || {};
            // only apply for object
            if (child instanceof Object) {
              // only for number prop
              if (
                !child[childKey] ||
                (!!child[childKey] && typeof child[childKey] === 'number')
              ) {
                // set child
                child[childKey] = (child[childKey] || 0) + increasedBy;
                // set item
                item[itemKey] = child;
                // set changed
                data[itemKey] = child;
              }
            }
          } else { // direct prop
            // only for number prop
            if (
              !item[itemKey] ||
              (!!item[itemKey] && typeof item[itemKey] === 'number')
            ) {
              // set item
              item[itemKey] = (item[itemKey] || 0) + increasedBy;
              // set changed
              data[itemKey] = item[itemKey];
            }
          }
        }
      }
      // finally
      // save changed data to database
      this.update(data);
      return item;
    } else {
      throw new Error('Can only increasing item ref.');
    }
  }

}