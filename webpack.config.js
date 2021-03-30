const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// const apiHost = 'http://localhost:7575';
// const apiHost = 'https://api.hexabase.com';
const apiHost = 'https://az-api.hexabase.com';

const sseHost = 'http://localhost:5002';
const sseEventHost = process.env.ENV === 'local' ? 'http://localhost:5002' : '';

const config = {
  entry: {
    app: './app.js',
    gantt: './gantt.dependencies.js',
    vendor: './vendor.dependencies.js',
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist',
  },
  devtool: 'inline-source-map',
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true,
    contentBase: './dist',
    port: 4321,
    proxy: {
      '/event/publish': {
        target: `${sseHost}`,
        pathRewrite: {'^/event': '/api'},
        changeOrigin: true,
      },
      '/api': {
        target: `${apiHost}`,
        pathRewrite: {'^/api': '/api/v0'},
        changeOrigin: true,
      }
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      SSE_EVENT_HOST: JSON.stringify(sseEventHost),
    }),
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'gantt', 'vendor']
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'ng-annotate-loader!babel-loader',
      },
      {
        test: /\.html$/,
        loaders: ["html-loader"]
      },
      {
        test: /\.css$/,
        use: [{
          loader: "style-loader" // creates style nodes from JS strings
        }, {
          loader: "css-loader" // translates CSS into CommonJS
        }]
      },
      {
        test: require.resolve('css-element-queries/src/ResizeSensor'),
        loader: 'script-loader'
      },
      {
        test: require.resolve('css-element-queries/src/ElementQueries'),
        loader: 'script-loader'
      },
      {
        test: require.resolve('moment'),
        loader: 'exports-loader?window.moment!script-loader'
      },
      {
        test: require.resolve('angular-gantt'),
        loader: 'script-loader'
      },
      {
        test: /\.(jpe?g|png|gif|woff|woff2|eot|ttf|svg)(\?[a-z0-9=.]+)?$/,
        loader: 'url-loader?limit=100000'
      }
    ]
  }
};
module.exports = config;
