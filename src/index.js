"use strict";

let fs = require('fs');
let path = require('path');
let Q = require('q');
let _ = require('underscore');
let mkdirp = require('mkdirp');

let defer = require('./defer');
let fontGenerator = require('./fontGenerator');
let parser = require('./svgFontParser');
let DEFAULT_OPTIONS = {
  readFiles: true,
  writeFiles: true,
  fontName: 'iconfont',
  startCodePoint: 0xE000,
  src: '.',
  dest: '.',
  descent: 0,
  demoPage: 1,
  icons: []
};

let entryConf = require('../entry.conf.js');
let svgfiles = fs.readdirSync(entryConf.src);
let prefix = entryConf.prefix || '';
DEFAULT_OPTIONS.icons = svgfiles.map(fname => {
  return {
    'name': prefix + fname.slice(0, fname.length - 4),
    'file': fname  //file 是后面 fontGenerator 读取文件用
  };
});
let options = _.extend({}, DEFAULT_OPTIONS, entryConf);



function builder(options) {
  options.ascent = 1024 - options.descent;

  // 填充 icons 数据
  let icons = fillIcons(options);
  options.icons = icons;

  //then 的 fn 的参数都是前一个 promise resolve 的结果
  mkdirp(options.dest, function(){
    fontGenerator(options);
  });
}


// 判断是否传入 icons 对象，选择排查或补充
function fillIcons(options) {
  // 如果有 icons 数据，确保数据不为空

  var baseCode = options.startCodePoint;
  var codeSet = options.icons.map(function (icon) {
    return icon.codepoint;
  });

  _.each(options.icons, function (icon) {
    // name 是必备的
    if (!icon.name) {
      throw new Error('icon ' + icon.file + ' has no name');
    }

    // 如果没有编码，则进行自动生成
    if (!icon.codepoint) {
      while (codeSet.indexOf(baseCode) > -1) {
        baseCode++;
      }
      icon.codepoint = baseCode++;
    }
    icon.xmlCode = '&#x' + icon.codepoint.toString(16) + ';';
    icon.cssCode = '\\' + icon.codepoint.toString(16);
  });
  return options.icons




}





builder(options);

module.exports = builder;
