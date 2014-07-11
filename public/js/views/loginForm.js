var rss = (function (rss) {
    rss.LoginForm = Backbone.View.extend({
        el: '#login-form',
        login: function (evt) {
            Backbone.ajax({
                url: '/auth',
                data: $(evt.target).serialize(),
            }).success(function (data) {
                app.account.set(data);
                localStorage.uid = data.id;
                app.reset();
                app.start();
            }.bind(this));
            return false;
        },
        show: function () {
            this.$el.show();
        },
        renderError: function (err) {
            this.$('div.text-error').html(err);
        },
        hide: function () {
            this.$el.hide();
            app.views.loginForm.$el.find('.error').empty();
        },
        toggleForm: function () {
            this.$el.hide();
            app.views.registerForm.$el.show();
        },
        events: {
            'submit form': 'login',
            'click li:not(.active)': 'toggleForm'
        }
    });
    
    return rss;
}(rss || {}));