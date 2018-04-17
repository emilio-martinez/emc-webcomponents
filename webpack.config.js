const path = require('path');
const fs = require('mz/fs');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;
const WatchExternalFilesPlugin = require('./tools/watch-external-files-plugin');
const deleteDirRecursively = require('./tools/delete-dir-recursively');
const nicerLog = require('./tools/nicer-log');

const elementsPath = 'src/elements';

function htmlWebpackPluginChunksSortMode(a, b) {
  return a.names[0] === 'vendor' ? -1 : b.names[0] === 'vendor' ? 1 : 0;
}

async function getElements() {
  const elementsDir = path.resolve(__dirname, elementsPath);
  const elementPathNames = await fs.readdir(elementsDir).catch(console.error);

  if (!elementPathNames) return { elementData: [], elementEntries: [], elementHTMLPlugins: [] };

  const elementData = elementPathNames.reduce((acc, elementName) => {
    const elementPath = path.resolve(elementsDir, elementName);
    const entryPath = path.resolve(elementPath, 'index.ts');
    const demoPath = path.resolve(elementPath, 'index.html');

    return fs.existsSync(entryPath) && fs.existsSync(demoPath)
      ? acc.concat({
          name: elementName,
          path: path.relative(__dirname, elementPath),
          entry: path.relative(__dirname, entryPath),
          demo: path.relative(__dirname, demoPath)
        })
      : acc;
  }, []);

  const elementEntries = elementData.reduce((acc, { name, entry }) => {
    return { ...acc, [name]: `./${entry}` };
  }, {});

  const elementHTMLPlugins = elementData.map(
    el =>
      new HtmlWebpackPlugin({
        filename: `${el.name}.html`,
        title: `${el.name} element`,
        chunksSortMode: htmlWebpackPluginChunksSortMode,
        template: 'src/templates/element.tpl.html',
        templateParameters: (compilation, assets, options) => ({
          element: {
            title: options.title,
            body: fs.readFileSync(el.demo, { encoding: 'utf-8' })
          }
        })
      })
  );

  nicerLog('Following elements found', elementData);

  return { elementData, elementEntries, elementHTMLPlugins };
}

module.exports = async (_, argv) => {
  const IS_PROD = argv.mode ? argv.mode === 'production' : true;
  const mode = IS_PROD ? 'production' : 'development';
  const devtool = IS_PROD ? 'source-map' : 'none';
  const outputPath = path.resolve(__dirname, 'dist');

  const elementsDir = path.resolve(__dirname, 'src/elements');
  const { elementData, elementEntries, elementHTMLPlugins } = await getElements();

  const babelLoader = {
    loader: 'babel-loader',
    options: {
      presets: [
        [
          'env',
          {
            targets: {
              browsers: ['last 2 versions', 'ie 11']
            }
          }
        ]
      ]
    }
  };

  if (IS_PROD) deleteDirRecursively(outputPath);

  return {
    mode,
    devtool,

    entry: {
      ...elementEntries,
      vendor: './src/vendor/index.ts'
    },

    output: {
      filename: IS_PROD ? '[name].[chunkhash].js' : '[name].js',
      chunkFilename: IS_PROD ? '[name].[chunkhash].js' : '[name].js',
      path: outputPath
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: [babelLoader]
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            babelLoader,
            {
              loader: 'ts-loader',
              options: {
                compilerOptions: {
                  sourceMap: !IS_PROD
                }
              }
            }
          ]
        }
      ]
    },

    plugins: [
      new LicenseWebpackPlugin({
        pattern: /.*/,
        suppressErrors: true,
        perChunkOutput: false,
        outputFilename: '3rdpartylicenses.txt'
      }),
      ...elementHTMLPlugins,
      new CompressionPlugin({
        include: /\.js$/
      }),
      new WatchExternalFilesPlugin({
        files: [`./${elementsPath}/**/*.html`],
        verbose: true
      })
    ],

    devServer: {
      compress: true,
      contentBase: path.resolve(__dirname, 'dist'),
      host: '0.0.0.0',
      overlay: true,
      port: '3000',
      public: 'localhost:3000',
      useLocalIp: true
    },

    resolve: {
      extensions: ['.ts', '.tsx', '.js']
    }
  };
};
