"use strict";

let builder = require('./src/index.js');
let path = require('path');
let entryPath = require('./entry.conf.js');
let fs = require('fs')

let svgfiles = fs.readdirSync(entryPath.svgPath);
svgfiles = svgfiles.map(fname => {
    return {
        'name':fname.slice(0, fname.length -4),
        'file':fname
    }
});
console.log(svgfiles)


var options = {
    // 图标信息
    icons: svgfiles,
    // icons: [
    //     {
    //         name: 'www-font-o',
    //         file: 'ad.svg',
    //         // codepoint: 61441
    //     },
    //     {
    //         name: 'www-font-p',
    //         file: 'web_shear_me.svg',
    //         // codepoint: 61442
    //     },
    //     {
    //         name: 'www-font-q',
    //         file: 'web_shear_img.svg',
    //         // codepoint: 61443
    //     }
    // ],
    // 图标文件夹
    src: path.join(__dirname, 'svg'),
    // 生成字体名称
    fontName: 'iconfont',
    // 整体偏移量
    descent: 0,
    // 字体生成位置
    dest: path.join(__dirname, 'dest')
};

builder(options)
    .then(function(res){
    }).catch(e => console.log('err:::', e));