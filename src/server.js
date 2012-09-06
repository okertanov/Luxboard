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
    Periodic = require('./periodic.js').Periodic,
    ApiController = require('./api-controller.js').ApiController;

// Configuration & Pathes
var WWWPort = 8888,
    ServerRoot  = __dirname,
    ProjectRoot = path.normalize(ServerRoot + '/../'),
    WWWRoot     = path.normalize(ProjectRoot + '/wwwroot/'),
    BtsName     = 'BTS Task',
    BtsTimeout  = 60000, // 1 min
    CisName     = 'CIS Task',
    CisTimeout  = 120000; // 2 min

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
ApiController.Initialize().Route(app);

// Express Server
var server = app.listen(WWWPort);

// BTS polling Task
var BtsTask = (new Periodic(BtsName, BtsTimeout, function(){
    console.log(this.ctx.name);
})).Initialize();

// Cis polling Task
var CisTask = (new Periodic(CisName, CisTimeout, function(){
    console.log(this.ctx.name);
})).Initialize();

// Socket.io
var io = require('socket.io').listen(server);

io.on('connection', function(socket)
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
        Cleanup();
    })
    .on('uncaughtException', function (e){
        console.log(e, e.toString());
    })
    .on('SIGUSR1', function () {
        DumpStat();
    })
    .on('SIGINT', function () {
        Cleanup();
        process.exit();
    });

// Graceful cleanup
function Cleanup()
{
    ApiController.Terminate();
    BtsTask.Terminate();
    CisTask.Terminate();
}

// Status/Statistic
function DumpStat()
{
    var mem = process.memoryUsage(),
        stat = [
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        'Process: ' + process.title + '(' + process.pid + ')' + 'on ' + 'node.js '
                    + process.version + ' for '
                    + process.platform + '/' + process.arch,
        'Current directory: ' + process.cwd(),
        'Uptime:  ' + Math.floor(process.uptime() / 60) + ' min.',
        'Memory:  ' + 'RSS: ' + mem.rss + ' and Heap: '
                    + mem.heapUsed + ' of ' + mem.heapTotal + '.',
        '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
        ''
    ].join('\n');

    process.stderr.write(stat);
}

})();

