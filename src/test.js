var fs = require('fs');
var svg2ttf = require('svg2ttf');

debugger
//由于 Uint8Array 是8位无符号整数的Array 最大也只有255咯
var buf1 = Buffer.from([123,255,123]);
console.log(buf1)  //得到<Buffer 7b ff 7b>  //Buffer是以16进制表示的
//不过 debug 的时候 buf1 显示为 Uint8Array[3] [123, 255, 123]



var readRs = fs.readFileSync('/Users/luonan/Sites/iconfont-builder/dist/icomoon.svg', 'utf8', {});
console.log(readRs);

var readRs2 = fs.readFileSync('/Users/luonan/Sites/iconfont-builder/dist/icomoon.svg');




var ttf = svg2ttf(readRs);
fs.writeFileSync('/Users/luonan/Sites/iconfont-builder/dist/myfont.ttf', new Buffer(ttf.buffer));