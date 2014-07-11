var Iconv = require('iconv').Iconv
  , moment = require('moment')
  , http = require('http');

function toUTF8(xml) {
	var enc = xml.slice(0, 100).toString('utf-8')
		.match(/<\?xml.*encoding="(.*)".*\?>/i);

	if (!enc) {
		return xml.toString('utf8');
	}

	return (new Iconv(enc[1], 'UTF-8'))
		.convert(xml).toString('utf8');
}

function request(feedUrl, fn) {
	http.get(feedUrl, function (response) {
		var xml = new Buffer('', 'binary');
		response.on('data', function (chunk) {
			xml = Buffer.concat([xml, new Buffer(chunk, 'binary')]);
		});
		response.on('end', function () {
			require('xml2js').parseString(toUTF8(xml), {
				trim: true,
				normalizeTags: true,
				normalize: true
			}, function (err, result) {
                if (err) { return fn(err); }

                if (result.rss) {
                    return fn(null, new RSSFeed(result));
                } else if (result.feed) {
                    return fn(null, new AtomFeed(result));
                }
                
                return fn('Invalid feed format. Suported formats are RSS or Atom.');
			});
		});
	}).on('error', function(err) {
		console.log("Got error: " + err.message);
	});
}

exports.parse = request;

function AbstractFeed(doc) {
	this.doc = doc;
	this.map = {};
}

AbstractFeed.prototype = {
	constructor: AbstractFeed,
	nodeText: function (node) {
		return node._ ? node._ : node;
	},
	nodeLink: function (link) {
		return link.$ ? link.$.href : link;
	},
	_get: function (root, name) {
		return root[this.map[name]] ? this.nodeText(root[this.map[name]][0]) : '';
	},
	getItem: function (idx) {
		if (this.doc[this.map.items][idx]) {
			return new this.ItemCls(this.doc[this.map.items][idx]);
		}
		return null;
	}
};

Object.defineProperties(AbstractFeed.prototype, {
	title: {
		get: function () {
			return this._get(this.doc, 'title');
		}
	},
	description: {
		get: function () {
			return this._get(this.doc, 'description');
		}
	},
	length: {
		get: function () {
			return this.doc[this.map.items].length;
		}
	}
});

function RSSFeed() {
	AbstractFeed.apply(this, arguments);
	this.doc = this.doc.rss.channel[0];
	this.map = {
		title: 'title',
		description: 'description',
		items: 'item'
	};
	this.ItemCls = RSSItem;
}

RSSFeed.prototype = Object.create(AbstractFeed.prototype);

function AtomFeed() {
	AbstractFeed.apply(this, arguments);
	this.doc = this.doc.feed;
	this.map = {
		title: 'title',
		description: 'subtitle',
		items: 'entry'
	};
	this.ItemCls = AtomItem;
}
AtomFeed.prototype = Object.create(AbstractFeed.prototype);


function AbstractItem(doc) {
	this.doc = doc;
	this.map = {
		title: 'title',
		link: 'link',
		description: 'description',
		author: 'author',
		pubDate: 'pubdate'
	};
}

AbstractItem.prototype = {
	constructor: AbstractItem,
	nodeText: function (node) {
		return node._ ? node._ : node;
	},
	nodeLink: function (link) {
		return link.$ ? link.$.href : link;
	},
	_get: function (root, name) {
		return root[this.map[name]] ?
			this.nodeText(this.nodeLink(root[this.map[name]][0])) : '';
	},
	toJSON: function () {
		return Object.keys(this.map).reduce(function (json, key) {
			json[key] = this[key];
			return json;
		}.bind(this), {});
	}
};

Object.defineProperties(AbstractItem.prototype, {
	title: {
		get: function () {
			return this._get(this.doc, 'title');
		}
	},
	link: {
		get: function () {
			return this._get(this.doc, 'link');
		}
	},
	description: {
		get: function () {
			return this._get(this.doc, 'description');
		}
	},
	author: {
		get: function () {
			return this._get(this.doc, 'author');
		}
	},
	pubDate: {
		get: function () {
			return moment(this._get(this.doc, 'pubDate')).format('YYYY-MM-DD HH:mm:ss');
		}
	}
});

function RSSItem() {
	AbstractItem.apply(this, arguments);
}
RSSItem.prototype = Object.create(AbstractItem.prototype);

function AtomItem() {
	AbstractItem.apply(this, arguments);
	this.map = {
		title: 'title',
		link: 'link',
		description: 'summary',
		author: 'author',
		pubDate: 'updated'
	};
}
AtomItem.prototype = Object.create(AbstractItem.prototype);

Object.defineProperties(AtomItem.prototype, {
	description: {
		get: function () {
			return this.doc.summary ? this.nodeText(this.doc.summary[0]) : this.nodeText(this.doc.content[0]);
		}
	},
	author: {
		get: function () {
			return this.doc.author ? this.nodeText(this.doc.author[0].name ? this.doc.author[0].name[0] : this.doc.author[0]) : '';
		}
	},
});
