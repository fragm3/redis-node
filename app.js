var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var redis = require('redis');

var app = express();

//Create client
var client = redis.createClient();

client.on('connect', () => {
    console.log("Redis server connected");
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    var text = "Home page";
    client.lrange('tasks', 0, -1, function(err, reply) {
        client.hgetall('call', (err, call) => {
            res.render('index', {
                tasks: reply,
                title: text,
                call: call
            });
        })
    });
});

app.post('/task/add', (req, res) => {
    var task = req.body.task;
    client.rpush('tasks', task, (err, reply) => {
        if(err){
            console.log("Error", err);
        }
        console.log("Task added", reply);
        res.redirect("/");
    });
});

app.post('/task/delete', (req, res) => {
    var tasksToDel = req.body.tasks;
    client.lrange('tasks', 0, -1, (err, tasks) => {
        for(var i = 0; i< tasks.length; i++){
            if(tasksToDel.indexOf(tasks[i]) > -1){
                client.lrem('tasks', 0, tasks[i], () =>{
                    if(err){
                        console.log("Error");
                    }
                });
            }
        }
        res.redirect('/');
    });
});

app.post('/call/add', (req, res) => {
    var newCall = {};
    newCall.name = req.body.name;
    newCall.company = req.body.company;
    newCall.phone = req.body.phone;
    newCall.time = req.body.time;

    client.hmset('call', ['name', newCall.name, 'company', newCall.company, 'phone', newCall.phone, 'time', newCall.time], function(err, reply){
        if(err) console.log(err);
        console.log(reply)
        res.redirect('/');
    });
});

app.listen(3000);
console.log("Server started on port 3000");

module.exports = app;
