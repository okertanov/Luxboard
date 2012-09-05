/**
    @file       server.js
    @brief      Node.JS Server.

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

// Pathes
var ServerRoot  = __dirname,
    ProjectRoot = path.normalize(ServerRoot + '/../'),
    WWWRoot     = path.normalize(ProjectRoot + '/wwwroot/');

// System & App modules
var os      = require('os'),
    fs      = require('fs'),
    path    = require('path'),
    express = require('express'),
    ApiController = require('./api-controller.js').ApiController;


// Configuration
var Port = 8888;

// Express application
var app = express();

app.configure(function () {
  app.use(express.logger());
  app.use(express.static(WWWRoot));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Router
ApiController.Initialize();
ApiController.Route(app);

// Server
app.listen(Port);

// Process handlers
process
    .on('exit', function () {
        ApiController.Terminate();
    })
    .on('uncaughtException', function (e){
        console.log(e, e.toString());
    })
    .on('SIGINT', function () {
        ApiController.Terminate();
        process.exit();
    });

})()

