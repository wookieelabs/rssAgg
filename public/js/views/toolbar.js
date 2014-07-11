var rss = (function (rss) {
    rss.ToolBar = Backbone.View.extend({
        el: '#item-toolbar',
        initialize: function () {
            this.order = this.$('option:selected').val().toLowerCase();
            
        },
        readAll: function () {
            Backbone.ajax({
                url: '/readAll?uid=' + app.account.get('id') + '&ott=' + app.account.get('ott'),
                type: 'POST',
                data: {
                    id: app.views.feedsView.$('.active').data('id')
                }
            }).success(function (data) {
                app.account.set('ott', data.ott);
                localStorage.ott = data.ott;
                app.reset();
                app.start();
            });
            return false;
        },
        orderBy: function (evt) {
            var val = this.$(evt.target).find('option:selected').val().toLowerCase();
            app.views.itemsView.order = val;
            localStorage.orderBy = val;
            app.views.itemsView.loadFeed(app.views.feedsView.$('.active').data('id'));
            return false;
        },
        events: {
            'change #order-by': 'orderBy',
            'click i.read-all': 'readAll'
        }
    });
    
    return rss;
}(rss || {}));