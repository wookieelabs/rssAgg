var rss = (function (rss) {
    rss.Folders = Backbone.Collection.extend({
        url: '/folders',
        model: Backbone.Model.extend({
            defaults: {
                id: 0,
                name: ''
            },
            url: function () {
                return '/folders/' + this.id;
            }
        }),
    });

    return rss;
}(rss || {}));