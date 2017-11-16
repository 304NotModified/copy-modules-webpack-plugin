/*
 * Copyright (c) 2011-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/clm/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */
const fs = require('fs-extra');
const path = require('path');

/**
 * A Webpack plugin that copies the raw source of all imported modules to a separate directory, enabling
 * external analysis of _just_ the files that get included in the bundles.  Within the destination folder,
 * modules are laid out in a subdirectory structure matching the original files' relative location to the
 * directory in which webpack runs.
 */
/* global Promise */
module.exports = class WebpackCopyModulesPlugin {
  constructor(options) {
    // this.destination is the absolute path to the destination folder
    this.destination = path.join(__dirname, options.destination);
  }

  apply(compiler) {
    compiler.plugin('emit', this.handleEmit.bind(this));
  }

  handleEmit(compilation, callback) {
    Promise.all(compilation.modules.map(this.saveModule.bind(this))).then(() => callback()).catch(callback);
  }

  saveModule(module) {
    const me = this;

    if (module.external) {
      // A module that has been configured to refer to an externally defined global - doesn't have any associated
      // code in the bundle
      return Promise.resolve();
    }

    return Promise.all(module.fileDependencies.map(function(file) {
      const relativePath = path.relative('', file),
          destPath = path.join(me.destination, relativePath),
          destDir = path.dirname(destPath);

      return fs.mkdirs(destDir).then(() => fs.copy(file, destPath, { overwrite: false }));
    }));
  }
};
