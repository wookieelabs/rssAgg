/*jshint camelcase: false */

exports.list = function list(req, res) {
    req.db.query('SELECT * FROM folders WHERE user_id = ?', [req.query.uid], function (err, result) {
        if (err) {
            throw err;
        }
        res.json({
            data: result,
            ott: res.ott
        });
    });
};

exports.edit = function edit(req, res) {
    if (req.body.id) {
        req.db.query('UPDATE `folders` SET `name` = ? WHERE `id` = ? AND `user_id` = ?',
            [req.body.name, req.body.id, req.query.uid]);
    } else {
        req.db.query('INSERT INTO `folders` (`name`, `user_id`) VALUES (?, ?)',
            [req.body.name, req.query.uid]);
    }
    res.json({
        ott: res.ott
    });
};

exports.deleteFolder = function deleteFolder(req, res) {
    var folder_id = req.params.id;
    req.db.query('UPDATE `users_feeds` SET `folder_id` = NULL WHERE `folder_id` = ? AND `user_id` = ?', [folder_id, req.query.uid], function (err) {
        if (err) {
            res.status(400);
            res.json({
                error: err,
                ott: res.ott
            });
            return;
        }
        req.db.query('DELETE FROM folders WHERE id = ?', [folder_id]);
        res.json({
            ott: res.ott
        });
    });
};