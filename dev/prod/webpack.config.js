//
// Copyright © 2020 Anticrm Platform Contributors.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const Dotenv = require('dotenv-webpack')
const path = require('path')
const autoprefixer = require('autoprefixer')
const CompressionPlugin = require('compression-webpack-plugin')
const DefinePlugin = require('webpack').DefinePlugin
const { resolve } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin');

const mode = process.env.NODE_ENV || 'development'
const prod = mode === 'production'
const devServer = (process.env.CLIENT_TYPE ?? '') === 'dev-server'
const dev = (process.env.CLIENT_TYPE ?? '') === 'dev' || devServer

module.exports = {
  entry: {
    bundle: [
      '@anticrm/theme/styles/global.scss',
      ...(dev ? ['./src/main-dev.ts']: ['./src/main.ts'] ),
    ]
  },
  resolve: {
    symlinks: true,
    alias: {
      svelte: path.resolve('./node_modules', 'svelte'),
      '@anticrm/platform-rig/profiles/ui/svelte': path.resolve('./node_modules', 'svelte')
    },
    extensions: ['.mjs', '.js', '.svelte', '.ts'],
    mainFields: ['svelte', 'browser', 'module', 'main']
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader',          
          options: { 
            compilerOptions: {
              dev: !prod
            },
            emitCss: true,
            hotReload: !prod,
            preprocess: require('svelte-preprocess')({ 
              postcss: true,
              sourceMap: !prod,
            }),
            hotOptions: {
              // Prevent preserving local component state
              preserveLocalState: true,

              // If this string appears anywhere in your component's code, then local
              // state won't be preserved, even when noPreserveState is false
              noPreserveStateKey: '@!hmr',

              // Prevent doing a full reload on next HMR update after fatal error
              noReload: true,

              // Try to recover after runtime errors in component init
              optimistic: false,

              // --- Advanced ---

              // Prevent adding an HMR accept handler to components with
              // accessors option to true, or to components with named exports
              // (from <script context="module">). This have the effect of
              // recreating the consumer of those components, instead of the
              // component themselves, on HMR updates. This might be needed to
              // reflect changes to accessors / named exports in the parents,
              // depending on how you use them.
              acceptAccessors: true,
              acceptNamedExports: true,
            }
          }         
        }
      },

      {
        test: /\.css$/,
        use: [
          // prod ? MiniCssExtractPlugin.loader : 
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },

      {
        test: /\.scss$/,
        use: [
          // prod ? MiniCssExtractPlugin.loader : 
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },

      {
        test: /\.(ttf|otf|eot|woff|woff2)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[hash:base64:8].[ext]',
            esModule: false
          }
        }
      },
      {
        test: /\.(jpg|png)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: 'img/[hash:base64:8].[ext]',
            esModule: false
          }
        }
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'img/[hash:base64:8].[ext]',
              esModule: false
            }
          },
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                { name: 'removeHiddenElems', active: false }
                // { removeHiddenElems: { displayNone: false } },
                // { cleanupIDs: false },
                // { removeTitle: true }
              ]
            }
          }
        ]
      }
    ]
  },
  mode,
  plugins: [
    new HtmlWebpackPlugin(), 
    ...(prod ? [new CompressionPlugin()] : []),
    // new MiniCssExtractPlugin({
    //   filename: '[name].[id][contenthash].css'
    // }),
    new Dotenv({path: prod ? '.env-prod' : '.env'}),
    new DefinePlugin({
      'process.env.CLIENT_TYPE': JSON.stringify(process.env.CLIENT_TYPE)
    })    
  ],
  devtool: prod ? false : 'inline-source-map',
  devServer: {
    static: {
      directory: path.resolve(__dirname, "public"),
      publicPath: "/",
      serveIndex: true,
      watch: true,
    },
    historyApiFallback: {
      disableDotRule: true
    },   
    hot: true,
    client: {
      logging: "info",
      overlay: false,
      progress: false,
    },
    proxy: devServer ? {
      '/account': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: { '^/account': '' },
        logLevel: 'debug'
      },
      '/files': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        logLevel: 'debug'
      },
      '/import': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        logLevel: 'debug'
      },
    } : {
      '/account': {
        // target: 'https://ftwm71rwag.execute-api.us-west-2.amazonaws.com/stage/',
        target: 'https://account.hc.engineering/',
        changeOrigin: true,
        pathRewrite: { '^/account': '' },
        logLevel: 'debug'
      },
      '/files': {
        // target: 'https://anticrm-upload.herokuapp.com/',
        // target: 'http://localhost:3000/',  
        target: 'https://front.hc.engineering/files',
        changeOrigin: true,
        pathRewrite: { '^/files': '' },
        logLevel: 'debug'
      }
    }
  }
}
