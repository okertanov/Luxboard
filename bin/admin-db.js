var mongoose = require("mongoose"),
    conn = mongoose.connect("mongodb://localhost/Luxboard");

mongoose.connection.on('open', function(){
        mongoose.connection.db.dropDatabase(function(){
            console.log('Done.');
        });
    });
