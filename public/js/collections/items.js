var rss = (function (rss) {
    rss.Items = Backbone.Collection.extend({
        feedId: 0,
        url: function () {
            return '/items/' + this.feedId;
        },
        parse: function (response) {
            this.size = response.len;
            return response.items;
        }
    });
    
    return rss;
}(rss || {}));