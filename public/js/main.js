/*jshint camelcase: false */

(function () {
    var oldSync = Backbone.sync;

    Backbone.sync = function (method, model, options) {


        options = options || {};
        if (!options.url) {
            options.url = _.result(model, 'url') || urlError();
        }

        options.url = options.url.indexOf('?') == -1 ?
            options.url + '?uid=' + app.account.get('id') :
            options.url + '&uid=' + app.account.get('id');
        options.url += '&ott=' + app.account.get('ott');

        var oldSuccess = options.success;
        options.success = function (resp) {
            if (resp.id) {
                localStorage.uid = resp.id;
            }
            app.account.set('ott', resp.ott);
            localStorage.ott = resp.ott;
            
            oldSuccess(resp.data ? resp.data : resp);
        };

        oldSync(method, model, options);
    };

    $.fn.serializeAsJSON = function () {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
}());

var rss = (function (rss) {
    var loaded = {};

    rss.load = function (path) {
        if (loaded[path]) {
            return loaded[path];
        }
        jQuery.ajax({
            url: path,
            async: false,
            global: false,
            dataType: 'text'
        }).done(function (data) {
            loaded[path] = data;
        });
        return loaded[path];
    };

    var required = {};
    rss.require = function (path) {
        if (required[path]) {
            return;
        }
        required[path] = true;
        jQuery.globalEval(rss.load(path));
    };
    rss.requireAll = function (files) {
        files = jQuery.isArray(files) ? files : [files];
        jQuery.each(files, function (idx, file) {
            rss.require(file);
        });
    };

    return rss;
}(rss || {}));

var app;

$(function () {
    rss.require('/js/router.js');

    moment.lang('ru');
    app = new rss.Router();
    app.run();

    $('#log-out').on('click', function () {
        localStorage.clear();
        location.href = location.origin;
    });
});
