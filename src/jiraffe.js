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
            timeout: 10000,
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
        DoRequest: function(options, cbCommon, cbLogicOK, cbLogicFail)
        {
            var that = this,
                data = {};

            console.log('Jiraffe.DoRequest() URI:', options.uri);

            request(options, function(error, response, body)
            {
                if ( !error && response.statusCode === 200 )
                {
                    if ( typeof cbLogicOK === 'function' )
                    {
                        cbLogicOK.call(that, error, response, body);
                    }

                    data = body;
                }
                else
                {
                    var err = response && response.statusCode ? response.statusCode :
                                    error && error.errno ? error.errno : 'unknown';
                    console.log('Jiraffe.DoRequest() Error:', err);

                    if ( typeof cbLogicFail === 'function' )
                    {
                        cbLogicFail.call(that, error, response, body);
                    }
                }

                if ( typeof cbCommon === 'function' )
                {
                    cbCommon.call(that, data);
                }
            });
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
                    timeout: this.ctx.timeout,
                    uri: uri,
                    method: 'POST',
                    json: true,
                    body:
                    {
                        'username': this.ctx.user,
                        'password': this.ctx.password
                    }
                };

            this.ctx.logged = false;

            this.DoRequest(options, cb,
                function OK(error, response, body)
                {
                    that.ctx.logged = true;
                    console.log('Jiraffe.Login() OK.');
                },
                function Failed(error, response, body)
                {
                    that.ctx.logged = false;
                    console.log('Jiraffe.Login() Error:', 'Failed.');
                }
            );

            return this;
        },
        Logout: function()
        {
            this.ctx.logged = false;
        },
        IsLoggedin: function()
        {
            return this.ctx.logged;
        },
        GetServerInfo: function(cb)
        {
            var that = this,
                uri =
                [
                    this.ctx.link,
                    this.ctx.api,
                    'serverInfo',
                ].join(''),
                options =
                {
                    timeout: this.ctx.timeout,
                    uri: uri,
                    method: 'GET',
                    json: true
                };

            if ( this.IsLoggedin() )
            {
                this.DoRequest(options, cb,
                    function OK(error, response, body)
                    {
                        console.log('Jiraffe.GetServerInfo() OK.');
                    },
                    function Failed(error, response, body)
                    {
                        console.log('Jiraffe.GetServerInfo() Error:', 'Failed.');
                    }
                );
            }

            return this;
        },
        GetUnresolvedIssueCountFor: function(id, cb)
        {
            var that = this,
                uri =
                [
                    this.ctx.link,
                    this.ctx.api,
                    'version',
                    '/', id, '/',
                    'unresolvedIssueCount'
                ].join(''),
                options =
                {
                    timeout: this.ctx.timeout,
                    uri: uri,
                    method: 'GET',
                    json: true
                };

            if ( this.IsLoggedin() )
            {
                this.DoRequest(options, cb,
                    function OK(error, response, body)
                    {
                        console.log('Jiraffe.GetUnresolvedIssueCountFor() OK.');
                    },
                    function Failed(error, response, body)
                    {
                        console.log('Jiraffe.GetUnresolvedIssueCountFor() Error:', 'Failed.');
                    }
                );
            }

            return this;
        },
        GetRelatedIssueCountFor: function(id, cb)
        {
            var that = this,
                uri =
                [
                    this.ctx.link,
                    this.ctx.api,
                    'version',
                    '/', id ,'/',
                    'relatedIssueCounts'
                ].join(''),
                options =
                {
                    timeout: this.ctx.timeout,
                    uri: uri,
                    method: 'GET',
                    json: true
                };

            if ( this.IsLoggedin() )
            {
                this.DoRequest(options, cb,
                    function OK(error, response, body)
                    {
                        console.log('Jiraffe.GetRelatedIssueCountFor() OK.');
                    },
                    function Failed(error, response, body)
                    {
                        console.log('Jiraffe.GetRelatedIssueCountFor() Error:', 'Failed.');
                    }
                );
            }

            return this;
        },
        GetIssue: function(id, cb)
        {
            var that = this,
                uri =
                [
                    this.ctx.link,
                    this.ctx.api,
                    'issue',
                    '/', id
                ].join(''),
                options =
                {
                    timeout: this.ctx.timeout,
                    uri: uri,
                    method: 'GET',
                    json: true
                };

            if ( this.IsLoggedin() )
            {
                this.DoRequest(options, cb,
                    function OK(error, response, body)
                    {
                        console.log('Jiraffe.GetIssue() OK.');
                    },
                    function Failed(error, response, body)
                    {
                        console.log('Jiraffe.GetIssue() Error:', 'Failed.');
                    }
                );
            }

            return this;
        },
        SearchWithJql: function(jql, start, max)
        {
            var jql = jql || '',
                start = start || 0,
                max = max || 100;
                that = this,
                uri =
                [
                    this.ctx.link,
                    this.ctx.api,
                    'search'
                ].join(''),
                options =
                {
                    timeout: this.ctx.timeout,
                    uri: uri,
                    method: 'POST',
                    json: true,
                    body:
                    {
                        'jql': jql,
                        'startAt': start,
                        'maxResults': max
                    }
                };

            if ( this.IsLoggedin() )
            {
                this.DoRequest(options, cb,
                    function OK(error, response, body)
                    {
                        console.log('Jiraffe.SearchWithJql() OK.');
                    },
                    function Failed(error, response, body)
                    {
                        console.log('Jiraffe.SearchWithJql() Error:', 'Failed.');
                    }
                );
            }

            return this;
        }
    };
};

})((typeof exports !== 'undefined' ? exports : this));

