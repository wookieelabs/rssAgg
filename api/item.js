/*jshint camelcase: false */

var sync = require('sync'),
    feedParser = require('../lib/feed');

function getOrder(value) {
    return {
        by: value == 'date' ? 'pubDate' : 'unread',
        a: value == 'date' ? 'DESC' : 'DESC, pubDate DESC'
    };
}

function Query(db, from, fields) {
    this._db = db;
    this._fields = fields;
    this._from = from;
    this._where = [];
    this._order = [];
    this.s = this.valueOf = this.toString;
}

Query.prototype = {
    constructor: Query,
    fields: function (fields) {
        this._fields = fields;
        return this;
    },
    leftJoin: function (table, criteria) {
        this._from += "\n LEFT JOIN " + table + ' ON ' + criteria;
        return this;
    },
    where: function (criteria) {
        this._where.push(criteria);
        return this;
    },
    order: function (field, dir) {
        dir = dir || 'ASC';
        this._order.push(field + ' ' + dir);
        return this;
    },
    limit: function (offset, limit) {
        if (arguments.length == 1) {
            this._limit = offset;
            return this;
        }
        this._limit = limit;
        this._offset = offset;
        return this;
    },
    offset: function (offset) {
        this._offset = offset;
        return this;
    },
    toString: function () {
        return 'SELECT ' + this._fields + "\n FROM " + this._from +
            (this._where.length ? "\n WHERE " + this._where.join(' AND ') : '') +
            (this._order.length ? "\n ORDER BY " + this._order.join(',') : '') +
            (this._limit ? "\n LIMIT " + this._limit + (this._offset ? ', ' + this._offset : '') : '');
    },
    exec: function (params, fn) {
        this._db.query(this.s(), params, fn);
    },
    format: function (params) {
        return this._db.format(this.s(), params);
    }
};

