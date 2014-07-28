var rss = (function (rss) {
    rss.Items = Backbone.Collection.extend({
        feedId: 0,
        url: function () {
            return '/items/' + this.feedId;
        },
        parse: function (response) {
            this.size = response.len;
            return response.items;
        },
        model: Backbone.Model.extend({
            parse: function (data) {
                if (data.hasOwnProperty('stared')) {
                    data.stared = !!data.stared;
                }
                if (data.hasOwnProperty('unread')) {
                    data.unread = !!data.unread;
                }
                return data;
            }
        })
    });
    
    return rss;
}(rss || {}));