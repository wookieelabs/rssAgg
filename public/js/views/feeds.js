/*jshint camelcase: false */

function $getParent(elem, tagName) {
    return elem.tagName.toLowerCase() == tagName.toLowerCase() ?
                $(elem) : $(elem).parents(tagName).first();
}

var rss = (function (rss) {
    rss.FeedsView = Backbone.View.extend({
        el: "#feeds",

        initialize: function () {
            this.feedsList = this.$('#feedsList');
            this.TPLS = {
                feedList: rss.load('/tpls/feedList.html'),
                feed: rss.load('/tpls/feed.html'),
                feedFolder: rss.load('/tpls/feedFolder.html')
            };
            this.on('item-change:unread', function (unread, feed_id) {
                var mdl = this.collection.get(feed_id),
                    cnt = mdl.get('unread');

                mdl.set('unread', unread ? cnt + 1 : cnt - 1);
            });
            this.listenTo(this.collection, 'change:unread', this.redrawBadge);
        },
        initializePositioning: function () {
            this.$el.find('ul.nav').sortable({
                items: '> li:not(li.not-sortable)',
                connectWith: '#feedsList,  #feedsList li.folder ul.nav',
                axis: 'y',
                update: this.savePosition,
                placeholder: "ui-placeholder"
            });
        },
        savePosition : function (evt, ui) {
            if (ui.item.hasClass('folder') && $(ui.item).parents('li.folder').length) {
                $("#feedsList").sortable("cancel");
                return;
            }

            if (!ui.sender) {
                var $el = ui ? $(ui.item).parent() : app.views.feedsView.$el.find('#feedsList'),
                    result = [];
                $el.children(':not(.not-sortable)').each(function (idx, el) {
                    var $el = $(el);
                    result.push({
                        position : ++idx,
                        id       : $el.data('id') || $el.data('folderid'),
                        type     : $el.hasClass('feed') ? 'feed' : 'folder',
                        folder_id: $el.parents('li.folder').data('folderid') ? $el.parents('li.folder').data('folderid') : null
                    });
                });
                Backbone.ajax({
                    url: '/savePosition' + '?uid=' + app.account.get('id') + '&ott=' + app.account.get('ott'),
                    type: 'POST',
                    data: {pos: result}
                }).success(function (data) {
                    app.account.set('ott', data.ott);
                    localStorage.ott = data.ott;
                });
            }
            return;
        },
        updateFeedList: function () {
            var feedId =  this.$el.find('li.active').data('id');
            this.$el.find('#feedsList > li:not(li:first-child)').remove();
            app.account.folders.fetch({
                reset: true,
                silent: false,
                success: function () {
                    this.collection.fetch({
                        reset: true,
                        silent: false,
                        success: function (collection) {
                            collection.toRender.forEach(function (data) {
                                app.views.feedsView.renderItem(data);
                            });
                            this.$el.find('li[data-id="' + feedId + '"]').addClass('active');
                            this.initializePositioning();
                        }.bind(this)
                    });
                }.bind(this)
            });
        },
        renderItem: function (model) {
            this.feedsList.append(_.template(
                this.TPLS.feedList, {
                    model: model,
                    TPLS: this.TPLS
                })
            );
        },
        select: function (feedId) {
            this.$('#feedsList li')
                .removeClass('active')
                .filter('[data-id="' + feedId + '"]')
                    .addClass('active');
            app.navigate(feedId.toString());
            app.views.itemsView.loadFeed(feedId);
        },
        feedClick: function (evt) {
            if (app.views.itemsView.sectedItem && app.views.itemsView.sectedItem.hasChanged()) {
                app.views.itemsView.deselectItem(function () {
                    app.views.feedsView.select($getParent(evt.target, 'li').data('id'));
                });
            } else {
                this.select($getParent(evt.target, 'li').data('id'));
            }
            return false;
        },
        folderClick: function (evt) {
            var folder = $getParent(evt.target, 'li'),
                folderIcon = folder.find('> i.icon-folder-open, > i.icon-folder-close');
            if (folder.data('state') == 'open') {
                folderIcon
                    .removeClass('icon-folder-open')
                    .addClass('icon-folder-close');
                folder.find('> ul').slideUp();
                folder.data('state', 'close');
                return false;
            }
            folderIcon
                .removeClass('icon-folder-close')
                .addClass('icon-folder-open');
            folder.find('> ul').slideDown();
            folder.data('state', 'open');
            return false;
        },
        addFeed: function () {
            app.views.editFeed.show(0);
            return false;
        },
        editFeed: function (evt) {
            app.views.editFeed.show($getParent(evt.target, 'li').data('id'));
            return false;
        },
        createFolder: function () {
            app.views.editFolder.show(0);
            return false;
        },
        editFolder: function (evt) {
            app.views.editFolder.show($getParent(evt.target, 'li').data('folderid'));
            return false;
        },
        redrawBadge: function (model, value) {
            var id = model.get('feed_id');
            this.$el.find('li[data-id=' + id + '] > span.badge').html(value ? value: ''); 
        },
        events: {
            'click #feedsList li:not(.folder, ul.iconHolder li)': 'feedClick',
            'click #feedsList .edit-feed': 'editFeed',
            'click li.folder > span, li.folder > i.icon-folder-close, li.folder > i.icon-folder-open': 'folderClick',
            'click .iconHolder > li[data-role="addFeed"]': 'addFeed',
            'click .iconHolder > li[data-role="createFolder"]': 'createFolder',
            'click li.folder > i.icon-cog': 'editFolder',
        }
    });

    return rss;
}(rss || {}));
