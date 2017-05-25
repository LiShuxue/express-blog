var mongodb = require('../db/db');
var markdown = require('markdown').markdown;

function Blog(author, title, content){
	this.author = author;
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

//每次获取十篇文章来进行分页
Blog.getTen = function(author, page, callback){
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

			collection.count(query, function(err, total){
				//根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
				collection.find(query,{
					skip: (page - 1)*10,
          			limit: 10
				}).sort({
					time: -1                      //按时间（`time`）排序。1是升序，也是默认的。-1是降序
				}).toArray(function(err, blogs){
					mongodb.close();
					if(err){
						return callback(err);
					}
					blogs.forEach(function(blog) {
						blog.htmlContent = markdown.toHTML(blog.content);
					});
					callback(null, blogs, total);
				});
			});
		});
	});
}

Blog.getOne = function(author, title, day, callback){
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
				"title": title,
				"time.day": day
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

Blog.update = function(author, title, day, content, callback){
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
				"title": title,
				"time.day": day
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

Blog.delete = function(author, title, day, callback){
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
				"title": title,
				"time.day": day
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