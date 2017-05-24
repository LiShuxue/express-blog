var mongodb = require('../db/db');
var markdown = require('markdown').markdown;

function Blog(author, category, title, content){
	this.author = author;
	this.category = category;
	this.title = title;
	this.content = content;
}

module.exports = Blog;

Blog.prototype.save = function(callback){
	var date = new Date();
	var time = {
		date: date,
		year: date.getFullYear(),
		month: date.getFullYear() + "-" + (date.getMonth() + 1),
		day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
		minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
	};

	var blog = {
		author: this.author,
		category: this.category,
		title: this.title,
		content: this.content,
		comments: [],
		time: time
	};

	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		db.collection('blogs', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			collection.insert(blog, {safe:true}, function(err, blog){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

Blog.getAll = function(author, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		db.collection('blogs', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			var query = {};
			if(author){
				query.author = author;
			}

			collection.find(query).sort({time: -1}).toArray(function(err, blogs){      //按时间（`time`）排序。1是升序，也是默认的。-1是降序
				mongodb.close();
				if(err){
					return callback(err);
				}
				blogs.forEach(function(blog) {
					blog.htmlContent = markdown.toHTML(blog.content);
				});
				callback(null, blogs);
			});

		});
	});
}

Blog.getOne = function(author, category, title, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		db.collection('blogs', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			collection.findOne({
				"author": author,
				"category": category,
				"title": title
			}, function(err, blog){
				mongodb.close();
				if(err){
					return callback(err);
				}
				blog.htmlContent = markdown.toHTML(blog.content);
				callback(null, blog);
			});
		});
	});
}

Blog.update = function(author, category, title, content, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		db.collection('blogs', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			collection.update({
				"author": author,
				"category": category,
				"title": title
			}, {
				$set:{"content": content}
			}, function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
}

Blog.delete = function(author, category, title, callback){
	mongodb.open(function(err, db){
		if(err){
			return callback(err);
		}

		db.collection('blogs', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			collection.remove({
				"author": author,
				"category": category,
				"title": title
			}, {w: 1}, function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		});
	});
}