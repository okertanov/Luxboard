/**
    @file       app-controller.js
    @brief      Application controller and router.

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

var os      = require('os'),
    fs      = require('fs'),
    path    = require('path'),
    underscore = require('underscore')._;

exports.ApiController =
{
    ctx:
    {
        db: null,
        socket: null,
        watchers: [],
    },
    Initialize: function(db, socket)
    {
        console.log('ApiController.Initialize');

        this.ctx.db = db;
        this.ctx.socket = socket;

        return this;
    },
    Terminate: function()
    {
        console.log('ApiController.Terminate');

        this.ctx.db = null;

        return this;
    },
    VersionsGet: function(req, res, next)
    {
        console.log('ApiController.VersionsGet');

        var that = this,
            limit = 100,
            response = [],
            proj = req.params.proj || req.body.proj;

        this.ctx.db.Version.find({projectkey: proj}).sort({'date': -1}).limit(limit)
            .execFind(function(err, versions)
            {
                if ( !err )
                {
                    response = versions;
                }
                else
                {
                    response = err;
                }

                that.SendJson(res, response);
            });

        return this;
    },
    VersionGet: function(req, res, next)
    {
        console.log('ApiController.VersionGet');

        var that = this,
            limit = 30,
            response = [],
            proj = req.params.proj || req.body.proj,
            ver  = req.params.ver  || req.body.ver;

        this.ctx.db.Version.find({projectkey: proj, versionid:  ver}).sort({'date': -1}).limit(limit)
            .execFind(function(err, versions)
            {
                if ( !err )
                {
                    response = versions;
                }
                else
                {
                    response = err;
                }

                that.SendJson(res, response);
            });

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

        var that = this,
            build = req.params.build || req.body.build;

        var response = {build: build};

        this.SendJson(res, response);

        return this;
    },
    SystemLogGet: function(req, res, next)
    {
        console.log('ApiController.SystemLogGet');

        var that = this,
            param = req.params.name || req.body.name || null,
            name = param ? param.replace(/\:/gi, '/') : null,
            exists = fs.existsSync(name),
            stat = exists? fs.statSync(name) : null,
            state = null,
            fpos = 0;

        // Is fs object valid and no watcher for that file
        if ( exists && stat && stat.isFile() ) 
        {
            if ( typeof this.ctx.watchers[name] === 'undefined' )
            {
                // Reset file position
                fpos = stat.size;
                this.ctx.watchers[name] = fs.watch(name, { persistent: true }, function(ev, filename){
                    if ( /change/i.test(ev) )
                    {
                        // Update stat
                        stat = fs.statSync(name);

                        if ( stat.size < fpos )
                        {
                            fpos = stat.size;
                            // Notify the clients
                            that.ctx.socket.emit('luxboard.log.event', {ev: ev + ':reset', name: filename, data: fpos});
                            return false;
                        }

                        // Read remaining file contents
                        var stream = fs.createReadStream(name, { flags: 'r', encoding: 'utf-8', start: fpos, end: stat.size }); 
                        if ( stream )
                        {
                            // Set end position
                            fpos = stat.size;

                            // Stream events (read and notifi the clients)
                            stream
                                .on('open', function(){
                                    that.ctx.socket.emit('luxboard.log.event', {ev: ev + ':open', name: filename, data: ''});
                                })
                                .on('close', function(){
                                    that.ctx.socket.emit('luxboard.log.event', {ev: ev + ':close', name: filename, data: ''});
                                })
                                .on('error', function(e){
                                    that.ctx.socket.emit('luxboard.log.event', {ev: ev + ':error', name: filename, data: e});
                                })
                                .on('data', function(data){
                                that.ctx.socket.emit('luxboard.log.event', {ev: ev + ':data', name: filename, data: data});
                                });

                            return true;
                        }
                    }
                });

                if ( this.ctx.watchers[name] )
                {
                    state = 'success: watch started';
                }
                else
                {
                    state = 'error: bad notification';
                }

                // TODO: this.ctx.watchers[name].close() somewhere outside
            }
            else
            {
                state = 'success: watch continued';
            }
        }
        else
        {
            state = 'error: bad access';
        }

        var response = { time: (new Date()).getTime(),
                         log: name,
                         state: state };

        this.SendJson(res, response);

        return this;
    },
    AdminPost: function(req, res, next)
    {
        console.log('ApiController.BuildGet');

        var that = this,
            command = req.params.command || req.body.command,
            data = req.params.data || req.body.data;

        var response = {};

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

        app.get(  '/api/versions/:proj',        function(req, res, next){ that.VersionsGet.call(that, req, res, next); } );
        app.get(  '/api/versions/:proj/:ver',   function(req, res, next){ that.VersionGet.call(that, req, res, next); } );
        app.get(  '/api/builds',                function(req, res, next){ that.BuildsGet.call(that, req, res, next); } );
        app.get(  '/api/builds/:build',         function(req, res, next){ that.BuildGet.call(that, req, res, next); } );
        app.get(  '/api/log/:name',             function(req, res, next){ that.SystemLogGet.call(that, req, res, next); } );
        app.post( '/api/admin',                 function(req, res, next){ that.AdminPost.call(that, req, res, next); } );
        app.all(  '/*',                         function(req, res, next){ that.Default.call(that, req, res, next); } );

        return this;
    }
};

})((typeof exports !== 'undefined' ? exports : this));

