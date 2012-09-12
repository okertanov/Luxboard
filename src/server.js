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
    async   = require('async'),
    events  = require('events'),
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
    BtsTimeout  =  60000,  // 1 min
    TmlName     =  'TML Task',
    TmlTimeout  =  120000, // 1 min
    CisName     =  'CIS Task',
    CisTimeout  =  180000; // 3 min

// Express application
App.configure(function ()
{
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

// Express Server
var Server = App.listen(WWWPort);

// Socket.io
var Io = require('socket.io').listen(Server);

Io.on('connection', function(socket)
{
    console.log('Socket.io connection.');

    UpdateJiraPeriodicTask(Jira, socket),
        UpdateTimelinePeriodicTask(socket);

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

// Jira Updater
function UpdateJiraData(jira, socket)
{
    if ( jira.IsLoggedin() )
    {
        // Trunk && Stable
        if ( Config.jiraffe.versions.length )
        {
            Config.jiraffe.versions.forEach(function(ver, idx, arr)
            {
                jira.GetUnresolvedIssueCountFor(ver.version, function(data)
                {
                    if ( typeof data === 'object' && data.hasOwnProperty('issuesUnresolvedCount') )
                    {
                        socket.emit('luxboard.jiraffe.' + ver.name + '.unresolved', data.issuesUnresolvedCount);

                        DbGetLastJiraVersionById(ver.project, ver.version, function(projectkey, versionid, dbversion, err)
                        {
                            if ( dbversion && dbversion.unresolved && dbversion.unresolved === data.issuesUnresolvedCount )
                            {
                                // Handle duplicate
                            }
                            else
                            {
                                DbStoreJiraVersion({
                                    projectkey: ver.project,
                                    versionid:  ver.version,
                                    unresolved: data.issuesUnresolvedCount
                                });
                            }
                        });
                    }
                });
            });
        }
    }
}

function DbGetJiraVersionById(projectkey, versionid, limit, fn)
{
    ApiDb.Version.find({projectkey: projectkey, versionid:  versionid}).sort({'date': -1}).limit(limit)
        .execFind(function(err, versions)
        {
            var retversions = [];

            if ( !err )
            {
                if ( versions.length )
                    retversions = versions;
            }

            if ( typeof fn === 'function' )
                fn.call(this, projectkey, versionid, limit, retversions, err);
        });
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
            console.log('DbStoreJiraVersion():', 'OK');
        }
        else
        {
            console.log('DbStoreJiraVersion():', 'Error:', err);
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

function UpdateTimelineData(socket)
{
    // Trunk && Stable
    if ( Config.jiraffe.versions.length )
    {
        async.reduce(Config.jiraffe.versions, {},
            function iterator(memo, item, callback)
            {
                DbGetJiraVersionById(item.project, item.version, Config.jiraffe.qlimit,
                    function(projectkey, versionid, limit, versions, err)
                    {
                        err = ( err ? err : null ),
                        memo.projectkey = (memo.projectkey ? memo.projectkey : []);

                        if ( !err )
                        {
                            memo.projectkey.push({name: item.name, timeline: versions});
                        }

                        callback(err, memo);
                    }
                );
            },
            function callback(err, result)
            {
                if ( !err )
                {
                    socket.emit('luxboard.jiraffe.timeline', result);
                }
                else
                {
                    console.log('UpdateTimelineData():', 'Error:', err);
                }
            }
        );
    }
}

function UpdateTimelinePeriodicTask(socket)
{
    try
    {
        UpdateTimelineData(socket);
    }
    catch(e)
    {
        console.log('UpdateTimelinePeriodicTask():', 'Error:', e);
    }
}

// BTS polling Task
var BtsTask = (new Periodic(BtsName, BtsTimeout, function(){
    console.log('Inside', this.ctx.name);

    UpdateJiraPeriodicTask(Jira, Io.sockets);

})).Initialize();

// TML polling Task
var TmlTask = (new Periodic(TmlName, TmlTimeout, function(){
    console.log('Inside', this.ctx.name);

    UpdateTimelinePeriodicTask(Io.sockets);

})).Initialize();

// CIS polling Task
var CisTask = (new Periodic(CisName, CisTimeout, function(){
    console.log('Inside', this.ctx.name);
})).Initialize();

// Process handlers
process
    .on('exit', function()
    {
        Cleanup();
    })
    .on('uncaughtException', function(e)
    {
        console.log('uncaughtException:', e);
    })
    .on('SIGUSR1', function()
    {
        DumpStat();
    })
    .on('SIGINT', function()
    {
        Cleanup();
        process.exit();
    });

// Graceful cleanup
function Cleanup()
{
    ApiController.Terminate();

    BtsTask.Terminate(),
        TmlTask.Terminate(),
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

