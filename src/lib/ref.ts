import { SheetsService } from './sheets';
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
        const item = parseData(rawItems[i]);
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
    const sheetNames = [];
    for (let i = 0; i < sheets.length; i++) {
      const sheetName = sheets[i].getName();
      if (
        sheetName.substr(0, 2) === '__' &&
        sheetName.substr(sheetName.length - 2, 2) === '__'
      ) {
        // meta sheets
      } else {
        sheetNames.push(sheetName);
      }
    }
    // load data sheet by sheet
    for (let i = 0; i < sheetNames.length; i++) {
      this.loadDataBySheet(sheetNames[i]);
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

  query<Item>(filter: (item: Item) => boolean) {
    const result: Item[] = [];
    // go through items, filter and check for security
    const items = this.data();
    for (const key of Object.keys(items)) {
      const item = items[key];
      if (filter(item)) {
        const itemRef = this.child(key);
        this.Sheets.Security.checkpoint('read', itemRef.paths, itemRef);
        result.push(item);
      }
    }
    return result;
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

      // load data
      const items = this.loadDataBySheet(sheetName);
      const sheet = this.Sheets.spreadsheet.getSheetByName(sheetName);

      // prepare data
      const itemKey = _itemKey || this.key();
      let item = items[itemKey];
      let _row: number;
      if (!data && !!item) { // remove
        _row = item._row;
      } else if (!!data && !!item) { // update
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
      } else if (!!data && !item) { // new
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

      // start actions
      if (!data && !!item) { // remove
        delete items[itemKey]; // remove from database
        sheet.deleteRow(_row);
      } else if (!!data) { // update / new
        items[itemKey] = item; // add item to database
        // turn data to array
        const values = [];
        const [ headers ] = sheet.getRange('A1:1').getValues();
        for (let i = 0; i < headers.length; i++) {
          const header = headers[i];
          // value
          let value = item[header];
          if (value instanceof Object) {
            value = JSON.stringify(value);
          }
          values.push(value || '');
        }
        // set values
        sheet.getRange('A' + _row + ':' + _row).setValues([values]);
        return item;
      }

    } else {
      throw new Error('Can not modify root ref.');
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
    } else {
      throw new Error('Only increasing item ref data.');
    }
  }

}