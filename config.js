var dataBaseCfg = {
    host     : 'localhost',
    user     : 'root',
    database : 'rss'
},  stPubKey = '8228ec0c-78ce-408c-b5c9-5c627eebe15c';

exports.db = (function () {
    return dataBaseCfg;
}());

exports.stPubKey = (function () {
    return stPubKey;
}());
