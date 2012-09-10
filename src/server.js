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
    util    = require("util"),
    events =  require('events'),
    express = require('express'),
    App     = express(),
    Periodic = require('./periodic.js').Periodic,
    ApiController = require('./api-controller.js').ApiController,
    Jiraffe = require('./jiraffe.js').Jiraffe,
    Configuration = require('./configuration.js').Configuration;

// Configuration & Pathes
var Config      =  new Configuration('~/luxboard.config.json'),
    WWWPort     =  Config.luxboard.port,
    ServerRoot  =  __dirname,
    ProjectRoot =  path.normalize(ServerRoot + '/../'),
    WWWRoot     =  path.normalize(ProjectRoot + '/wwwroot/'),
    BtsName     =  'BTS Task',
    BtsTimeout  =  60000, // 1 min
    CisName     =  'CIS Task',
    CisTimeout  =  120000; // 2 min

// Express application
App.configure(function () {
  App.use(express.logger());
  App.use(express.static(WWWRoot));
  App.use(express.bodyParser());
  App.use(express.methodOverride());
  App.use(App.router);
  App.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Router
ApiController.Initialize().Route(App);

// Jiraffe
var jira = new Jiraffe( Config.jiraffe.host,
                        Config.jiraffe.username,
                        Config.jiraffe.password ).Initialize();

// Jira Updater
function UpdateJiraData(jira, io)
{
    if ( jira.IsLoggedin() )
    {
        jira.GetUnresolvedIssueCountFor(Config.jiraffe.trunk, function(trunk)
        {
            if ( typeof trunk === 'object' && trunk.hasOwnProperty('issuesUnresolvedCount') )
            {
                io.sockets.emit('luxboard.jiraffe.trunk.unresolved', trunk.issuesUnresolvedCount);
            }
        });

        jira.GetUnresolvedIssueCountFor(Config.jiraffe.stable, function(stable)
        {
            if ( typeof stable === 'object' && stable.hasOwnProperty('issuesUnresolvedCount') )
            {
                io.sockets.emit('luxboard.jiraffe.stable.unresolved', stable.issuesUnresolvedCount);
            }
        });
    }
}

// BTS polling Task
var BtsTask = (new Periodic(BtsName, BtsTimeout, function(){
    console.log('Inside', this.ctx.name);

    try
    {
        if ( !jira.IsLoggedin() )
        {
            jira.Login(function(data)
            {
                UpdateJiraData(jira, Io);
            });
        }
        else
        {
            UpdateJiraData(jira, Io);
        }
    }
    catch(e)
    {
        console.log('Luxboard Server:', 'Error:', e);
        jira.Logout();
    }
})).Initialize();

// Cis polling Task
var CisTask = (new Periodic(CisName, CisTimeout, function(){
    console.log('Inside', this.ctx.name);
})).Initialize();

// Express Server
var Server = App.listen(WWWPort);

// Socket.io
var Io = require('socket.io').listen(Server);

Io.on('connection', function(socket)
{
    console.log('Socket.io connection.');

    socket.on('luxboard.service.ping', function(msg)
    {
        console.log('Socket.io ping received: ', msg);
        socket.emit('luxboard.service.ack', msg);
    });

    socket.on('luxboard.service.message', function(msg)
    {
        console.log('Socket.io service message received: ', msg);
        socket.emit('luxboard.service.ack', msg);
    });

    socket.on('luxboard.service.ack', function(msg)
    {
        console.log('Socket.io ack received: ', msg);
    });

    socket.on('disconnect', function()
    {
        console.log('Socket.io disconnect.');
    });
});

// Process handlers
process
    .on('exit', function() {
        Cleanup();
    })
    .on('uncaughtException', function(e){
        console.log('uncaughtException:', e);
    })
    .on('SIGUSR1', function() {
        DumpStat();
    })
    .on('SIGINT', function() {
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
        'Process: ' + process.title + '(' + process.pid + ')'
                    + 'on ' + 'node.js ' + process.version + ' for '
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