exports.newsline = function newsline(req, res) {
    sync(function () {
        var order = getOrder(req.query.order_by),
            query = new Query(req.db, 'items', 'COUNT(*) AS length')
            .leftJoin('users_feeds', 'items.feed_id = users_feeds.feed_id')
            .leftJoin('users_items', 'items.id = users_items.item_id AND users_feeds.user_id = users_items.user_id')
            .where('users_feeds.user_id = ?')
            .order(order.by, order.a),
            
            from = req.query.from ? Number(req.query.from) : 0,
            length = query.exec.sync(query, [req.query.uid])[0][0].length;

        query
            .fields('items.*, users_items.stared, users_items.unread')
            .limit('?', '?');

        var results = query.exec.sync(query, [req.query.uid, from, 30])[0];

        res.json({
            data: {
                items: results,
                len: length
            },
            ott: res.ott
        });
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};

exports.list = function list(req, res) {
    sync(function () {
        var order = getOrder(req.query.order_by),
            query = new Query(req.db, 'items', 'COUNT(*) AS length')
            .leftJoin('users_feeds', 'items.feed_id = users_feeds.feed_id')
            .leftJoin('users_items', 'items.id = users_items.item_id AND users_feeds.user_id = users_items.user_id')
            .where('users_feeds.user_id = ? AND items.feed_id = ?')
            .order(order.by, order.a);

        var from = req.query.from ? Number(req.query.from) : 0,
            length = query.exec.sync(query, [req.query.uid, req.params.id])[0][0].length;

        query
            .fields('items.*, users_items.stared, users_items.unread')
            .limit('?', '?');

        var results = query.exec.sync(query, [req.query.uid, req.params.id, from, 30])[0];

        res.json({
            data: {
                items: results,
                len: length
            },
            ott: res.ott
        });
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};

exports.showNew = function showNew(req, res) {
    sync(function () {
        var order = getOrder(req.query.order_by),
            query = new Query(req.db, 'items', 'COUNT(*) AS length')
            .leftJoin('users_feeds', 'items.feed_id = users_feeds.feed_id')
            .leftJoin('users_items', 'items.id = users_items.item_id AND users_feeds.user_id = users_items.user_id')
            .where('users_feeds.user_id = ? AND unread = 1')
            .order(order.by, order.a);
            
        var from = req.query.from ? Number(req.query.from) : 0,
            length = query.exec.sync(query, [req.query.uid])[0][0].length;
        
        query
            .fields('items.*, users_items.stared, users_items.unread')
            .limit('?', '?');

        var results = query.exec.sync(query, [req.query.uid, from, 30])[0];

        res.json({
            data: {
                items: results,
                len: length
            },
            ott: res.ott
        });
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};

exports.showStared = function showStared(req, res) {
    sync(function () {
        var order = getOrder(req.query.order_by),
            query = new Query(req.db, 'items', 'COUNT(*) AS length')
            .leftJoin('users_feeds', 'items.feed_id = users_feeds.feed_id')
            .leftJoin('users_items', 'items.id = users_items.item_id AND users_feeds.user_id = users_items.user_id')
            .where('users_feeds.user_id = ? AND stared = 1')
            .order(order.by, order.a);

        var from = req.query.from ? Number(req.query.from) : 0,
            length = query.exec.sync(query, [req.query.uid])[0][0].length;

        query
            .fields('items.*, users_items.stared, users_items.unread')
            .limit('?', '?');

        var results = query.exec.sync(query, [req.query.uid, from, 30])[0];

        res.json({
            data: {
                items: results,
                len: length
            },
            ott: res.ott
        });
    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};

exports.save = function save(req, res) {
    sync(function () {
        var stared = req.body.stared ? req.body.stared : 0,
            unread = req.body.unread ? req.body.unread : 0;
        if (req.body.stared === 0 && req.body.unread === 0) {
            req.db.query.sync(req.db, 'DELETE FROM `users_items` WHERE user_id = ? AND item_id = ?', [req.query.uid, req.params.id]);
        } else {
            req.db.query.sync(req.db, 'REPLACE INTO `users_items` VALUES (?, ?, ?, ?)', [req.query.uid, req.params.id, stared, unread]);
        }

        res.json({
            ott: res.ott
        });

    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};

function storeItems(db, feed) {
    
    //console.log(feed.getItem(0))._get('title');
    
    for (var i = 0; i < feed.length; i++) {
        var item = feed.getItem(i).toJSON();
        db.query('INSERT IGNORE INTO `rss`.`items` (`feed_id`, `title`, `link`, `description`, `author`, `pubDate`) VALUES  (?, ?, ?, ?, ?, ?)',
                          [feed.id, item.title, item.link, item.description, item.author, item.pubDate], function (err, result) {
            if (err) {
                console.log(err);
            }
            if (result.insertId) {
                feed.uid.forEach(function (uid) {
                    uid = uid.user_id;
                    var insertId = result.insertId;
                    db.query('INSERT INTO `rss`.`users_items` (`user_id`, `item_id`) VALUES (?, ?)', [uid, insertId], function (err) {
                        if (err) { console.log(err); }
                    });
                });
            }
        });
    }
}

exports.storeItems = storeItems;

exports.setUserItems = function (db, feedId, uid) {
    db.query(
        "INSERT INTO `users_items` (user_id, item_id) SELECT ? AS 'user_id', id AS 'item_id' FROM items WHERE feed_id = ?",
        [uid, feedId],
        function (err) {
            if (err) {
                console.log(err);
            }
        }
    );
};

exports.updateItems = function (db) {
    sync(function () {
        db.query.sync(db, 'SELECT * FROM feeds')[0].forEach(function (feedData) {
            var feed = feedParser.parse.sync(null, feedData.link);
            feed.id = feedData.id;
            feed.uid =  db.query.sync(db, 'SELECT `users_feeds`.`user_id` FROM `users_feeds` WHERE `users_feeds`.`feed_id` = ?', [feedData.id])[0];
            storeItems(db, feed);
        });
    }, function (err) {
        if (err) {
            throw err;
        }
    });
};

exports.readAll = function (req, res) {
    var id = Number(req.body.id),
        uid = Number(req.query.uid);

    if (id <= 0) {
        switch (id) {
            case 0:
            case -1:
                req.db.query('UPDATE `users_items` SET unread = 0 WHERE unread = 1 AND user_id = ?', [uid]);
                req.db.query('DELETE FROM users_items WHERE user_id = ? AND unread = 0 AND stared = 0', [uid]);
                break;
            
            case -2:
                req.db.query('UPDATE `users_items` SET unread = 0 WHERE unread = 1 AND user_id = ? AND stared = 1', [uid]);
                break;
        }
    } else {
        sync(function () {
            var query = ['UPDATE users_items',
                            'SET unread = 0',
                            'WHERE item_id IN (SELECT id FROM (SELECT item_id AS id FROM users_items',
                                'LEFT JOIN items ON users_items.item_id = items.id',
                                'WHERE user_id = ? AND feed_id = ? AND stared = 1) AS tmp)',
                            'AND user_id = ?'].join(' ');
    
            req.db.query.sync(req.db, query, [uid, id, uid]);
    
            query = ['DELETE FROM users_items',
                        'WHERE item_id IN (SELECT id FROM (SELECT item_id AS id FROM users_items',
                            'LEFT JOIN items ON users_items.item_id = items.id',
                            'WHERE user_id = ? AND feed_id = ? AND stared = 0) AS tmp)',
                        'AND user_id = ?'].join(' ');
    
            req.db.query.sync(req.db, query, [uid, id, uid]);
        }, function (err) {
            if (err) {
                throw err;
            }
        });
    }
    
    res.json({
        ott: res.ott
    });
};
