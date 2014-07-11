var rss = (function (rss) {
    rss.RegisterForm = Backbone.View.extend({
        el: '#register-form',
        register: function () {
            Backbone.ajax({
                url: '/register',
                type: 'POST',
                data: this.$('form').serialize()
            }).success(function (data) {
                app.account = new Backbone.Model(data);
                localStorage.uid = app.account.get('id');
                app.loadFeeds();
                app.views.loginForm.hide();
                app.views.registerForm.hide();
            }).error(function (data) {
                dataErr(app.views.registerForm, data.responseJSON.error);
            });
            return false;
        },
        hide: function () {
            this.$el.hide();
            app.views.loginForm.$el.find('.error').empty();
        },
        toggleForm: function () {
            this.$el.hide();
            app.views.loginForm.$el.show();
        },
        events: {
            'submit .form-register': 'register',
            'click li:not(.active)': 'toggleForm'
        }
    });
    
    return rss;
}(rss || {}));