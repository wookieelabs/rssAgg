var rss = (function (rss) {
    rss.Router = Backbone.Router.extend({
        routes: {
            "(:feedId)": "getFeed"
        },
        initialize: function () {
            rss.requireAll([
                '/js/collections/folders.js',
                '/js/collections/account.js',
                '/js/collections/feeds.js',
                '/js/views/feeds.js',
                '/js/collections/items.js',
                '/js/views/items.js',
                '/js/views/loginForm.js',
                '/js/views/registerForm.js',
                '/js/views/editFeed.js',
                '/js/views/editFolder.js',
                '/js/views/toolbar.js'
            ]);

            this.views = {
                feedsView: new rss.FeedsView({
                    collection: new rss.Feeds()
                }),
                itemsView: new rss.ItemsView({
                    collection: new rss.Items()
                }),
                loginForm: new rss.LoginForm(),
                registerForm: new rss.RegisterForm(),
                editFeed: new rss.EditFeed(),
                editFolder: new rss.EditFolder(),
                toolBar: new rss.ToolBar()
            };
            this.views.itemsView.on('item-change:unread', function (unread, feed_id) {
                this.views.feedsView.trigger('item-change:unread', unread, feed_id);
            }.bind(this));

            this.account = new rss.Account();
        },
        run: function () {
            if (localStorage.uid && localStorage.ott) {
                Backbone.ajax({
                    url: '/sessionCheck',
                    data: {
                        uid: localStorage.uid,
                        ott: localStorage.ott
                    }
                }).success(function (data) {
                    app.account.set(data);
                    app.start();
                }.bind(this));
            }
        },
        reset: function () {
            this.account.folders.reset();
            this.views.feedsView.$el.find('#feedsList > li:not(li:first-child)').remove();
            this.views.feedsView.collection.reset();
            this.views.itemsView.$el.find('#itemsList').empty();
            this.views.itemsView.collection.reset();
        },
        start: function () {
            if (!Backbone.History.started) {
                Backbone.history.start();
            } else {
                app.navigate(0, {
                    trigger: true,
                    replace: true
                });
            }
            this.views.loginForm.hide();
            $('#log-out').show();
        },
        getFeed: function (feedId) {
            app.views.itemsView.updating = true;
            feedId = feedId || 0;
            this.account.folders.fetch({
                reset: true,
                silent: false,
                success: function () {
                    this.views.feedsView.collection.fetch({
                        reset: true,
                        silent: false,
                        success: function (collection) {
                            collection.toRender.forEach(function (data) {
                                app.views.feedsView.renderItem(data);
                            });
                            app.views.feedsView.select(feedId);
                            app.views.feedsView.initializePositioning();
                        }
                    });
                }.bind(this)
            });
        }
    });
    
    return rss;
}(rss || {}));
