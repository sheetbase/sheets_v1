import resolve from 'rollup-plugin-node-resolve';
import alias from 'rollup-plugin-alias';

export default {
    input: './dist/esm3/public_api.js',
    output: [
        {
            file: './dist/fesm3/sheetbase-sheets-server.js',
            format: 'esm',
            sourcemap: true
        },
        {
            file: './dist/bundles/sheetbase-sheets-server.umd.js',
            format: 'umd',
            sourcemap: true,
            name: 'Sheets'
        }
    ],
    plugins: [
        resolve(),
        alias({
            '../lodash/get': 'src/lodash/get.js',
            '../lodash/set': 'src/lodash/set.js',
            '../lodash/orderBy': 'src/lodash/orderBy.js',
            '../lunr/lunr': 'src/lunr/lunr.js'
        })
    ]
};
