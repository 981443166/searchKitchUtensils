const db = require('../models/db');

// 分类列表
exports.list = (req, res) => {
  db.all('SELECT * FROM categories', (err, categories) => {
    if (err) {
      console.error('Error querying categories:', err);
      res.render('categories/list', { categories: [] });
    } else {
      res.render('categories/list', { categories });
    }
  });
};

// 分类详情
exports.show = (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
    if (err) {
      console.error('Error querying category:', err);
      res.render('categories/show', { category: null, items: [] });
    } else {
      db.all('SELECT * FROM items WHERE category_id = ?', [id], (err, items) => {
        if (err) {
          console.error('Error querying items:', err);
          res.render('categories/show', { category, items: [] });
        } else {
          res.render('categories/show', { category, items });
        }
      });
    }
  });
};

// 后台分类列表
exports.adminList = (req, res) => {
  db.all('SELECT * FROM categories', (err, categories) => {
    if (err) {
      console.error('Error querying categories:', err);
      res.render('admin/categories/list', { categories: [] });
    } else {
      res.render('admin/categories/list', { categories });
    }
  });
};

// 创建分类表单
exports.createForm = (req, res) => {
  res.render('admin/categories/create');
};

// 创建分类
exports.create = (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO categories (name) VALUES (?)', [name], (err) => {
    if (err) {
      console.error('Error creating category:', err);
      res.redirect('/admin/categories/create');
    } else {
      res.redirect('/admin/categories');
    }
  });
};

// 编辑分类表单
exports.editForm = (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
    if (err) {
      console.error('Error querying category:', err);
      res.redirect('/admin/categories');
    } else {
      res.render('admin/categories/edit', { category });
    }
  });
};

// 更新分类
exports.update = (req, res) => {
  const id = req.params.id;
  const { name } = req.body;
  db.run('UPDATE categories SET name = ? WHERE id = ?', [name, id], (err) => {
    if (err) {
      console.error('Error updating category:', err);
      res.redirect(`/admin/categories/${id}/edit`);
    } else {
      res.redirect('/admin/categories');
    }
  });
};

// 删除分类
exports.delete = (req, res) => {
  const id = req.params.id;
  // 先检查是否有物品属于该分类
  db.get('SELECT COUNT(*) as count FROM items WHERE category_id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error checking items:', err);
      res.redirect('/admin/categories');
    } else if (result.count > 0) {
      // 有物品属于该分类，不能删除
      res.redirect('/admin/categories');
    } else {
      // 可以删除分类
      db.run('DELETE FROM categories WHERE id = ?', [id], (err) => {
        if (err) {
          console.error('Error deleting category:', err);
        }
        res.redirect('/admin/categories');
      });
    }
  });
};