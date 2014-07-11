_.templateSettings = {
    evaluate : /{%([\s\S]+?)%}/g,
    interpolate : /{%=([\s\S]+?)%}/g,
    escape : /{%-([\s\S]+?)%}/g
};

function $getParent(elem, tagName) {
    return elem.tagName.toLowerCase() == tagName.toLowerCase() ?
                $(elem) : $(elem).parents(tagName).first();
}

var Nav = Backbone.View.extend({
    el: '#nav',
    select: function (evt) {
        this.$el.find('li').removeClass('active');
        var $el = $getParent(evt.target, 'li').addClass('active');
        app[$el.data('role')].select();
    },
    events: {
        'click li': 'select'
    }
});

var AddUser = Backbone.View.extend({
    el: '#add',
    select: function () {
        this.$el.parent().find('> div').hide();
        this.$el.show();
    },
    add: function () {
        Backbone.ajax({
            url: '/register',
            type: 'POST',
            data: this.$('form').serialize()
        });
        return false;
    },
    events: {
        'submit form': 'add'
    }
});

var Delete = Backbone.View.extend({
    el: '#del',
    initialize: function () {
        this.TPL = $('#table').text();
        
        this.listenTo(this.collection, 'add', this.renderUsers);
    },
    select: function () {
        this.$el.parent().find('> div').hide();
        this.$el.show();
        this.collection.fetch();
    },
    renderUsers: function (model) {
        this.$el.find('table').append(_.template(
            this.TPL,
            model.toJSON()
        ));
    }
});

var RegToggle = Backbone.View.extend({
    el: '#regToggle',
    select: function () {
        this.$el.parent().find('> div').hide();
        this.$el.show();
    },
});

var Users = Backbone.Collection.extend({
    url: '/getUsers'
});

var app;

$(function () {
    app = {
        nav: new Nav(),
        add: new AddUser(),
        del: new Delete({
            collection: new Users()
        }),
        regToggle: new RegToggle()
    };
});