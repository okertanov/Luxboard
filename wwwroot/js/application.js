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
$(function()
{
    try
    {
        var that = this,
            app = new exports.Application();

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
        },
        Initialize: function()
        {
            console.log('Application:', 'Starting...');

            try
            {
                this.InitializeUI();
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
        }
    };
};

})(jQuery, (typeof exports !== 'undefined' ? exports : this['Luxboard'] = {}));

