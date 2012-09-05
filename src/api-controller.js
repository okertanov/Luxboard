/**
    @file       app-controller.js
    @brief      Application controller and router.

    @author     Oleg Kertanov <okertanov@gmail.com>
    @date       September 2012
    @copyright  Copyright (C) 2012 Oleg Kertanov <okertanov@gmail.com>
    @license    BSD
    @see LICENSE file
*/

(function()
{

// Strict mode by default
"use strict";

var underscore = require('underscore')._,
    Db = require('./api-db.js'),
    ApiDb = Db.ApiDb,
    DbName = 'Luxboard';

exports.ApiController =
{
    Initialize: function()
    {
        console.log('ApiController.Initialize');

        ApiDb.Connect(DbName);

        return this;
    },
    Terminate: function()
    {
        console.log('ApiController.Terminate');

        ApiDb.Disconnect();

        return this;
    },
    ProductsGet: function(req, res, next)
    {
        console.log('ApiController.ProductsGet');

        var response = [];

        this.SendJson(res, response);

        return this;
    },
    ProductGet: function(req, res, next)
    {
        console.log('ApiController.ProductGet');

        var that  = this,
            product  = req.params.product || req.body.product;

        var response = {product: product};

        this.SendJson(res, response);

        return this;
    },
    BuildsGet: function(req, res, next)
    {
        console.log('ApiController.BuildsGet');

        var response = [];

        this.SendJson(res, response);

        return this;
    },
    BuildGet: function(req, res, next)
    {
        console.log('ApiController.BuildGet');

        var that  = this,
            build  = req.params.build || req.body.build;

        var response = {build: build};

        this.SendJson(res, response);

        return this;
    },
    Default: function(req, res, next)
    {
        console.log('ApiController.Default', req.method, req.url);

        this.SendError(res,
	    'Invalid endpoint: ' + req.method + ' ' + req.url, 501);

        return this;
    },
    SendJson: function(res, obj)
    {
        res.json(obj);
        return this;
    },
    SendError: function(res, content, code)
    {
        res.send(content, code);
        return this;
    },
    Route: function(app)
    {
        console.log('ApiController.Route');

        var that = this;

        app.get( '/api/products',           function(req, res, next){ that.ProductsGet.call(that, req, res, next); } );
        app.get( '/api/products/:product',  function(req, res, next){ that.ProductGet.call(that, req, res, next); } );
        app.get( '/api/builds',             function(req, res, next){ that.BuildsGet.call(that, req, res, next); } );
        app.get( '/api/builds/:build',      function(req, res, next){ that.BuildGet.call(that, req, res, next); } );
        app.all( '/*',                      function(req, res, next){ that.Default.call(that, req, res, next); } );

        return this;
    }
};

})()

