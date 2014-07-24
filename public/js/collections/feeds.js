/*jshint camelcase: false */

var rss = (function (rss) {
    rss.Feeds = Backbone.Collection.extend({
        url: '/feeds',
        model: Backbone.Model.extend({
            idAttribute: 'feed_id',
            defaults: {
                feed_id: 0,
                title: '',
                folder_id: null
            },
            url: function () {
                return '/feeds/' + this.attributes.feed_id;
            },
            initialize: function () {
                this.on('change:unread', function (model, value) {
                    var feedId = model.get('feed_id');
                    $('#feedsList li[data-id=' + feedId + '] > span.badge').html(value === 0 ? null : value);
                });
            }
        }),
        parse: function (resp) {
            var coll = [];
    
            resp.forEach(function (feed) {
                if (feed.type == 'folder') {
                    feed.feeds.forEach(function (feed) {
                        coll.push(feed);
                    });
                    return;
                }
                coll.push(feed);
            });
            
            this.toRender = resp;
            return coll;
        }
    });
    
    return rss;
}(rss || {}));