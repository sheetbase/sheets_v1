import { o2a, uniqueId } from '@sheetbase/core-server';

import { SheetsService } from './sheets';
import { translateRangeValues, parseData } from './utils';

export class DataService {

  private Sheets: SheetsService;
  paths: string[];

  constructor(paths: string[], Sheets: SheetsService) {
    this.paths = paths;
    this.Sheets = Sheets;
  }

  private loadDataBySheet<Item>(sheetName: string, fresh = false) {
    if (!this.Sheets.database[sheetName] || fresh) {
      // load raw items
      const rawItems = translateRangeValues(
        this.Sheets.spreadsheet.getRange(sheetName + '!A1:Z').getValues());
      // process items
      const items: {[$key: string]: Item} = {};
      for (let i = 0; i < rawItems.length; i++) {
        const item = parseData(rawItems[i]);
        // get item key
        const key = item[this.Sheets.options.keyFields[sheetName] || 'key'];
        // add 'id' & '$key'
        item['$key'] = key;
        item['id'] = item['id'] ? item['id'] : (item['#'] || null);
        // set items
        items[key] = item;
      }
      // save to database
      this.Sheets.database[sheetName] = items;
    }
    return this.Sheets.database[sheetName];
  }

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

  private val() {
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
    return new DataService([], this.Sheets);
  }

  parent() {
    const paths = [ ... this.paths ];
    if (paths.length > 0) {
      paths.pop();
      return new DataService(paths, this.Sheets);
    } else {
      return this.root();
    }
  }

  child(path: string) {
    const childPaths = path.split('/').filter(Boolean);
    const paths = [ ... this.paths, ... childPaths ];
    return new DataService(paths, this.Sheets);
  }

  /**
   * read
   */

  key(): string {
    return uniqueId(27);
  }

  toObject() {
    this.Sheets.Security.checkpoint('read', this.paths, this);
    return this.val();
  }

  toArray() {
    return o2a(this.toObject());
  }

  query<Item>(filter: (item: Item) => boolean) {
    const result: Item[] = [];
    // go through items, filter and check for security
    const items = this.val();
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
   * add/update/remove
   */

  update<Data>(data: Data = null) {
    if (this.paths.length > 0) {
      const [ sheetName, pathKey ] = this.paths;
      // load data
      const items = this.loadDataBySheet(sheetName);
      const sheet = this.Sheets.spreadsheet.getSheetByName(sheetName);
      // prepare data
      const key = pathKey || this.key();
      let item = items[key];
      // start actions
      if (!data) { // remove
        if (!!item) {
          const { _row } = item;
          delete items[key]; // remove from database
          sheet.deleteRow(_row);
        }
      } else {
        let _row: number;
        if (!!item) { // update
          _row = item._row;
          // modify item
          item = {
            ... item,
            ... data,
            '#': item['#'],
            [this.Sheets.options.keyFields[sheetName] || 'key']: key,
            _row,
          };
          items[key] = item; // update in database
        } else { // new
          // retrieve last row
          const lastRow = sheet.getLastRow();
          const lastItemId = sheet.getRange('A' + lastRow + ':' + lastRow).getValues()[0][0];
          _row = lastRow + 1;
          // modify item
          item = {
            ... data,
            '#': lastItemId + 1,
            [this.Sheets.options.keyFields[sheetName] || 'key']: key,
            _row,
          };
          items[key] = item; // add item to database
        }
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
        // check permission
        this.Sheets.Security.checkpoint('write', this.paths, this, item);
        // update values
        sheet.getRange('A' + _row + ':' + _row).setValues([values]);
      }
    } else {
      throw new Error('Can not modify root ref.');
    }
  }

}