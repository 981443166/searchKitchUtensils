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

// 显示修改密码页面
exports.changePasswordForm = (req, res) => {
  res.render('admin/change-password');
};

// 处理修改密码请求
exports.changePassword = (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;

  // 验证输入
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.render('admin/change-password', { error: '请填写所有字段' });
  }

  // 验证新密码和确认密码是否一致
  if (newPassword !== confirmPassword) {
    return res.render('admin/change-password', { error: '新密码和确认密码不一致' });
  }

  // 验证新密码长度
  if (newPassword.length < 6) {
    return res.render('admin/change-password', { error: '新密码长度至少为6位' });
  }

  // 查询当前管理员信息
  db.get('SELECT * FROM admins WHERE id = ?', [userId], (err, admin) => {
    if (err) {
      console.error('Error querying admin:', err);
      return res.render('admin/change-password', { error: '修改密码失败，请重试' });
    }

    if (!admin) {
      return res.render('admin/change-password', { error: '管理员信息不存在' });
    }

    // 验证当前密码
    const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      return res.render('admin/change-password', { error: '当前密码错误' });
    }

    // 加密新密码
    const hashedNewPassword = bcrypt.hashSync(newPassword, 10);

    // 更新密码
    db.run('UPDATE admins SET password = ? WHERE id = ?', [hashedNewPassword, userId], (err) => {
      if (err) {
        console.error('Error updating password:', err);
        return res.render('admin/change-password', { error: '修改密码失败，请重试' });
      }

      // 密码修改成功
      res.render('admin/change-password', { success: '密码修改成功' });
    });
  });
};
