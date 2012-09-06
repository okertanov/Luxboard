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
            args:       args
        },
        Initialize: function()
        {
            this.StartPeriodic();
            return this;
        },
        Terminate: function()
        {
            this.StopTimeout();
            return this;
        },
        StartTimeout: function()
        {
            var that = this;
            this.ctx.timeout = setTimeout(function()
                {
                    // Call the callback when provided
                    if ( typeof that.ctx.fn === 'function' )
                    {
                        fn.apply(that, that.ctx.args);
                    }

                    // Re-launch self if enabled
                    if ( this.ctx.timeout !== null )
                    {
                        that.StartTimeout();
                    }
                },
                this.ctx.timeout
            );

            return this;
        },
        StopTimeout: function()
        {
            if ( this.ctx.timeout )
            {
                clearTimeout(this.ctx.timeout),
                    this.ctx.timeout = null;
            }

            return this;
        }
    };
};

})((typeof exports !== 'undefined' ? exports : this));

