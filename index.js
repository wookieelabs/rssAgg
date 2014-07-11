var express = require('express')
  , app = express()
  , api = {
        user: require('./api/user')
      , feed: require('./api/feed')
      , item: require('./api/item')
      , folder: require('./api/folder')
    }
  , mysql = require('mysql')
  , CronJob = require('cron').CronJob;


var db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    database : 'rss',
});

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

function checkOTT(req, res, next) {
    var ott = api.user.checkOTT(req.query.uid, req.query.ott);
    if (ott) {
        res.ott = ott;
        next();
    } else {
        res.status(401);
        res.json({
            error: 'Wrong token.'
        });
    }
}

app.get('/', function index(req, res) {
    res.render('index');
});

app.get('/admControl', function index(req, res) {
    res.render('admin');
});

app.get('/auth', api.user.auth);
app.post('/register', api.user.register);
app.get('/sessionCheck', function (req, res) {
    var ott = api.user.checkOTT(req.query.uid, req.query.ott);
    if (ott) {
        req.db.query('SELECT id, username FROM  users WHERE id = ?', [req.query.uid], function (err, result) {
            if (err) {
                throw err;
            }
            result[0].ott = ott;
            res.json(result[0]);
        });
    } else {
        res.status(401);
        res.json({
            error: 'Wrong token.'
        });
    }
});

app.get('/feeds', checkOTT, api.feed.list);
app.put('/feeds/:id', checkOTT, api.feed.edit);
app.delete('/feeds/:id', checkOTT, api.feed.delFeed);

app.post('/savePosition', checkOTT, api.feed.savePosition);

app.get('/folders', checkOTT, api.folder.list);
app.put('/folders/:id', checkOTT, api.folder.edit);
app.delete('/folders/:id', checkOTT, api.folder.deleteFolder);

app.get('/items', checkOTT, api.item.newsline);
app.get('/items/0', checkOTT, api.item.newsline);
app.put('/items/0/:id', checkOTT, api.item.save);
app.get('/items/-1', checkOTT, api.item.showNew);
app.put('/items/-1/:id', checkOTT, api.item.save);
app.get('/items/-2', checkOTT, api.item.showStared);
app.put('/items/-2/:id', checkOTT, api.item.save);
app.get('/items/:id', checkOTT, api.item.list);
app.put('/items/:fid/:id', checkOTT, api.item.save);
app.post('/readAll', checkOTT, api.item.readAll);

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