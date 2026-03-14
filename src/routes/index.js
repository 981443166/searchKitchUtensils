const express = require('express');
const router = express.Router();

// 中间件：处理 PUT 和 DELETE 请求（在multer处理后）
router.use((req, res, next) => {
  // 检查是否有_method字段（可能在body中或查询参数中）
  const method = req.body && req.body._method ? req.body._method : req.query._method;
  if (method) {
    req.method = method;
    if (req.body) delete req.body._method;
  }
  next();
});

// 导入控制器
const itemController = require('../controllers/itemController');
const categoryController = require('../controllers/categoryController');
const authController = require('../controllers/authController');

// 前台路由
router.get('/', itemController.index);
router.get('/items', itemController.list);
router.get('/items/:id', itemController.show);
router.get('/categories', categoryController.list);
router.get('/categories/:id', categoryController.show);
router.get('/search', itemController.search);

// 认证路由
router.get('/login', authController.loginForm);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// 后台路由
router.get('/admin', authController.isAuthenticated, (req, res) => {
  res.render('admin/dashboard');
});

// 密码修改路由
router.get('/admin/change-password', authController.isAuthenticated, authController.changePasswordForm);
router.post('/admin/change-password', authController.isAuthenticated, authController.changePassword);

// 物品管理路由
router.get('/admin/items', authController.isAuthenticated, itemController.adminList);
router.get('/admin/items/create', authController.isAuthenticated, itemController.createForm);
router.post('/admin/items', authController.isAuthenticated, itemController.upload, itemController.create);
router.get('/admin/items/:id/edit', authController.isAuthenticated, itemController.editForm);
// 同时支持PUT和POST请求处理编辑物品
router.put('/admin/items/:id', authController.isAuthenticated, itemController.upload, itemController.update);
router.post('/admin/items/:id', authController.isAuthenticated, itemController.upload, itemController.update);
router.delete('/admin/items/:id', authController.isAuthenticated, itemController.delete);

// 分类管理路由
router.get('/admin/categories', authController.isAuthenticated, categoryController.adminList);
router.get('/admin/categories/create', authController.isAuthenticated, categoryController.createForm);
router.post('/admin/categories', authController.isAuthenticated, categoryController.create);
router.get('/admin/categories/:id/edit', authController.isAuthenticated, categoryController.editForm);
router.put('/admin/categories/:id', authController.isAuthenticated, categoryController.update);
router.delete('/admin/categories/:id', authController.isAuthenticated, categoryController.delete);

module.exports = router;