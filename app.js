
var express = require('express');                     //引用experss模块
var path = require('path');                           //引用path模块  path.join方法用于连接路径。path.resolve方法用于将相对路径转为绝对路径。
var favicon = require('serve-favicon');               //serve-favicon模块用来设置网站的图标
var logger = require('morgan');                       //使用morgan中间件记录日志。使用app.use(logger('dev'));可以将请求信息打印在控制台
var cookieParser = require('cookie-parser');          //如果要使用cookie，需要这个模块
var bodyParser = require('body-parser');              //bodyParser中间件用来解析http请求体。通常使用body-parser进行post参数的解析，最常用的是其中的json和urlencoded的parser，可分别对以JSON格式的post参数和urlencoeded的post参数进行解析，均可获得一个JSON化的req.body

var app = express();                                  //创建一个express实例

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));     //设置/public/favicon.ico为favicon图标
app.use(logger('dev'));                               //加载日志中间件。定义日志和输出级别 。将请求信息打印在控制台。
app.use(bodyParser.json());                           //加载解析json的中间件。
app.use(bodyParser.urlencoded({ extended: false }));  //加载解析urlencoded请求体的中间件。解析我们通常的form表单提交的数据，也就是请求头中包含这样的信息： Content-Type: application/x-www-form-urlencoded
app.use(cookieParser());                              //加载解析cookie的中间件。 这样就可以处理每一个请求的cookie。
app.use(express.static(path.join(__dirname, 'public')));              //设置public文件夹为存放静态文件的目录。


//设置模板引擎相关
var hbs = require('hbs');                             //加载hbs模块  
app.set('views', path.join(__dirname, 'views'));      //设置 views 文件夹为存放视图文件的目录, 即存放模板文件的地方, __dirname 为全局变量,存储当前正在执行的脚本所在的目录。
app.set('view engine', 'html');                       //指定模板文件的后缀名为 html
app.engine('html', hbs.__express);                    //指定用hbs的规则渲染html文件
hbs.registerPartials(__dirname + '/views/partials');  //注册模板组件路径，模板组件可用于其他的模板之中{{> xxx}}


//使用flash功能
//The flash is a special area of the session used for storing messages. 
//Messages are written to the flash and cleared after being displayed to the user. 
//The flash is typically used in combination with redirects, ensuring that the message is available to the next page that is to be rendered.
var flash = require('connect-flash');                 //flash 是 session 中一个用于存储信息的特殊区域。消息写入到 flash 中，在跳转目标页中显示该消息。flash 是配置 redirect 一同使用的，以确保消息在目标页面中可用。
app.use(flash());


//使用session，并将session保存在mongodb数据库中
//mongodb启动:  sudo mongod          mongo:使用命令行操作数据库
var settings = require('./db/settings');
var session = require('express-session');             //使用session模块
var MongoStore = require('connect-mongo')(session);   //将session存入数据库需要的模块
var dbUrl = 'mongodb://' + settings.host + '/' + settings.db     //拼接数据库url
app.use(session({
    secret: settings.cookieSecret,                      //secret:用于对sessionID的cookie进行签名
    key: settings.db,                                   //设置的cookie的名字。exblog=s%3A6OJEWyc.(不设置的话是 sessionID=s%3A6OJEWyc)
    cookie: {                                           //cookie里面全部的设置都是对于sessionID的属性的设置，默认的属性为{ path: '/', httpOnly: true, secure: false, maxAge: null }.
        maxAge: 1000 * 60 * 60 * 24 * 30                  //30天
    },
    resave: false,                                      //强制session保存到session store中。即使在请求中这个session没有被修改。
    saveUninitialized: true                            //强制没有“初始化”的session保存到storage中，没有初始化的session指的是：刚被创建没有被修改。
    // store: new MongoStore({                             //store:保存session的地方，默认是一个MemoryStore实例
    //     url: dbUrl
    // })
}));

//route功能
var routes = require('./routes/route');               //加载index文件作为路由器
routes(app);                                          //对app使用route


//app.use 加载用于处理http請求的middleware（中间件），当一个请求来的时候，会依次被这些 middlewares处理。执行的顺序是你定义的顺序
//Express框架中处理404页面一个方式,原理就是把404路由放在最后匹配,也就是路由中没有定义的全部转到404页面
app.use(function(req, res, next) {                    //捕获404错误，并转发到错误处理器
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {              //错误处理器
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');                               //渲染error模板
});



var debug = require('debug')('blog:server');             //引入debug模块，打印调试日志
var http = require('http');                              //引入http模块，这个模块用来创建http服务
var port = normalizePort(process.env.PORT || '3000');    //process.env.PORT代表启动node进程时携带的变量PORT。如果启动时指定了PORT，就用指定的PORT，否则用默认的。比如：PORT=8080 node app.js。
app.set('port', port);                                   //设置端口号

var server = http.createServer(app);                     //创建一个http server

server.listen(port);                                     //这个server监听3000端口（我们所设置的端口号）
server.on('error', onError);                             //发生错误时的事件
server.on('listening', onListening);                     //监听成功时的回调

function normalizePort(val) {                            //格式化端口号的方法，将输入的端口号格式化为数字，字符串或者false，防止出错
    var port = parseInt(val, 10);
    if (isNaN(port)) {
        // named pipe
        return val;                                      //非数字，直接返回
    }
    if (port >= 0) {
        // port number
        return port;
    }
    return false;
}

function onError(error) {                                //处理错误情况
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
           throw error;
    }
}

function onListening() {                                 //监听成功时的方法
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
