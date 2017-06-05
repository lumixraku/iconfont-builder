/**
 * 生成eot, svg, ttf, woff 四种格式的文件
 * 支持只返回各个字体的 path-d 而不生成字体文件
 * 支持通过仅传入 d 来生成字体
 */

var fs = require('fs');
var path = require('path');
var Q = require('q');
var _ = require('underscore');
var s2s = require('svgicons2svgfont');
var svg2ttf = require('svg2ttf');
var ttf2eot = require('ttf2eot');
var ttf2woff = require('ttf2woff');
var handlebars = require('handlebars');

var defer = require('./defer');
var parser = require('./svgFontParser');
var multiStream = require('./multiStream');

/**
 * 生成 svg 字体
 *
 * @param {Array<Object>} icons 图标数组，包含图标类名与 code
 * @param {Object} svgOpts s2s 插件的参数对象
 * @param {Object} options iconfont-builder 的参数对象
 * @returns {Promise}
 */
function generateSvg(icons, svgOpts, options) {
  var stream;
  var fontBuffer = new Buffer('','utf-8')//new Buffer(0);
  var def = defer();

  // 进行内部自定义设定
  svgOpts.normalize = true;   // 大小统一
  svgOpts.fontHeight = 1024;  // 高度统一为1024
  svgOpts.round = 1000;       // path值保留三位小数
  // svgOpts.log = function(){}; // 沉默控制台输出


  stream = s2s(svgOpts);
  // 这个流还要给 ttf eot  woff 字体用
  // 不应该再这里全部 pipe 掉
  // stream.pipe(fs.createWriteStream(options.dest + options.fontName + '.svg'))
  // pipe的话会导致读入的 buffer 不完整

  stream.on('data', function(data) {
    fontBuffer = Buffer.concat([fontBuffer, data]);
  })
  .on('error', function(err) {
    def.reject(err);
  })
  .on('finish', function() {
    // console.log('read finish', fontBuffer.toString());
    def.resolve(fontBuffer.toString());
  });

  _.each(icons, function(icon) {
    try {
      var glyph;
      var iconFile = path.join(options.src, icon.file);
      glyph = fs.createReadStream(iconFile);

      glyph.metadata = {
        name: icon.name,
        unicode: [String.fromCharCode(icon.codepoint)]
      };
      stream.write(glyph);
    } catch(e) {
      def.reject(e);
      return false;
    }
  });

  stream.end();
  return def.promise;
}

/**
 * 生成 ttf 字体，依赖于 svg 字体的生成
 *
 * @param {String} svgFont
 */
function generateTtf(svgFont) {
// svg2ttf使用
// var ttf = svg2ttf(fs.readFileSync('myfont.svg', 'utf8'), {});
// fs.writeFileSync('myfont.ttf', new Buffer(ttf.buffer));
  var font = svg2ttf(svgFont);
  return new Buffer(font.buffer);
}

/**
 * 生成 woff 字体，依赖于 ttf 字体的生成
 *
 * @param {String} ttfFont
 */
function generateWoff(ttfFont) {
  var font = ttf2woff(new Uint8Array(ttfFont));
  return new Buffer(font.buffer);
}

/**
 * 生成 eot 字体，依赖于 ttf 字体的生成
 *
 * @param {String} ttfFont
 */
function generateEot(ttfFont) {
  var font = ttf2eot(new Uint8Array(ttfFont));
  return new Buffer(font.buffer);
}

/**
 * 生成方便用户查看字体的 html
 *
 * @param {Object} options
 */

function generateHtml(options) {
  var tmpPath = path.join(__dirname, '../template/html.handlebars');
  options.timestamp = +new Date;
  return Q.nfcall(fs.readFile, tmpPath, 'utf-8')
    .then(function(source) {
      var template = handlebars.compile(source);
      // console.log('templdate:::', template, options)
      return template(options);
    });
}

/**
 * 按照依赖关系生成字体
 *
 * @param {Object} options 生成字体参数对象
 * @returns {Promise}
 */
function generateFonts(options) {
  // 使用 ascent 和 descent 进行字体的基线调整
  var svgOpts = _.pick(options,
    'fontName', 'ascent', 'descent'
  );
  var svg;

  // 首先进行 svg 的生成
  // 当 readFiles 为 false 时，使用 d 生成
  // 否则使用文件生成
  if (!options.readFiles) {
    svg = parser.getSvgIcon(options);
  } else {
    svg = generateSvg(options.icons, svgOpts, options);
  }

  // 当不需要 writeFiles 时不需要生成 ttf/eot/woff
  if (!options.writeFiles) {
    return svg;
  }

  // ttf 依赖 svg 的生成
  //PS then 返回一个 Promise
  var ttf = svg.then(generateTtf);

  // eot 和 woff 依赖 tff 的生成
  var eot = ttf.then(generateEot);
  var woff = ttf.then(generateWoff);

  var async_arr = [svg, ttf, eot, woff];
  // 最后生成 html
  if(options.demoPage) {
    async_arr.push(generateHtml(options));
  }
  return Promise.all(async_arr);
}

module.exports = generateFonts;
