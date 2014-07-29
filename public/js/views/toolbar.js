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
            var val = this.$(evt.target).find('option:selected').val().toLowerCase()
              , itemView = app.views.itemsView;
            itemView.orderBy = val;
            localStorage.orderBy = val;
            itemView.loadFeed(itemView.collection.feedId);
            return false;
        },
        filter: function (evt) {
            var val = this.$(evt.target).find('option:selected').val().toLowerCase()
              , itemView = app.views.itemsView;
            itemView.filter = val;
            itemView.loadFeed(itemView.collection.feedId);
            return false;
        },
        events: {
            'change #order-by': 'orderBy'
          , 'click i.read-all': 'readAll'
          , 'change #filter': 'filter'
        }
    });
    
    return rss;
}(rss || {}));