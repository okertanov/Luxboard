/**
    @file       periodic.js
    @brief      Periodik task control.

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

exports.Periodic = function(name, timeout, fn, args)
{
    return {
        ctx:
        {
            name:       name,
            timeout:    timeout,
            fn:         fn,
            args:       args,
            timer:      null
        },
        Initialize: function()
        {
            this.StartPeriodic();
            return this;
        },
        Terminate: function()
        {
            this.StopPeriodic();
            return this;
        },
        StartPeriodic: function()
        {
            var that = this;

            // Call the callback when provided
            if ( typeof that.ctx.fn === 'function' )
            {
                fn.apply(that, that.ctx.args);
            }

            // Schedule next run
            this.ctx.timer = setTimeout(function()
                {
                    // Re-launch self if enabled
                    if ( that.ctx.timer !== null )
                    {
                        that.StartPeriodic();
                    }
                },
                this.ctx.timeout
            );

            return this;
        },
        StopPeriodic: function()
        {
            if ( this.ctx.timer )
            {
                clearTimeout(this.ctx.timr),
                    this.ctx.timer = null;
            }

            return this;
        }
    };
};

})((typeof exports !== 'undefined' ? exports : this));

