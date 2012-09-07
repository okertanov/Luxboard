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
            return this;
        },
        InitializeIO: function()
        {
            var socket = this.ctx.socket = io.connect();

            socket.on('connect', function()
            {
                console.log('Socket.io connection.');
                $(document).attr("title", $(document).attr("title") + ' - [Connected]');

                socket.on('Luxboard.service.ping', function(msg)
                {
                    console.log('Socket.io ping received: ', msg);
                    socket.emit('Luxboard.service.ack', msg);
                });

                socket.on('Luxboard.service.message', function(msg)
                {
                    console.log('Socket.io service message received: ', msg);
                    socket.emit('Luxboard.service.ack', msg);
                });

                socket.on('Luxboard.service.ack', function(msg)
                {
                    console.log('Socket.io ack received: ', msg);
                });

                socket.on('disconnect', function()
                {
                    console.log('Socket.io disconnect.');
                });

                socket.on('Luxboard.jiraffe.trunk.unresolved', function(msg)
                {
                    console.log('Socket.io Luxboard.jiraffe.trunk.unresolved received: ', msg);
                    var num = (isNaN(parseInt(msg)) ? 0 : parseInt(msg));
                    $('#left.issues .counter').text(num);
                });

                socket.on('Luxboard.jiraffe.stable.unresolved', function(msg)
                {
                    console.log('Socket.io Luxboard.jiraffe.stable.unresolved received: ', msg);
                    var num = (isNaN(parseInt(msg)) ? 0 : parseInt(msg));
                    $('#right.issues .counter').text(num);
                });
            });
            return this;
        }
    };
};

})(jQuery, (typeof exports !== 'undefined' ? exports : this['Luxboard'] = {}));

