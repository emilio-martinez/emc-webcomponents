const globby = require('globby');
const nicerLog = require('./nicer-log');

class WatchExternalFilesPlugin {
  constructor({ files = [], verbose = false } = {}) {
    this.files = files;
    this.verbose = !!verbose;
    this._firstRun = false;
  }

  apply(compiler) {
    compiler.hooks.afterCompile.tapAsync(
      'watch-external-files-plugin',
      async (compilation, callback) => {
        const filePaths = await globby(this.files, { absolute: true });

        if (this.verbose && !this._firstRun) {
          nicerLog('Watching external files', filePaths);
        }

        filePaths.forEach(file => {
          Array.isArray(compilation.fileDependencies)
            ? compilation.fileDependencies.push(file)
            : compilation.fileDependencies.add(file);
        });

        this._firstRun = true;
        callback();
      }
    );
  }
}

module.exports = WatchExternalFilesPlugin;
