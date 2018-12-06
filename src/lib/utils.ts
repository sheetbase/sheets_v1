// turn [[],[], ...] to [{},{}, ...]
export function translateRangeValues(
    values: any[][],
    noHeaders = false,
    modifier = (item) => item,
) {
    values = values || [];
    // get header
    const headers: string[] = !noHeaders ? values.shift() : [];
    // build data
    const result: Array<{}> = [];
    for (let i = 0; i < values.length; i++) {
        const rows = values[i] || [];
        const item = {};
        for (let j = 0; j < rows.length; j++) {
            if (rows[j]) {
                item[headers[j] || ('value' + (j + 1))] = rows[j];
            }
        }
        if (Object.keys(item).length > 0) {
            result.push(modifier(item));
        }
    }
    return result;
}

// convert string of data load from spreadsheet to correct data type
export function parseData(data: {}) {
    for (const key of Object.keys(data)) {
        if (data[key] === '' || data[key] === null || data[key] === undefined) {
            // delete null key
            delete data[key];
        } else if ((data[key] + '').toLowerCase() === 'true') {
            // boolean TRUE
            data[key] = true;
        } else if ((data[key] + '').toLowerCase() === 'false') {
            // boolean FALSE
            data[key] = false;
        } else if (!isNaN(data[key])) {
            // number
            // tslint:disable:ban radix
            if (Number(data[key]) % 1 === 0) {
                data[key] = parseInt(data[key]);
            }
            if (Number(data[key]) % 1 !== 0) {
                data[key] = parseFloat(data[key]);
            }
        } else {
            // JSON
            try {
                data[key] = JSON.parse(data[key]);
            } catch (e) {
                // continue
            }
        }
    }
    return data as any;
}

// convert some types to string for saving to spreadsheet
export function stringifyData(data: {}) {
    for (const key of Object.keys(data)) {
        // object
        if (data[key] instanceof Object) {
            data[key] = JSON.stringify(data[key]);
        }
    }
    return data as any;
}