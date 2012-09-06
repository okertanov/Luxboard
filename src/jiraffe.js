/**
    @file       jiraffe.js
    @brief      Jira API.

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

var request = require('request');

exports.Jiraffe = function(link, user, password)
{
    return {
        ctx:
        {
            link: link,
            user: user,
            password: password,
            api:  '/rest/api/latest/',
            auth: '/rest/auth/1/'
        },
        Initialize: function()
        {
            return this;
        },
        Terminate: function()
        {
            return this;
        },
        Login: function(cb)
        {
            var that = this,
                uri =
                [
                    this.ctx.link,
                    this.ctx.auth,
                    'session'
                ].join(''),
                options =
                {
                    uri: uri,
                    method: 'POST',
                    json: true,
                    body:
                    {
                        'username': this.ctx.user,
                        'password': this.ctx.password
                    }
                };

            request(options, function(error, response, body)
            {
                if ( !error )
                {
                    if ( response.statusCode === 200 )
                    {
                        if ( response.headers['Set-Cookie'] )
                        {
                            that.ctx.cookies = response.headers['Set-Cookie'];
                            that.ctx.logged = true;
                            console.log('Jiraffe.Login() OK:', that.ctx.cookies);
                        }
                        else
                        {
                            console.log('Jiraffe.Login() Error:', 'No Set-Cookie header found.');
                        }
                    }
                    else
                    {
                        console.log('Jiraffe.Login() Error:', response.statusCode);
                    }
                }
                else
                {
                    console.log('Jiraffe.Login() Error:', error.errno);
                }

                if ( typeof cb === 'function' )
                {
                    cb.call(this);
                }
            });

            return this;
        },
        IsLoggedin: function()
        {
            return this.ctx.logged;
        },
        GetServerInfo: function(cb)
        {
            var info = {};

            if ( typeof cb === 'function' )
            {
                cb.call(this, info);
            }

            return this;
        },
        GetUnresolvedIssueCountFor: function(id, cb)
        {
            var issues = {};

            if ( typeof cb === 'function' )
            {
                cb.call(this, issues);
            }

            return this;
        }
    };
};

})((typeof exports !== 'undefined' ? exports : this));

