import { Filter, AdvancedFilter, Query, DataSegment } from './types';

export function buildQuery(filter: Filter) {
  if (!filter['where']) { // shorthand query
    const where = Object.keys(filter)[0];
    const equal = filter[where];
    delete filter[where]; // remove shorthand value from filter
    filter['where'] = where;
    filter['equal'] = equal;
  }
  return filter as Query;
}

export function buildAdvancedFilter(query: Query) {
  let advancedFilter: AdvancedFilter;
  // build advanced filter
  const {
    where,
    equal,
    exists,
    contains,
    lt, lte,
    gt, gte,
    childExists,
    childEqual,
  } = query as Query;
  if (!!equal) { // where/equal
    advancedFilter = item => (!!item[where] && item[where] === equal);
  } else if (typeof exists === 'boolean') { // where/exists/not exists
    advancedFilter = item => (!!exists ? !!item[where] : !item[where]);
  } else if (!!contains) { // where/contains
    advancedFilter = item => (
      typeof item[where] === 'string' &&
      item[where].indexOf(contains) > -1
    );
  } else if (!!lt) { // where/less than
    advancedFilter = item => (
      typeof item[where] === 'number' &&
      item[where] < lt
    );
  } else if (!!lte) { // where/less than or equal
    advancedFilter = item => (
      typeof item[where] === 'number' &&
      item[where] <= lte
    );
  } else if (!!gt) { // where/greater than
    advancedFilter = item => (
      typeof item[where] === 'number' &&
      item[where] > gt
    );
  } else if (!!gte) { // where/greater than or equal
    advancedFilter = item => (
      typeof item[where] === 'number' &&
      item[where] >= gte
    );
  } else if (!!childExists) { // where/child exists, not exists
    const notExists = childExists.substr(0, 1) === '!';
    const child = notExists ? childExists.replace('!', '') : childExists;
    advancedFilter = item => {
      if (!item[where] && notExists) {
        return true; // child always not exists
      } else if (!!item[where]) {
        if (item[where] instanceof Array) {
          return notExists ?
            (item[where].indexOf(child) < 0) :
            (item[where].indexOf(child) > -1);
        } else if (item[where] instanceof Object) {
          return notExists ? !item[where][child] : !!item[where][child];
        }
      }
      return false;
    };
  } else if (!!childEqual) { // where/child equal, not equal
    let notEqual: boolean;
    let childKey: string;
    let childValue: any;
    if (childEqual.indexOf('!=') > -1) {
      notEqual = true;
      const keyValue = childEqual.split('!=').filter(Boolean);
      childKey = keyValue[0];
      childValue = keyValue[1];
    } else {
      const keyValue = childEqual.split('=').filter(Boolean);
      childKey = keyValue[0];
      childValue = keyValue[1];
    }
    if (!isNaN(childValue)) {
      childValue = Number(childValue);
    }
    advancedFilter = item => {
      if (!item[where] && notEqual) {
        return true; // always not equal
      } else if (!!item[where]) {
        return  (
          item[where] instanceof Object &&
          (notEqual ?
            (!item[where][childKey] || item[where][childKey] !== childValue) :
            (!!item[where][childKey] && item[where][childKey] === childValue)
          )
        );
      }
      return false;
    };
  }
  return advancedFilter;
}

export function buildSegmentFilter<Item>(segment: DataSegment) {
  const segmentFilter = (item: Item): boolean => {
    let result = false;
    const segmentArr = Object.keys(segment || {});
    if (!segmentArr.length) {
      result = true;
    }
    // from 1-3
    else if (segmentArr.length < 4) {
      const [ first, second, third ] = segmentArr;
      result = (
        // 1st
        (
          !item[first] ||
          item[first] === segment[first]
        ) &&
        // 2nd
        (
          !second ||
          !item[second] ||
          item[second] === segment[second]
        ) &&
        // 3rd
        (
          !third ||
          !item[third] ||
          item[third] === segment[third]
        )
      );
    }
    // over 3
    else {
      result = true; // assumpt
      for (let i = 0; i < segmentArr.length; i++) {
        const seg = segmentArr[i];
        // any not matched
        if (
          !!item[seg] &&
          item[seg] !== segment[seg]
        ) {
          result = false;
          break;
        }
      }
    }
    return result;
  };
  return segmentFilter;
}
