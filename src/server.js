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

// System & App modules
var os      = require('os'),
    fs      = require('fs'),
    path    = require('path'),
    http    = require('http'),
    express = require('express'),
    app     = express(),
    ApiController = require('./api-controller.js').ApiController;

// Pathes
var ServerRoot  = __dirname,
    ProjectRoot = path.normalize(ServerRoot + '/../'),
    WWWRoot     = path.normalize(ProjectRoot + '/wwwroot/');

// Configuration
var Port = 8888;

// Express application
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

// Express Server
var server = app.listen(Port);

// Socket.io
var io = require('socket.io').listen(server);

io.on('connection', function (socket)
{
    console.log('Socket.io connection.');

    socket.on('message', function (msg)
    {
        console.log('Socket.io message received: ', msg);
        socket.broadcast.emit('message', msg);
    });

    socket.on('disconnect', function(){
        console.log('Socket.io disconnect.');
    });
});

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

