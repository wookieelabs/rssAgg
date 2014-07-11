var rss = (function (rss) {
    rss.Account = Backbone.Model.extend({
        initialize: function () {
            this.on('change:ott', function (model, value) {
                localStorage.ott = value;
            });
        },
        folders: new rss.Folders(),
        defaults: {
            id: 0,
            ott: null,
            username: null
        }
    });
    
    return rss;
}(rss || {}));