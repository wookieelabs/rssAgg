var rss = (function (rss) {
    rss.EditFolder = Backbone.View.extend({
        el: '#modal',
        initialize: function () {
            this.TPLS = {
                form: rss.load('/tpls/editFolder.html')
            };
        },
        render: function () {
            this.$el.html(_.template(
                this.TPLS.form,
                this.model.toJSON()
            ));
        },
        show: function (id) {
            if (id) {
                this.model = app.account.folders.get(id);
            } else {
                this.model = new app.account.folders.model();
            }
            this.render();
            this.$el.modal();
        },
        hide: function () {
            this.$el.modal('hide');
            return false;
        },
        edit: function (evt) {
            this.model.save($(evt.target).serializeAsJSON(), {
                success: function () {
                    app.views.feedsView.updateFeedList();
                    this.hide();
                }.bind(this)
            });
            return false;
        },
        deleteFolder: function () {
            this.model.destroy({
                success: function () {
                    app.views.feedsView.updateFeedList();
                    this.hide();
                }.bind(this)
            });
            return false;
        },
        events: {
            'submit form#editFolder': 'edit',
            'click #delFolder': 'deleteFolder',
            'click .modal-footer > a': 'hide'
        }
    });
    
    return rss;
}(rss || {}));