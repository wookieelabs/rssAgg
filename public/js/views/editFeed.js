var rss = (function (rss) {
    rss.EditFeed = Backbone.View.extend({
        el: '#modal',
        initialize: function () {
            this.TPLS = {
                form: rss.load('/tpls/editFeed.html')
            };
        },
        render: function () {
            this.$el.html(_.template(
                this.TPLS.form,
                _.extend(this.model.toJSON(), {
                    folders: app.account.folders.toJSON()
                })
            ));
        },
        show: function (id) {
            if (id) {
                this.model = app.views.feedsView.collection.get(id);
            } else {
                this.model = new app.views.feedsView.collection.model();
            }
            this.render();
            this.$el.modal();
        },
        hide: function () {
            this.$el.modal('hide');
            return false;
        },
        save: function (evt) {
            this.model.save($(evt.target).serializeAsJSON(), {
                success: function () {
                    app.views.feedsView.updateFeedList();
                    this.hide();
                }.bind(this)
            });
            return false;
        },
        delFeed: function () {
            this.model.destroy({
                success: function () {
                    app.views.feedsView.updateFeedList();
                    this.hide();
                }.bind(this)
            });
            return false;
        },
        events: {
            'submit form#editFeed': 'save',
            'click #delFeed': 'delFeed',
            'click .modal-footer > a': 'hide'
        }
    });
    
    return rss;
}(rss || {}));