const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const exphbs = require('express-handlebars');
const path = require('path');

const app = express();

// 配置 body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 配置 cookie-parser
app.use(cookieParser());

// 配置静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

// 配置模板引擎
app.engine('handlebars', exphbs.engine({
  defaultLayout: 'main',
  helpers: {
    eq: function(a, b) {
      return a === b;
    }
  }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// 导入路由
const routes = require('./src/routes');
app.use('/', routes);

// 404 处理
app.use((req, res, next) => {
  res.status(404).render('404', { user: req.user });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  console.error('Error stack:', err.stack);
  res.status(500).render('500', { user: req.user });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 全局错误处理
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error('Error stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 服务器错误处理
server.on('error', (err) => {
  console.error('Server error:', err);
  console.error('Error stack:', err.stack);
});

module.exports = app;