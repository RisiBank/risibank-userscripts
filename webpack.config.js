const path = require('path');


const config = {
    target: 'node',
    entry: null, // Added by gulp
    output: {
        path: null, // Added by gulp
        filename: 'bundle.user.js',
    },
    module: {
        rules: [
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]?[hash]'
                }
            },
            {
                test: /\.css$/,
                use: [
                    'css-loader'
                ]
            },
            {
                test: /\.scss$/,
                use: [
                    'css-loader',
                    'sass-loader'
                ]
            },
        ]
    },
    resolve: {
        extensions: ['.js', '.json'],
    },
    optimization: {
        minimize: true,
    },
    devtool: false,
};


module.exports = config;
