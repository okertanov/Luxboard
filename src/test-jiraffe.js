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
    var jiraffe = new Jiraffe('http://jira.lan/', 'user', 'pwddwp');
    jiraffe.Initialize();
    jiraffe.Login(function()
    {
        if ( jiraffe.IsLoggedin() )
        {
            var info = jiraffe.GetServerInfo();
            console.dir(info);

            jiraffe.GetUnresolvedIssueCountFor(11101, function(utrunk){
            });
            jiraffe.GetUnresolvedIssueCountFor(11800);

            if ( IsObjectEmpty(uTrunk) )
                throw new Error('Jiraffe test error: Empty reply for GetUnresolvedIssueCountFor(trunk)');

            if ( IsObjectEmpty(uStable) )
                throw new Error('Jiraffe test error: Empty reply for GetUnresolvedIssueCountFor(stable)');

            console.dir(uTrunk),
                console.dir(uStable);
        }
        else
        {
            throw new Error('Jiraffe test error: Unable to login.');
        }
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

