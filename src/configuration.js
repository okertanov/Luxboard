/**
    @file       configuration.js
    @brief      App configuration reader.

    @author     Oleg Kertanov <okertanov@gmail.com>
    @date       September 2012
    @copyright  Copyright (C) 2012 Oleg Kertanov <okertanov@gmail.com>
    @license    BSD
    @see LICENSE file
*/

(function(exports)
{

// Strict mode by default
"use strict";

var fs = require('fs'),
    path = require('path');

exports.Configuration = function(file)
{
    var cfgfile = path.normalize(cfgfile.replace(/^~/, process.env['HOME']));
        contents = fs.readFileSync(cfgfile);
    return JSON.parse(contents);
};

})((typeof exports !== 'undefined' ? exports : this));

