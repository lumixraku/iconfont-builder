"use strict";

let builder = require('./src/index.js');
let path = require('path');
let fs = require('fs')
let _ = require('underscore');


let entryConf = require('./entry.conf.js');
let svgfiles = fs.readdirSync(entryConf.src);
let prefix = entryConf.prefix || '';
svgfiles = svgfiles.map(fname => {
    return {
        'name':prefix + fname.slice(0, fname.length -4),
        'file':fname
    }
});
console.log(svgfiles);


let DEFAULT_CONF = {
    icons: svgfiles,//指定 icon 的名字
    src: '',
    dest: '',
    fontName: 'icofonts',
    descent: 0,// 整体偏移量
};
let options = _.extend({}, DEFAULT_CONF,entryConf);
builder(options)
    .then(function(res){
    }).catch(e => console.log('err:::', e));