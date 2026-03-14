const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 登录页面
exports.loginForm = (req, res) => {
  res.render('login');
};

// 登录处理
exports.login = (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('login', { error: '请输入用户名和密码' });
    }

    // 查询管理员
    db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
      if (err) {
        console.error('Error querying admin:', err);
        return res.render('login', { error: '登录失败，请重试' });
      }
      
      if (!admin) {
        return res.render('login', { error: '用户名或密码错误' });
      }

      // 验证密码
      const isPasswordValid = bcrypt.compareSync(password, admin.password);
      if (!isPasswordValid) {
        return res.render('login', { error: '用户名或密码错误' });
      }

      // 生成 JWT token
      const token = jwt.sign({ id: admin.id, username: admin.username }, 'secret_key', { expiresIn: '1h' });

      // 设置 cookie
      res.cookie('token', token, { httpOnly: true });
      res.redirect('/admin');
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.render('login', { error: '登录失败，请重试' });
  }
};

// 注销
exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
};

// 认证中间件
exports.isAuthenticated = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, 'secret_key');
    req.user = decoded;
    // 设置is_admin变量，用于模板中判断
    res.locals.is_admin = true;
    next();
  } catch (err) {
    res.clearCookie('token');
    res.redirect('/login');
  }
};