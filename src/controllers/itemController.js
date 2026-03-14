const db = require('../models/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 配置multer存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF、WEBP 格式的图片文件'));
  }
};

// 配置上传
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制5MB
  },
  fileFilter: fileFilter
});

// 导出upload中间件供路由使用
exports.upload = upload.single('image');

// 首页
exports.index = (req, res) => {
  db.all('SELECT items.*, categories.name as category_name FROM items LEFT JOIN categories ON items.category_id = categories.id WHERE items.is_deleted = 0 LIMIT 8', (err, items) => {
    if (err) {
      console.error('Error querying items:', err);
      res.render('index', { items: [] });
    } else {
      res.render('index', { items });
    }
  });
};

// 物品列表
exports.list = (req, res) => {
  const sort = req.query.sort || 'default';
  console.log('Received sort parameter:', sort);
  let orderBy = '';
  
  if (sort === 'price_asc') {
    orderBy = ' ORDER BY items.price ASC';
  } else if (sort === 'price_desc') {
    orderBy = ' ORDER BY items.price DESC';
  }
  
  const query = 'SELECT items.*, categories.name as category_name FROM items LEFT JOIN categories ON items.category_id = categories.id WHERE items.is_deleted = 0' + orderBy;
  console.log('Executing query:', query);
  
  db.all(query, (err, items) => {
    if (err) {
      console.error('Error querying items:', err);
      res.render('items/list', { items: [], sort });
    } else {
      console.log('Query executed successfully, found', items.length, 'items');
      res.render('items/list', { items, sort });
    }
  });
};

// 物品详情
exports.show = (req, res) => {
  const id = req.params.id;
  db.get('SELECT items.*, categories.name as category_name FROM items LEFT JOIN categories ON items.category_id = categories.id WHERE items.id = ? AND items.is_deleted = 0', [id], (err, item) => {
    if (err) {
      console.error('Error querying item:', err);
      res.render('items/show', { item: null });
    } else {
      res.render('items/show', { item });
    }
  });
};

// 搜索物品
exports.search = (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.redirect('/items');
  }
  db.all('SELECT items.*, categories.name as category_name FROM items LEFT JOIN categories ON items.category_id = categories.id WHERE items.is_deleted = 0 AND (items.name LIKE ? OR items.description LIKE ?)', [`%${query}%`, `%${query}%`], (err, items) => {
    if (err) {
      console.error('Error searching items:', err);
      res.render('items/search', { items: [], query });
    } else {
      res.render('items/search', { items, query });
    }
  });
};

// 后台物品列表
exports.adminList = (req, res) => {
  const showDeleted = req.query.showDeleted === '1';
  const sort = req.query.sort || 'default';
  let query = 'SELECT items.*, categories.name as category_name FROM items LEFT JOIN categories ON items.category_id = categories.id';
  
  if (!showDeleted) {
    query += ' WHERE items.is_deleted = 0';
  }
  
  // 添加排序
  if (sort === 'price_asc') {
    query += ' ORDER BY items.price ASC';
  } else if (sort === 'price_desc') {
    query += ' ORDER BY items.price DESC';
  }
  
  db.all(query, (err, items) => {
    if (err) {
      console.error('Error querying items:', err);
      res.render('admin/items/list', { items: [], showDeleted, sort });
    } else {
      res.render('admin/items/list', { items, showDeleted, sort });
    }
  });
};

// 创建物品表单
exports.createForm = (req, res) => {
  db.all('SELECT * FROM categories', (err, categories) => {
    if (err) {
      console.error('Error querying categories:', err);
      res.render('admin/items/create', { categories: [] });
    } else {
      res.render('admin/items/create', { categories });
    }
  });
};

// 生成SKU编号
function generateSKU(itemId) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SKU${year}${month}${day}-${itemId.toString().padStart(4, '0')}-${random}`;
}

// 创建物品
exports.create = (req, res) => {
  const { name, description, specifications, price, category_id } = req.body;
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;
  const image_name = req.file ? req.file.originalname : null;
  const image_size = req.file ? req.file.size : null;
  
  db.run('INSERT INTO items (name, description, specifications, price, category_id, image_path, image_name, image_size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
    [name, description, specifications, price, category_id, image_path, image_name, image_size], function(err) {
    if (err) {
      console.error('Error creating item:', err);
      res.redirect('/admin/items/create');
    } else {
      // 获取新插入的物品ID并生成SKU
      const newItemId = this.lastID;
      const sku = generateSKU(newItemId);
      
      db.run('UPDATE items SET sku = ? WHERE id = ?', [sku, newItemId], (err) => {
        if (err) {
          console.error('Error updating SKU:', err);
        }
        res.redirect('/admin/items');
      });
    }
  });
};

// 编辑物品表单
exports.editForm = (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM items WHERE id = ?', [id], (err, item) => {
    if (err) {
      console.error('Error querying item:', err);
      res.redirect('/admin/items');
    } else {
      db.all('SELECT * FROM categories', (err, categories) => {
        if (err) {
          console.error('Error querying categories:', err);
          res.render('admin/items/edit', { item, categories: [] });
        } else {
          res.render('admin/items/edit', { item, categories });
        }
      });
    }
  });
};

// 更新物品
exports.update = (req, res) => {
  const id = req.params.id;
  // 确保body被正确解析
  const body = req.body || {};
  const { name, description, specifications, price, category_id } = body;
  
  // 如果上传了新图片
  if (req.file) {
    // 获取旧图片路径并删除
    db.get('SELECT image_path FROM items WHERE id = ?', [id], (err, item) => {
      if (err) {
        console.error('Error querying item:', err);
      } else if (item && item.image_path) {
        const oldImagePath = path.join(__dirname, '../../public', item.image_path);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    });
    
    const image_path = `/uploads/${req.file.filename}`;
    const image_name = req.file.originalname;
    const image_size = req.file.size;
    
    db.run('UPDATE items SET name = ?, description = ?, specifications = ?, price = ?, category_id = ?, image_path = ?, image_name = ?, image_size = ? WHERE id = ?', 
      [name, description, specifications, price, category_id, image_path, image_name, image_size, id], (err) => {
      if (err) {
        console.error('Error updating item:', err);
        res.redirect(`/admin/items/${id}/edit`);
      } else {
        res.redirect('/admin/items');
      }
    });
  } else {
    // 没有上传新图片，只更新其他字段
    db.run('UPDATE items SET name = ?, description = ?, specifications = ?, price = ?, category_id = ? WHERE id = ?', 
      [name, description, specifications, price, category_id, id], (err) => {
      if (err) {
        console.error('Error updating item:', err);
        res.redirect(`/admin/items/${id}/edit`);
      } else {
        res.redirect('/admin/items');
      }
    });
  }
};

// 删除物品（软删除）
exports.delete = (req, res) => {
  const id = req.params.id;
  
  // 软删除：标记为已删除，而不是真正删除
  db.run('UPDATE items SET is_deleted = 1 WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error soft deleting item:', err);
    }
    res.redirect('/admin/items');
  });
};

// 彻底删除物品（硬删除）
exports.hardDelete = (req, res) => {
  const id = req.params.id;
  
  // 获取图片路径并删除图片文件
  db.get('SELECT image_path FROM items WHERE id = ?', [id], (err, item) => {
    if (err) {
      console.error('Error querying item:', err);
    } else if (item && item.image_path) {
      const imagePath = path.join(__dirname, '../../public', item.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
  });
  
  db.run('DELETE FROM items WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting item:', err);
    }
    res.redirect('/admin/items');
  });
};