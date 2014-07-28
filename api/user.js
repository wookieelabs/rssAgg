var crypto = require('crypto')
  , sync = require('sync');
var iterCnt = 512;
var pwdtLen = 32;
var saltLen = 16;
var userToOTT = {};

function getOTT() {
    var shasum = crypto.createHash('sha1');
    shasum.update(Date.now().toString());
    return shasum.digest('hex');
}

function generateOTT(uid, ott) {
    if (userToOTT[uid] == ott) {
        userToOTT[uid] = getOTT();
        return userToOTT[uid]; 
    } else {
        delete userToOTT[uid];
        return false;
    } 
}

exports.checkOTT = function checkOTT(req, res, next) {
    var ott = generateOTT(req.query.uid, req.query.ott);
    if (ott) {
        res.ott = ott;
        next();
    } else {
        res.status(401);
        res.json({
            error: 'Wrong token.'
        });
    }
};

exports.sessionCheck = function (req, res) {
    sync(function () {
        var ott = generateOTT(req.query.uid, req.query.ott);;
        if (ott) {
            var result = req.db.query.sync(req.db, 'SELECT id, username FROM users WHERE id = ?', [req.query.uid])[0][0];
            result.ott = ott;
            res.json(result);
        } else {
            res.status(401);
            res.json({
                error: 'Wrong token.'
            });
        }
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};

exports.auth = function auth(req, res) {
    sync(function () {
        var user = req.db.query.sync(req.db, 'SELECT id, username, password, salt FROM users WHERE username = ?', ['' + req.query.username])[0][0];
        if (!user) {
            res.status(401);
            res.json({
                error: 'User with this email does not exist.'
            });
        }
        var pass = crypto.pbkdf2.sync(null, req.query.password + '', user.salt + '', iterCnt, pwdtLen).toString('hex');
        if (pass == user.password) {
            var ott = getOTT();
            userToOTT[user.id] = ott;
            res.json({
                id: user.id,
                username: user.username,
                ott: ott
            });
        } else {
            res.status(401);
            res.json({
                error: 'Wrong email or password.'
            });
        }
    }, function (err) {
        if (err) { throw err; }
    });
};

exports.register = function register(req, res) {
    sync(function () {
        if (req.body.pw == req.body.cpw) {
            var salt = crypto.randomBytes(saltLen).toString('hex'),
            password = crypto.pbkdf2.sync(null, req.body.pw, salt, iterCnt, pwdtLen).toString('hex'),
            accountValidation = req.db.query.sync(req.db, 'SELECT username FROM users WHERE username = ?', [req.body.username + ''])[0];
            
            if (accountValidation.length === 0) {
                var insertedId = req.db.query.sync(req.db, 'INSERT INTO users (username, password, salt) VALUES (?, ?, ?)', [req.body.username, password, salt]).insertId,
                    ott = getOTT();
                userToOTT[insertedId] = ott;
                res.json({
                    id: insertedId,
                    username: req.body.username,
                    ott: ott
                });
            } else {
                res.status(400);
                res.json({error: 'User already exist.'});
            }
        } else {
            res.status(400);
            res.json({error: 'Password does not match the confirm password.'});
        }
        
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};

exports.getUsers = function getUsers(req, res) {
    sync(function () {
        var users = req.db.query.sync(req.db, 'SELECT `id`, `username`, `SU` FROM `users`')[0];
        res.json(users);
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};