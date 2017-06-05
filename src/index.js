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
builder(options).catch(e => console.log('err:::', e));

function builder(options) {
  options.ascent = 1024 - options.descent;

  // 填充 icons 数据
  let icons = fillIcons(options);
  options.icons = icons;

  //then 的 fn 的参数都是前一个 promise resolve 的结果
  return fontGenerator(options).then(function (fontDatas) {
    return writeFonts(fontDatas, options);
  });
}



//字体写入方法，生成四种字体
function writeFonts(fontDatas, options) {
  let type = ['svg', 'ttf', 'eot', 'woff', 'html'];
  let folderPath = options.dest;

  //写之前先保证目录存在
  return new Promise(function (resolve, reject) {
    mkdirp(folderPath, function (err) {
      err ? reject(err) : resolve()
    });
  }).then(function () {

    fontDatas.map(function (fontData, i) {
      let filePath = path.join(options.dest, options.fontName + '.' + type[i]);
      let writeFileQ = Q.nfcall(fs.writeFile, filePath, fontData);
      fs.writeFileSync(filePath, fontData);
    });
  }, function(err){
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

module.exports = builder;
