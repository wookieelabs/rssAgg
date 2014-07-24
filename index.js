var express = require('express')
  , app = express()
  , api = {
        user: require('./api/user')
      , feed: require('./api/feed')
      , item: require('./api/item')
      , folder: require('./api/folder')
    }
  , config = require('./config.json')
  , mysql = require('mysql')
  , CronJob = require('cron').CronJob;


var db = mysql.createConnection(config.dataBase);
db.connect();

app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/view');
app.set('view engine', 'html');

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static('public'));

app.use(function addDB(req, res, next) {
    req.db = db;
    next();
});

app.get('/', function index(req, res) {
    res.render('index', {
        stPubKey : config.stPubKey
    });
});

app.get('/admControl', function index(req, res) {
    res.render('admin');
});

app.get('/auth', api.user.auth);
app.post('/register', api.user.register);
app.get('/sessionCheck', api.user.sessionCheck);

app.get('/feeds', api.user.checkOTT, api.feed.list);
app.put('/feeds/:id', api.user.checkOTT, api.feed.edit);
app.delete('/feeds/:id', api.user.checkOTT, api.feed.delFeed);

app.post('/savePosition', api.user.checkOTT, api.feed.savePosition);

app.get('/folders', api.user.checkOTT, api.folder.list);
app.put('/folders/:id', api.user.checkOTT, api.folder.edit);
app.delete('/folders/:id', api.user.checkOTT, api.folder.deleteFolder);

app.get('/items', api.user.checkOTT, api.item.newsline);
app.get('/items/0', api.user.checkOTT, api.item.newsline);
app.put('/items/0/:id', api.user.checkOTT, api.item.save);
app.get('/items/-1', api.user.checkOTT, api.item.showNew);
app.put('/items/-1/:id', api.user.checkOTT, api.item.save);
app.get('/items/-2', api.user.checkOTT, api.item.showStared);
app.put('/items/-2/:id', api.user.checkOTT, api.item.save);
app.get('/items/:id', api.user.checkOTT, api.item.list);
app.put('/items/:fid/:id', api.user.checkOTT, api.item.save);
app.post('/readAll', api.user.checkOTT, api.item.readAll);

app.get('/getUsers', api.user.getUsers);

app.all('*', function (req, res) {
    res.send('Not Found', 404);
});

(function updateItems() {
    console.log('Updaiting items');
    api.item.updateItems(db);

    new CronJob('00 */5 * * * *', function () {
        console.log('Updaiting items');
        api.item.updateItems(db);
    }).start();
}());

app.listen(7050);
console.log('Server started on 7050');