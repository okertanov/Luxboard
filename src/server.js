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
    ApiDb = require('./api-db.js').ApiDb,
    Jiraffe = require('./jiraffe.js').Jiraffe,
    Configuration = require('./configuration.js').Configuration;

// Configuration & Pathes
var Config      =  new Configuration('~/luxboard.config.json'),
    WWWPort     =  Config.luxboard.port,
    ServerRoot  =  __dirname,
    ProjectRoot =  path.normalize(ServerRoot + '/../'),
    WWWRoot     =  path.normalize(ProjectRoot + '/wwwroot/'),
    DbName      = 'Luxboard',
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

// Database
ApiDb.Connect(DbName);

// Router
ApiController.Initialize(ApiDb).Route(App);

// Jiraffe
var Jira = new Jiraffe( Config.jiraffe.host,
                        Config.jiraffe.username,
                        Config.jiraffe.password ).Initialize();

// Jira Updater
function UpdateJiraData(jira, socket)
{
    if ( jira.IsLoggedin() )
    {
        // Trunk
        jira.GetUnresolvedIssueCountFor(Config.jiraffe.trunk, function(trunk)
        {
            if ( typeof trunk === 'object' && trunk.hasOwnProperty('issuesUnresolvedCount') )
            {
                socket.emit('luxboard.jiraffe.trunk.unresolved', trunk.issuesUnresolvedCount);

                DbGetLastJiraVersionById(Config.jiraffe.project, Config.jiraffe.trunk, function(projectkey, versionid, version, err)
                {
                    if ( version && version.unresolved && version.unresolved === trunk.issuesUnresolvedCount )
                    {
                        // Handle duplicate
                    }
                    else
                    {
                        DbStoreJiraVersion({
                            projectkey: Config.jiraffe.project,
                            versionid:  Config.jiraffe.trunk,
                            unresolved: trunk.issuesUnresolvedCount
                        });
                    }
                });
            }
        });

        // Stable
        jira.GetUnresolvedIssueCountFor(Config.jiraffe.stable, function(stable)
        {
            if ( typeof stable === 'object' && stable.hasOwnProperty('issuesUnresolvedCount') )
            {
                socket.emit('luxboard.jiraffe.stable.unresolved', stable.issuesUnresolvedCount);

                DbGetLastJiraVersionById(Config.jiraffe.project, Config.jiraffe.stable, function(projectkey, versionid, version, err)
                {
                    if ( version && version.unresolved && version.unresolved === stable.issuesUnresolvedCount )
                    {
                        // Handle duplicate
                    }
                    else
                    {
                        DbStoreJiraVersion({
                            projectkey: Config.jiraffe.project,
                            versionid:  Config.jiraffe.stable,
                            unresolved: stable.issuesUnresolvedCount
                        });
                    }
                });
            }
        });
    }
}

function DbGetLastJiraVersionById(projectkey, versionid, fn)
{
    ApiDb.Version.find({projectkey: projectkey, versionid:  versionid}).sort({'date': -1}).limit(1)
        .execFind(function(err, versions)
        {
            var version = {};

            if ( !err )
            {
                if ( versions.length )
                    version = versions[0];
            }

            if ( typeof fn === 'function' )
                fn.call(this, projectkey, versionid, version, err);
        });
}

function DbStoreJiraVersion(v, fn)
{
    var ver = new ApiDb.Version({   projectkey: v.projectkey,
                                    versionid:  v.versionid,
                                    unresolved: v.unresolved,
                                    total:      v.total,
                                    fixed:      v.fixed,
                                    affected:   v.affected  });

    ver.save(function(err)
    {
        if ( !err )
        {
            console.log('StoreJiraVersion():', 'OK');
        }
        else
        {
            console.log('StoreJiraVersion():', 'Error:', err);
        }

        if ( typeof fn === 'function' )
            fn.call(this, v, err);
    });
}

function UpdateJiraPeriodicTask(jira, socket)
{
    try
    {
        if ( !jira.IsLoggedin() )
        {
            jira.Login(function(data)
            {
                UpdateJiraData(jira, socket);
            });
        }
        else
        {
            UpdateJiraData(jira, socket);
        }
    }
    catch(e)
    {
        console.log('UpdateJiraPeriodicTask():', 'Error:', e);
        jira.Logout();
    }
}

// Express Server
var Server = App.listen(WWWPort);

// Socket.io
var Io = require('socket.io').listen(Server);

Io.on('connection', function(socket)
{
    console.log('Socket.io connection.');

    UpdateJiraPeriodicTask(Jira, socket);

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

// BTS polling Task
var BtsTask = (new Periodic(BtsName, BtsTimeout, function(){
    console.log('Inside', this.ctx.name);

    UpdateJiraPeriodicTask(Jira, Io.sockets);

})).Initialize();

// Cis polling Task
var CisTask = (new Periodic(CisName, CisTimeout, function(){
    console.log('Inside', this.ctx.name);
})).Initialize();

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
    ApiDb.Disconnect();
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

