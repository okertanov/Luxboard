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
    var jira = new Jiraffe( config.jiraffe.host,
                            config.jiraffe.username,
                            config.jiraffe.password );

    // Initialize()
    jira.Initialize();

    // Login()
    jira.Login(function(data)
    {
        if ( jira.IsLoggedin() )
        {
            // GetServerInfo()
            jira.GetServerInfo(function(info)
            {
                if ( IsObjectEmpty(info) )
                    throw new Error('Jiraffe test error: Empty reply for GetServerInfo()');

                console.dir(info);
            });

            // GetUnresolvedIssueCountFor()
            jira.GetUnresolvedIssueCountFor(config.jiraffe.versions[0].version, function(trunk)
            {
                if ( IsObjectEmpty(trunk) )
                    throw new Error('Jiraffe test error: Empty reply for GetUnresolvedIssueCountFor(trunk)');

                console.dir(trunk);
            });

            // GetRelatedIssueCountFor()
            jira.GetRelatedIssueCountFor(config.jiraffe.versions[0].version, function(trunk)
            {
                if ( IsObjectEmpty(trunk) )
                    throw new Error('Jiraffe test error: Empty reply for GetRelatedIssueCountFor(trunk)');

                console.dir(trunk);
            });
        }
        else
        {
            throw new Error('Jiraffe test error: Unable to login.');
        }

        // Terminate()
        jira.Terminate();
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

