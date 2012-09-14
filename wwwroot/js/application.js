/**
    @file       application.js
    @brief      Client-side application.

    @author     Oleg Kertanov <okertanov@gmail.com>
    @date       September 2012
    @copyright  Copyright (C) 2012 Oleg Kertanov <okertanov@gmail.com>
    @license    BSD
    @see LICENSE file
*/

/**
    @brief IIFE
    @see https://developer.mozilla.org/en/JavaScript/Reference/Operators/function
*/
(function($, exports)
{

/**
    @brief Strict mode by default
    @see https://developer.mozilla.org/en/JavaScript/Strict_mode
*/
"use strict";

/**
    @fn $(function())
    @brief jQuery-like ready() that re-launches every <script></script> load.
    @see http://api.jquery.com/ready/
    @attention So try to avoid direct code invocation at the top of current namespace
               and here, in DOM's ready handler.
*/
$(function($, exports)
{
    try
    {
        var that = this,
            app = new Luxboard.Application();

        app.Initialize();

        $(window).bind('beforeunload', function(e)
        {
            app.Terminate();
            return undefined;
        });
    }
    catch(e)
    {
        console.log(e, e.toString());
    }
});

/**
    @class exports.Application
    @brief Application
*/
exports.Application = function()
{
    return {
        ctx:
        {
            socket: null
        },
        Initialize: function()
        {
            console.log('Application:', 'Starting...');

            try
            {
                this.InitializeUI(),
                    this.InitializeIO();
            }
            catch(e)
            {
                console.log(e, e.toString());
            }

            return this;
        },
        Terminate: function()
        {
            console.log('Application:', 'Terminating.');

            return this;
        },
        InitializeUI: function()
        {
            // Disable elastic page scrolling
            $(document).bind('touchmove', false);

            // Setup plot
            var options =
            {
                series: { shadowSize: 0 },
                lines:  { show: true    },
                legend: { show: false   },
                points: { show: true    },
                yaxis:  { show: true,
                          autoscaleMargin: 0.02 },
                xaxis:  { show: true,
                          mode: "time",
                          autoscaleMargin: 0.02 },
                grid:   { show: false   }
            };

            var plots =
            [
                {
                    "label": "",
                    "data": []
                },
                {
                    "label": "",
                    "data": []
                }
            ];

            var plot = this.ctx.plot = $.plot($("div.plot"), plots, options);

            return this;
        },
        InitializeIO: function()
        {
            var that = this,
                connectedstr = ' - [Connected]',
                socket = this.ctx.socket = io.connect();

            socket.on('connect', function()
            {
                console.log('Socket.io connection.');
                $(document).attr("title", $(document).attr("title") + connectedstr);

                socket.on('luxboard.service.ping', function(msg)
                {
                    console.log('Socket.io ping received:', msg);
                    socket.emit('luxboard.service.ack', msg);
                });

                socket.on('luxboard.service.message', function(msg)
                {
                    console.log('Socket.io service message received:', msg);
                    socket.emit('luxboard.service.ack', msg);
                });

                socket.on('luxboard.service.ack', function(msg)
                {
                    console.log('Socket.io ack received:', msg);
                });

                socket.on('disconnect', function()
                {
                    console.log('Socket.io disconnect.');
                    var title = $(document).attr("title"),
                        newtitle = title.replace(connectedstr, '');
                    $(document).attr("title", newtitle);
                });

                socket.on('luxboard.jiraffe.trunk.unresolved', function(msg)
                {
                    console.log('Socket.io luxboard.jiraffe.trunk.unresolved received:', msg);
                    var num = (isNaN(parseInt(msg)) ? 0 : parseInt(msg));
                    $('#left.issues .counter').text(num);
                });

                socket.on('luxboard.jiraffe.stable.unresolved', function(msg)
                {
                    console.log('Socket.io luxboard.jiraffe.stable.unresolved received:', msg);
                    var num = (isNaN(parseInt(msg)) ? 0 : parseInt(msg));
                    $('#right.issues .counter').text(num);
                });

                socket.on('luxboard.jiraffe.timeline', function(msg)
                {
                    console.log('Socket.io luxboard.jiraffe.timeline received:', msg);

                    that.ctx.plot.setData(msg);
                    that.ctx.plot.setupGrid();
                    that.ctx.plot.draw();
                });

                socket.on('luxboard.cruize.status', function(msg)
                {
                    console.log('Socket.io luxboard.cruize.status received:', msg);

                    var project = msg;
                    /*
                        project.name
                        project.activity
                        project.lastBuildStatus
                    */
                });
            });

            return this;
        }
    };
};

})(jQuery, (typeof exports !== 'undefined' ? exports : this['Luxboard'] = {}));

