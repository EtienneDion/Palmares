var http = require('http')
    , fs = require('fs')
    , util = require('util');

var app = {};
app.utils = require('../functions/utils.js')(app);
app.functions = require('../functions/functions.js')(app);


var userId = null;
var categorie = {id:1};
var toolsArray =    [
                        {name:"first", id:11, cat:1, createdtime:new Date()-100000 },
                        {name:"second", id:12, cat:1, createdtime:new Date()-100000 },
                        {name:"third", id:13, cat:1, createdtime:new Date()-100000 },
                        {name:"fourth", id:14, cat:1, createdtime:new Date()-100000 },
                        {name:"fifth", id:15, cat:1, createdtime:new Date()-100000 },
                        {name:"sixth", id:16, cat:1, createdtime:new Date()-100000 }
                    ];

var votesArray =    [
                        { id:11, pos: 1, user:122, time:new Date()-500, current:1 },
                        { id:12, pos: 2, user:122, time:new Date()-500, current:1 },
                        { id:13, pos: 3, user:122, time:new Date()-500, current:1 },
                        { id:14, pos: 4, user:122, time:new Date()-500, current:1 },
                        { id:15, pos: 5, user:122, time:new Date()-500, current:1 },
                        { id:16, pos: 6, user:122, time:new Date()-500, current:1 },

                        { id:11, pos: 6, user:122, time:new Date()-50000, current:0 },
                        { id:12, pos: 5, user:122, time:new Date()-50000, current:0 },
                        { id:13, pos: 4, user:122, time:new Date()-50000, current:0 },
                        { id:14, pos: 3, user:122, time:new Date()-50000, current:0 },
                        { id:15, pos: 2, user:122, time:new Date()-50000, current:0 },
                        { id:16, pos: 1, user:122, time:new Date()-50000, current:0 }

                    ];


var test1 = app.functions.processTools(userId, categorie, toolsArray, votesArray);

app.utils.sortTools(userId, test1);

console.log(test1);


http.createServer(function(request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write(  "test"  );
    response.end();
}).listen(8888);


console.log('test started on port 8888');