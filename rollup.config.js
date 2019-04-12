import resolve from 'rollup-plugin-node-resolve';

export default {
    input: './dist/esm3/public_api.js',
    output: [
        {
            file: './dist/fesm3/sheetbase-sheets.js',
            format: 'esm',
            sourcemap: true
        },
        {
            file: './dist/bundles/sheetbase-sheets.umd.js',
            format: 'umd',
            sourcemap: true,
            name: 'Sheets'
        }
    ],
    plugins: [
        resolve()
    ]
};
