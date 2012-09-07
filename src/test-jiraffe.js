/**
    @file       test-jiraffe.js
    @brief      Jira API test suite.

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

var Jiraffe = require('./jiraffe.js').Jiraffe,
    Configuration = require('./configuration.js').Configuration;

function IsObjectEmpty(obj)
{
    return Object.keys(obj).length === 0;
}

try
{
    // Configuration
    var config = new Configuration('~/luxboard.config.json');

    // Constructor
    var jiraffe = new Jiraffe( config.jiraffe.host,
                               config.jiraffe.username,
                               config.jiraffe.password );

    // Initialize()
    jiraffe.Initialize();

    // Login()
    jiraffe.Login(function(data)
    {
        if ( jiraffe.IsLoggedin() )
        {
            // GetServerInfo()
            jiraffe.GetServerInfo(function(info)
            {
                if ( IsObjectEmpty(info) )
                    throw new Error('Jiraffe test error: Empty reply for GetServerInfo()');

                console.dir(info);
            });

            // GetUnresolvedIssueCountFor()
            jiraffe.GetUnresolvedIssueCountFor(11101, function(utrunk)
            {
                if ( IsObjectEmpty(utrunk) )
                    throw new Error('Jiraffe test error: Empty reply for GetUnresolvedIssueCountFor(trunk)');

                console.dir(utrunk);
            });

            // GetUnresolvedIssueCountFor()
            jiraffe.GetUnresolvedIssueCountFor(11800, function(ustable)
            {
                if ( IsObjectEmpty(ustable) )
                    throw new Error('Jiraffe test error: Empty reply for GetUnresolvedIssueCountFor(stable)');

                console.dir(ustable);
            });
        }
        else
        {
            throw new Error('Jiraffe test error: Unable to login.');
        }

        // Terminate()
        jiraffe.Terminate();
    });
}
catch(e)
{
    console.log(e);
}

process.on('uncaughtException', function(e)
{
    console.log('Jiraffe test uncaught exception:', e);
    process.exit(-1);
});

})();

