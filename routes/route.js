//视图文件
//views folder下面的文件为视图文件，用于渲染。
//视图文件可以由一些组件拼凑而成，也可以将这个视图文件渲染在某个布局文件里的{{{body}}}处

//layout 布局文件
//layouts文件夹下放置额外的布局文件，使用的时候用 {layout :'layouts/testlayout'},
//如果不写layout，则默认使用views文件下的 layout.html为布局文件。这是主布局文件

//partial 公用组件
//partials文件夹下为公用的一些组件，首先需要注册路径，hbs.registerPartials(__dirname + '/views/partials');
//使用组件的时候：在模板文件中，{{> filename}} 

//'{{}}' 会将内容做HTML编码转换，这里你输入的HTML标签代码什么的都会按你输入的字符输出；{{{}}}则不做转换，你在里面输入<h1>就可以得到一个h1标签

var crypto = require('crypto');                                     //crypto 是 Node.js 的一个核心模块，我们用它生成散列值来加密密码。
var User = require('../models/user');
var Blog = require('../models/blog');
var Comment = require('../models/comment');
var multer = require('multer');
var upload = multer({dest: './upload'});

module.exports = function(app){

	function checkLogin(req, res, next){                            //checkLogin 和 checkNotLogin 方法是为了控制用户页面访问权限，没有登录的用户只能访问登录前的网页。如，发表页不应该被访问。
		if(!req.session.user){
			req.flash('error', '未登录！');
			res.redirect('/login');
		}
		next();
	}
	function checkNotLogin(req, res, next){
		if(req.session.user){
			req.flash('error', req.session.user.username + '已登录！');
			res.redirect('back');
		}
		next();
	}

	//home页的路由控制
	app.get('/', function (req, res) {
		Blog.getAll(null, function(err, blogs){
			if(err){
				blogs = [];
			}
			res.render('home', { 
				title: '主页',
				blogs: blogs,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString() 
			});
		});
	});

	//注册页的路由控制
	app.get('/register', checkNotLogin);
	app.get('/register', function (req, res) {
	    res.render('register', {
	    	title :'注册',
	    	user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString() 
	    });
	});
	app.post('/register', checkNotLogin);
	app.post('/register', function(req, res){
		var password = req.body.password;                           //req.body 就是 POST 请求信息解析过后的对象
		var password_re = req.body.password_re;

		//判断两次密码是否一致
		if(password !== password_re){
			req.flash('error', '两次输入的密码不一致！');
			return res.redirect('/register');                       //返回注册页
		}

		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');

		var newUser = new User({
			username: req.body.username,
			password: password,
			email: req.body.email
		});

		//检查用户名是否已经存在
		User.get(newUser.username, function(err, user){
			if(err){
				req.flash('error', err);
				return res.redirect('/');                            //如果出现错误，重定向到home页
			}
			if(user){
				req.flash('error', user.username + '用户已经存在！');
				return res.redirect('/register');
			}

			//如果不存在则新增用户
			newUser.save(function(err){
				if (err) {
			        req.flash('error', err);
			        return res.redirect('/register');                 //注册失败返回主册页
			    }
			    req.session.user = newUser;
			    req.flash('success', '注册成功');
			    res.redirect('/');
			});
		});
	});

	app.get('/login', checkNotLogin);                                 //没有登录的时候才可以继续下一步，进入login页面
	app.get('/login', function (req, res) {
	    res.render('login', { 
	    	title:'登录',
	    	user: req.session.user,
	    	success: req.flash('success').toString(),
	    	error: req.flash('error').toString()
		});
	});
	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res){
		var md5 = crypto.createHash('md5');
		var password = md5.update(req.body.password).digest('hex');
		User.get(req.body.username, function(err, user){
			if(!user){
				req.flash('error', req.body.username+'用户不存在');
				return res.redirect('/login');
			}
			if(user.password !== password){
				req.flash('error', '密码错误');
				return res.redirect('/login');
			}
			req.session.user = user;
			req.flash('success', user.username+'登录成功！');
			res.redirect('/');
		});
	});

	//发表页的路由控制
	app.get('/publish', checkLogin);
	app.get('/publish', function (req, res) {
	    res.render('publish', { 
	    	title :'发表',
	    	user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/publish', checkLogin);
	app.post('/publish', function(req, res){
		var currentUser = req.session.user;
		var blog = new Blog(currentUser.username, req.body.category, req.body.title, req.body.content);
		blog.save(function(err, blog){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			req.flash('success', '发布成功!');
			res.redirect('/');
		});
	});

	//退出的路由控制
	app.get('/logout', checkLogin);
	app.get('/logout', function (req, res) {
		req.session.user = null;
		req.flash('success', '退出成功!');
		res.redirect('/');
	});

	//文件上传的路由控制
	app.get('/upload', checkLogin);
	app.get('/upload', function (req, res) {
		res.render('upload', { 
	    	title :'上传',
	    	user: req.session.user,
			success: req.flash('success').toString(),
			error: req.flash('error').toString()
		});
	});
	app.post('/upload', checkLogin);
	app.post('/upload', upload.fields([
	    {name: 'file1'},
	    {name: 'file2'},
	    {name: 'file3'},
	    {name: 'file4'},
	    {name: 'file5'}
	]), function(req, res, next){
	    for(var i in req.files){
	        console.log(req.files[i]);
	    }
	    req.flash('success', '文件上传成功!');
	    res.redirect('/upload');
	});

	//用户文章列表界面
	app.get('/u/:author', function(req, res){
		//检查用户名是否已经存在
		User.get(req.params.author, function(err, user){
			if(err){
				req.flash('error', err);
				return res.redirect('/');                            //如果出现错误，重定向到home页
			}
			if(!user){
				req.flash('error', req.params.author + '用户不存在！');
				return res.redirect('/');
			}
			//如果存在则返回该用户的所有的文章
			Blog.getAll(req.params.author, function(err, blogs){
				if (err) {
			        req.flash('error', err); 
			        return res.redirect('/');
			    } 
				res.render('user', { 
					title: user.username,
					blogs: blogs,
					user: req.session.user,
					success: req.flash('success').toString(),
					error: req.flash('error').toString() 
				});
			});
		});
	});

	//文章界面
	app.get('/u/:author/:category/:title', function(req, res){
		Blog.getOne(req.params.author, req.params.category, req.params.title, function(err, blog){
			if (err) {
		        req.flash('error', err); 
		        return res.redirect('/');
		    } 
			res.render('article', { 
				title: req.params.title,
				blog: blog,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString(),
				isSameOne: req.session.user &&  req.session.user.username === blog.author
			});
		});
	});
	app.post('/u/:author/:category/:title', function(req, res){
		var date = new Date();
      	var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
		var comment = {
			name: req.body.name,
			email: req.body.email,
			website: req.body.website,
			content: req.body.content,
			time: time
		};

		var newComment = new Comment(req.params.author, req.params.category, req.params.title, comment);
		newComment.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('back');   
			}
			req.flash('success', '留言成功');
			res.redirect('back');   //留言成功后返回到该文章页。
		});
	});

	//文章修改界面
	app.get('/update/:author/:category/:title', checkLogin);
	app.get('/update/:author/:category/:title', function(req, res){
		Blog.getOne(req.params.author, req.params.category, req.params.title, function(err, blog){
			if (err) {
		        req.flash('error', err); 
		        return res.redirect('/');
		    } 
			res.render('update', { 
				title: req.params.title,
				blog: blog,
				user: req.session.user,
				success: req.flash('success').toString(),
				error: req.flash('error').toString() 
			});
		});
	});
	app.post('/update/:author/:category/:title', checkLogin);
	app.post('/update/:author/:category/:title', function(req, res){
		Blog.update(req.params.author, req.params.category, req.params.title, req.body.content, function(err){
			var updateUrl = encodeURI('/update/' + req.params.author + '/' + req.params.category + '/' + req.params.title);
			var articleUrl = encodeURI('/u/' + req.params.author + '/' + req.params.category + '/' + req.params.title);
			
			if (err) {
		        req.flash('error', err); 
		        return res.redirect(updateUrl);
		    } 
			req.flash('success', '修改成功!');
    		res.redirect(articleUrl);
		});
	});

	//文章删除
	app.get('/delete/:author/:category/:title', checkLogin);
	app.get('/delete/:author/:category/:title', function(req, res){
		Blog.delete(req.params.author, req.params.category, req.params.title, function(err){
			if (err) {
		        req.flash('error', err); 
		        return res.redirect('/');
		    } 
			req.flash('success', '删除成功!');
    		res.redirect('/');
		});
	});
};                              
