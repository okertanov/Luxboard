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

function IsObjectEmpty(o)
{
    return Object.keys(o).length === 0;
}

var Jiraffe = require('./jiraffe.js').Jiraffe;

try
{
    // Constructor
    var jiraffe = new Jiraffe('http://jira.lan/', 'user', 'pwddwp');

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
    console.log('uncaughtException:', e);
});

})();

