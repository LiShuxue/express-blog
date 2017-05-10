//非关系型数据库的概念
//文档：mongodb中数据的基本单元，代表一个对象，相当于表中的一行。
//集合：collection，相当于一个表
//数据库：多个集合构成数据库

var mongodb = require('../db/db');

function User(user) {
    this.username = user.username;
    this.password = user.password;
    this.email = user.email;
};

module.exports = User;

//存储用户信息
User.prototype.save = function(callback) {

    var user = {
        username: this.username,
        password: this.password,
        email: this.email
    }

    mongodb.open(function(err, db){
        if(err){                                                   //错误，返回err信息
            return callback(err);
        }

        db.collection('users', function(err, collection){          //选择 users 集合 
            if(err){                                               //错误，返回err信息
                mongodb.close();
                return  callback(err);
            }

            //第一个参数：必需，指插入的内容，文档数据，是一个JSON对象
            //第二个参数：配置参数，这里的safe表示，当属性值为true时，使用getLastError命令执行数据的存取操作，该命令返回插入操作的执行结果，默认值为false
            //第三个参数：回调函数，该回调函数有两个参数，第一个是操作失败时抛出的错误对象，第二个参数是一个JSON对象，表示插入的数据文档，当操作失败时，该参数值为null
            collection.insert(user, {safe: true}, function(err, user){
                mongodb.close();
                if(err){                                          //错误，返回err信息
                    return callback(err);
                }
                callback(null);                             //成功，返回存储后的文档
            });                       
        });
    });
};

//读取用户信息
User.get = function(username, callback){
    mongodb.open(function(err, db){
        if(err){                                                  //错误，返回err信息
            return callback(err);
        }

        db.collection('users', function(err, collection){         //选择 users 集合 
            if(err){                                              //错误，返回err信息
                mongodb.close();
                return  callback(err);
            }

            collection.findOne({username: username}, function(err, user){  //根据name查询
                mongodb.close();
                if(err){                                          //错误，返回err信息
                    return callback(err);
                }
                callback(null, user);                             //成功，返回查到的文档
            })                     
        });
    });
};