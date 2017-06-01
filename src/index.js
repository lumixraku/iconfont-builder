"use strict";

let fs = require('fs');
let path = require('path');
let Q = require('q');
let _ = require('underscore');
let mkdirp = require('mkdirp');

let defer = require('./defer');
let generator = require('./fontGenerator');
let parser = require('./svgFontParser');

let DEFAULT_OPTIONS = {
  readFiles: true,
  writeFiles: true,
  fontName: 'iconfont',
  startCodePoint: 0xE000,
  src: '.',
  dest: '.',
  descent: 0,
  demoPage: 1
};

let entryConf = require('../entry.conf.js');
let svgfiles = fs.readdirSync(entryConf.src);
let prefix = entryConf.prefix || '';
svgfiles = svgfiles.map(fname => {
    return {
        'name':prefix + fname.slice(0, fname.length -4),
        'file':fname
    }
});
// console.log(svgfiles);


let DEFAULT_CONF = {
    icons: svgfiles,//指定 icon 的名字
    src: '',
    dest: '',
    fontName: 'icofonts',
    descent: 0,// 整体偏移量
};
let options = _.extend({}, DEFAULT_CONF,entryConf);
builder(options).catch(e => console.log('err:::', e));

function builder(options) {
  options = _.extend({}, DEFAULT_OPTIONS, options);
  options.ascent = 1024 - options.descent;

  // 填充 icons 数据
  return fillIcons(options)
    .then(function(icons) {
      options.icons = icons;

      return generator(options);
    })
    .then(function(data) {
      if (options.writeFiles) {
        return writeFonts(data, options);
      } else {
        // 直接返回包含 d 的 icon 数据
        // 注意这里的 data 不是数组，是 svg 文件内容
        return parser.getPathData(data, options);
      }
    });
}



//字体写入方法，生成四种字体
function writeFonts(fonts, options) {
  var type = ['svg', 'ttf', 'eot', 'woff', 'html'];

  var fontsQ = _.map(fonts, function(font, i) {
    var filePath = path.join(options.dest, options.fontName + '.' + type[i]);

    var mkdirQ = new Promise(function(resolve, reject) {
      mkdirp(path.dirname(filePath), function(err) {
        err ? reject(err) : resolve()
      })
    })
    var writeFileQ = Q.nfcall(fs.writeFile, filePath, font);

    return mkdirQ.then(writeFileQ);
  });

  return Promise.all(fontsQ);
}

// 判断是否传入 icons 对象，选择排查或补充
function fillIcons(options) {
  // 如果有 icons 数据，确保数据不为空
    var def = defer();
    var baseCode = options.startCodePoint;
    var codeSet = options.icons.map(function(icon) {
      return icon.codepoint;
    });

    _.each(options.icons, function(icon) {
      // name 是必备的
      if (!icon.name) {
        def.reject(new Error('icon ' + icon.file + ' has no name'));
        return false;
      }

      // 如果没有编码，则进行自动生成
      if (!icon.codepoint) {
        while(codeSet.indexOf(baseCode) > -1) {
          baseCode++;
        }
        icon.codepoint = baseCode++;
      }
      icon.xmlCode = '&#x' + icon.codepoint.toString(16) + ';';
      icon.cssCode = '\\' + icon.codepoint.toString(16);
    });
    def.resolve(options.icons);
    return def.promise;
}

module.exports = builder;
