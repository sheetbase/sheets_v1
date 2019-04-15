// turn [[],[], ...] to [{},{}, ...]
export function translateRangeValues<Item>(
  values: any[][],
  noHeader = false,
  modifier = item => item,
) {
  values = values || [];
  // get header
  const headers: string[] = !noHeader ? values.shift() : [];
  // build data
  const result: Item[] = [];
  for (let i = 0; i < values.length; i++) {
    const item: Item = {} as any;
    // process columns
    const rows = values[i] || [];
    for (let j = 0; j < rows.length; j++) {
      if (rows[j]) {
        item[headers[j] || ('value' + (j + 1))] = rows[j];
      }
    }
    if (Object.keys(item).length > 0) {
      item['_row'] = !noHeader ? i + 2 : i + 1;
      result.push(modifier(item));
    }
  }
  return result;
}

// convert string of data load from spreadsheet to correct data type
export function parseData<Item>(item: Item): Item {
  for (const key of Object.keys(item)) {
    if (item[key] === '' || item[key] === null || item[key] === undefined) {
      // delete null key
      delete item[key];
    } else if ((item[key] + '').toLowerCase() === 'true') {
      // boolean TRUE
      item[key] = true;
    } else if ((item[key] + '').toLowerCase() === 'false') {
      // boolean FALSE
      item[key] = false;
    } else if (!isNaN(item[key])) {
      // number
      item[key] = Number(item[key]);
    } else if (
      typeof item[key] === 'string' &&
      (
        (item[key].substr(0, 1) === '{' && item[key].substr(-1) === '}') ||
        (item[key].substr(0, 1) === '[' && item[key].substr(-1) === ']')
      )
    ) {
      // JSON
      try {
        item[key] = JSON.parse(item[key]);
      } catch (e) {
        // continue
      }
    }
  }
  return item;
}

// convert some types to string for saving to spreadsheet
export function stringifyData(obj: {}) {
  for (const key of Object.keys(obj)) {
    // object
    if (obj[key] instanceof Object) {
      obj[key] = JSON.stringify(obj[key]);
    }
  }
  return obj;
}

export function o2a<Obj, K extends keyof Obj, P extends Obj[K]>(
  object: Obj,
  keyName = '$key',
): Array<(P extends {[key: string]: any} ? P: {value: P}) & {$key: string}> {
  const arr = [];
  for (const key of Object.keys(object || {})) {
    if (object[key] instanceof Object) {
      object[key][keyName] = key;
    } else {
      const value = object[key];
      object[key] = {};
      object[key][keyName] = key;
      object[key]['value'] = value;
    }
    arr.push(object[key]);
  }
  return arr;
}

export function uniqueId(
  length = 12,
  startWith = '-',
): string {
  const maxLoop = length - 8;
  const ASCII_CHARS = startWith + '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  let lastPushTime = 0;
  const lastRandChars = [];
  let now = new Date().getTime();
  const duplicateTime = (now === lastPushTime);
  lastPushTime = now;
  const timeStampChars = new Array(8);
  let i;
  for (i = 7; i >= 0; i--) {
    timeStampChars[i] = ASCII_CHARS.charAt(now % 64);
    now = Math.floor(now / 64);
  }
  let uid = timeStampChars.join('');
  if (!duplicateTime) {
    for (i = 0; i < maxLoop; i++) {
      lastRandChars[i] = Math.floor(Math.random() * 64);
    }
  } else {
    for (i = maxLoop - 1; i >= 0 && lastRandChars[i] === 63; i--) {
      lastRandChars[i] = 0;
    }
    lastRandChars[i]++;
  }
  for (i = 0; i < maxLoop; i++) {
    uid += ASCII_CHARS.charAt(lastRandChars[i]);
  }
  return uid;
}
