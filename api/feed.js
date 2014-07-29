/*jshint camelcase: false */
var feedParser = require('../lib/feed')
  , storeItems = require('./item').storeItems
  , setUserItems = require('./item').setUserItems
  , sync = require('sync');

exports.list = function list(req, res) {
    sync(function () {
        var feeds = [{
            type: 'feed',
            feed_id: 0,
            user_id: req.query.uid,
            title: "All",
            link: null
        }, {
            type: 'feed',
            feed_id: -1,
            user_id: req.query.uid,
            title: "New",
            link: null
        }, {
            type: 'feed',
            feed_id: -2,
            user_id: req.query.uid,
            title: "Stared",
            link: null
        }];

        var result = [],
            index = {},
            query = ['SELECT users_feeds.*, feeds.link, feeds.title AS origin_title, folders.name AS folder_name, folders.position AS folder_position',
                        'FROM feeds',
                        'LEFT JOIN users_feeds ON users_feeds.feed_id = feeds.id',
                        'LEFT JOIN folders ON users_feeds.folder_id = folders.id',
                    'WHERE users_feeds.user_id = ?',
                    'ORDER BY 9999 - folder_position DESC, `position`'].join(' ');
        req.db.query.sync(req.db, query, [req.query.uid])[0].forEach(function (feed) {

            var unreadQuery = ['SELECT COUNT(*) AS len',
                                'FROM items',
                                'LEFT JOIN users_feeds ON items.feed_id = users_feeds.feed_id',
                                'LEFT JOIN users_items ON items.id = users_items.item_id AND users_feeds.user_id = users_items.user_id',
                            'WHERE users_feeds.user_id = ? AND items.feed_id = ? AND unread = 1'].join(' ');
            feed.unread = req.db.query.sync(req.db, unreadQuery, [feed.user_id, feed.feed_id])[0][0].len;
            
                
            if (feed.folder_name) {
                if (!index[feed.folder_name]) {
                    index[feed.folder_name] = {
                        type: 'folder',
                        position: feed.folder_position,
                        name: feed.folder_name,
                        folder_id: feed.folder_id,
                        feeds: []
                    };
                    result.push(index[feed.folder_name]);
                }
                index[feed.folder_name].feeds.push(feed);
                return;
            }
            feed.type = 'feed';
            result = result.concat(feed);
        });

        req.db.query.sync(req.db, 'SELECT * FROM folders WHERE user_id = ?', [req.query.uid])[0].forEach(function (folder) {
            if (!index[folder.name]) {
                index[folder.name] = {
                    type: 'folder',
                    position: folder.position,
                    name: folder.name,
                    folder_id: folder.id,
                    feeds: []
                };
                result.push(index[folder.name]);
            }
        });

        res.json({
            type: 'feeds',
            data: feeds.concat(result),
            ott: res.ott
        });

    }, function (err) {
        if (err) {
            console.log(err);
        }
    });
};

function addFeed(req, res) {
    sync(function () {
        var url = req.body.url,
            uid = req.query.uid,
            feedData = null,
            feed = req.db.query.sync(req.db, 'SELECT `id`, `title` FROM `feeds` WHERE `link` = ? LIMIT 1', [url])[0];

        if (!feed.length) {
            feedData = feedParser.parse.sync(null, url);
            var feedId = req.db.query.sync(
                    req.db, 'INSERT IGNORE INTO `feeds` (`link`, `title`, `description`) VALUES (?, ?, ?)',
                    [url, feedData.title, feedData.description]
                ).insertId;
            feed = {
                id: feedId,
                title: feedData.title
            };
        } else {
            feed = feed[0];
        }
        
        var title = req.body.title ? req.body.title : feed.title,
            exist = ! req.db.query.sync(req.db,
            'INSERT IGNORE INTO `users_feeds` (user_id, feed_id, title, folder_id) VALUES (?, ?, ?, ?)',
            [uid, feed.id, title, req.body.folder]).affectedRows;

        var data = {
            ott: res.ott
        };
        if (exist) {
            res.status(400);
            data.error = "This feed alredy exists.";
            return res.json(data);
        }

        if (feedData) {
            feedData.id = feed.id;
            feedData.uid = [{user_id: uid}];
            storeItems(req.db, feedData);
        } else {
            setUserItems(req.db, feed.id, uid);
        }

        return res.json(data);
    }, function (err) {
        if (err) {
            console.log(err);
            res.status(500);
            res.json({
                error: 'Wrong URL.',
                ott: res.ott
            });
        }
    });
}

exports.delFeed = function list(req, res) {
    req.db.query('DELETE FROM `users_feeds` WHERE `user_id` = ? AND `feed_id` = ?', [req.query.uid, req.params.id], function (err) {
        if (err) { console.log(err); }
        res.json({
            ott: res.ott
        });
    });
};

exports.edit = function edit(req, res) {
    if (!req.body.feed_id) {
        addFeed(req, res);
        return;
    }
    
    var title = req.body.title ? req.body.title : req.body.origin_title;
    req.db.query('REPLACE INTO users_feeds VALUES (?, ?, ?, ?, ?)',
        [req.body.user_id, req.body.feed_id, title, req.body.folder, req.body.position]);
    
    res.json({
        ott: res.ott
    });
};

exports.savePosition = function savePosition(req, res) {
    req.body.pos.forEach(function (data) {
        if (data.type == 'folder') {
            req.db.query('UPDATE `folders` SET `position` = ? WHERE `id` = ? AND `user_id` = ?', [data.position, data.id, req.query.uid]);
        } else {
            req.db.query('UPDATE `users_feeds` SET `position` = ?, `folder_id` = ? WHERE `feed_id` = ? AND `user_id` = ?', [data.position, data.folder_id, data.id, req.query.uid]);
        }
    });
    res.json({
        ott: res.ott
    });
};