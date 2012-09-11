/**
    @file       api-db.js
    @brief      App models & db.

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

var mongoose = require('mongoose');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

exports.ObjectId = ObjectId;

exports.VersionSchema = new Schema({
    projectkey:     { type: String,     required: true  },
    versionid:      { type: Number,     required: true  },
    unresolved:     { type: Number,     required: false },
    total:          { type: Number,     required: false },
    fixed:          { type: Number,     required: false },
    affected:       { type: Number,     required: false },
    date:           { type: Date,       required: true,
                            default: Date.now           }
});

exports.BuildSchema = new Schema({
    name:           { type: String,     required: true  },
    description:    { type: String,     required: false },
    date:           { type: Date,       required: true,
                            default: Date.now           }
});

exports.ApiDb =
{
    Version: mongoose.model('VersionModel', exports.VersionSchema),
    Build: mongoose.model('BuildModel', exports.BuildSchema),
    Connect: function(db)
    {
        console.log('ApiDb.Connect');

        try
        {
            if ( !db || !db.length )
                throw 'ApiModels.Connect invalid argument';

            mongoose.connect('mongodb://localhost/' + db, function(err)
            {
                if ( err )
                    throw err;
            });
        }
        catch(e)
        {
            console.log(e);
            throw e;
        }
    },
    Disconnect: function()
    {
        console.log('ApiDb.Disconnect');

        try
        {
            mongoose.connection.close();
        }
        catch(e)
        {
            console.log(e);
            throw e;
        }
    }
};

})((typeof exports !== 'undefined' ? exports : this));

