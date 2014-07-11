/*jshint camelcase: false */

function $getParent(elem, tagName) {
    return elem.tagName.toLowerCase() == tagName.toLowerCase() ?
                $(elem) : $(elem).parents(tagName).first();
}

var rss = (function (rss) {
    rss.ItemsView = Backbone.View.extend({
        el: "#items",
        initialize: function () {
            var updateSize = function () {
                this.$el.find('#itemsList').css('max-height', $(window).height() - 125);
            }.bind(this);
    
            updateSize();
            $(window).resize(updateSize);

            this.$('#loader').hide();
            this.listenTo(this.collection, 'add', this.renderItem);
            this.itemsList = this.$('#itemsList');
            
            this.itemsList.on('scroll', this.scrollCheck.bind(this));
            
            this.TPLS = {
                item: rss.load('/tpls/item.html')
            };
            this.updating = false;
            this.order =  localStorage.orderBy || this.$el.find('#item-toolbar form#order-by select').val().toLowerCase();
        },
        scrollCheck: function () {
            if (this.collection.length < this.collection.size
                    && !this.updating
                    && this.itemsList.scrollTop() + this.itemsList.height() == this.itemsList.prop("scrollHeight")) {
                this.updating = true;
                this.$('#loader').show();
                
                this.collection.fetch({
                    remove: false,
                    silent: false,
                    data: {
                        order_by: this.order,
                        from: this.collection.length
                    },
                    success: function () {
                        this.updating = false;
                        this.$('#loader').hide();
                    }.bind(this),
                    error: function (collection, response) {
                        this.$('#loader').hide();
                        app.views.loginForm.renderError(response.responseJSON.error);
                        app.views.loginForm.show();
                        this.updating = true;
                    }.bind(this)
                });
            }
        },
        loadFeed: function (id) {
            this.updating = true;
            this.deselectItem();
            this.$el.scrollTop(0);
            this.collection.reset();
            this.$('#itemsList').empty();
            this.$('#loader').show();
            this.$('#itemError').hide();
            this.collection.feedId = id;
            this.collection.fetch({
                reset: true,
                silent: false,
                data: {
                    order_by: this.order,
                    from: 0
                },
                success: function () {
                    this.updating = false;
                    this.$('#loader').hide();
                    if (!this.collection.length) {
                        this.$('#itemError').show();
                        return;
                    }
                }.bind(this),
                error: function (collection, response) {
                    this.$('#loader').hide();
                    app.views.loginForm.renderError(response.responseJSON.error);
                    app.views.loginForm.show();
                    this.updating = true;
                }.bind(this)
            });
        },
        renderItem: function (item) {
            this.itemsList.append(_.template(
                this.TPLS.item,
                item.toJSON()
            ));
        },
        redrawItem: function (item) {
            var $el = this.$('li[data-id="' + item.id + '"]');
            if ($el.length) {
                $el.replaceWith(_.template(
                    this.TPLS.item,
                    item.toJSON()
                ));
            }
        },
        selectItem: function (evt) {
            if (this.sectedItem) {
                this.deselectItem();
            }
    
            var $el = $getParent(evt.target, 'li'),
                id = $el.data('id'),
                item = this.collection.get(id);
            this.sectedItem = item;
            this.sectedItem.oldAtt = this.sectedItem.attributes
    
            $el.addClass('selected');
            $el.find('.teaser').hide();
            $el.find('.description').show();
            $el.find('.head .title').html(
                '<a href="' + item.get('link') + '" target="_blank">' + item.get('title') + '</a>'
            );
    
            if (this.collection.get(id).attributes.unread == !null ||
                !(this.collection.get(id).attributes.unread === 0)) {
                this.collection.get(id).set('unread', 0);
            }

            var $read = $el.find('.item-menu li.unread');
            $read.find('span').text('Unread');
            $read.find('i')
                .removeClass('icon-eye-close')
                .addClass('icon-eye-open');
            return false;
        },
        deselectItem: function (fn) {
            if (!this.sectedItem) {
                return false;
            }
            var feedId = this.sectedItem.attributes.feed_id,
                unread;
                
            if (this.sectedItem.hasChanged() && !this.sectedItem.hasChanged().ott) {
                if (this.sectedItem.changedAttributes().unread === 0) {
                    unread = app.views.feedsView.collection.get(feedId).attributes.unread -= 1;
                    app.views.feedsView.$el.find('li[data-id =' + feedId + '] span').html(unread > 0 ? unread : '');
                } else if (this.sectedItem.changedAttributes().unread == 1) {
                    unread = app.views.feedsView.collection.get(feedId).attributes.unread += 1;
                    app.views.feedsView.$el.find('li[data-id =' + feedId + '] span').html(unread > 0 ? unread : '');
                }

                if (fn && (typeof fn) == 'function') {
                    this.sectedItem.save(null, {success: fn});
                } else {
                    this.sectedItem.save();
                }
            }
            this.redrawItem(this.sectedItem);
            delete this.sectedItem;
            return false;
        },
        toggleStar: function (evt) {
            var $li = $getParent(evt.target, 'li'),
                $text = $li.find('span'),
                $icon = $li.find('i'),
                $headIcon = $('.selected .head i'),
                model = this.collection.get($li.data('itemid'));
    
            if (model.get('stared')) {
                $headIcon.removeClass('icon-star').addClass('icon-star-empty');
                $icon.removeClass('icon-star').addClass('icon-star-empty');
                $text.text('Star');
                model.set('stared', 0);
            } else {
                $headIcon.removeClass('icon-star-empty').addClass('icon-star');
                $icon.removeClass('icon-star-empty').addClass('icon-star');
                $text.text('Unstar');
                model.set('stared', 1);
            }
        },
        toggleRead: function (evt) {
            var $li = $getParent(evt.target, 'li'),
                $text = $li.find('span'),
                $icon = $li.find('i'),
                model = this.collection.get($li.data('itemid'));
    
            if (model.get('unread')) {
                // set unread
                $icon.removeClass('icon-eye-close').addClass('icon-eye-open');
                $text.text('Unread');
                model.set('unread', 0);
                
            } else {
                // set read
                $icon.removeClass('icon-eye-open').addClass('icon-eye-close');
                $text.text('Read');
                model.set('unread', 1);
            }
        },
        clickLink: function (evt) {
            window.open(evt.target.href, '_blank');
            return false;
        },
        events: {
            'click #itemsList>li:not(.selected)': 'selectItem',
            'click #itemsList>li.selected .head': 'deselectItem',
            'click li.star': 'toggleStar',
            'click li.unread': 'toggleRead',
            'click #itemsList>li.selected a': 'clickLink'
            //'scroll #itemsList': 'scrollCheck'
        }
    });
    
    return rss;
}(rss || {}));
