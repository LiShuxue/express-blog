var mongodb = require('../db/db');

//留言对象是针对于特定的某篇文章的, 所以前三个是文章的特性，后一个comment对象才是留言
function Comment(author, title, day, comment){
    this.author = author;
    this.day = day;
    this.title = title;
    this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function(callback){
    var author = this.author;
    var day = this.day;
    var title = this.title;
    var comment = this.comment;
    
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
				"time.day": day,
				"title": title
            }, {
			    $push:{"comments": comment}
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