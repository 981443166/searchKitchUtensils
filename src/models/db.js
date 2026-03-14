const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, '../../database.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    // 初始化数据库表
    initDatabase();
  }
});

// 数据库迁移函数
function migrateDatabase() {
  // 检查items表是否有image_path字段
  db.all("PRAGMA table_info(items)", (err, columns) => {
    if (err) {
      console.error('Error checking table info:', err);
      return;
    }
    
    const hasImagePath = columns.some(col => col.name === 'image_path');
    const hasImageName = columns.some(col => col.name === 'image_name');
    const hasImageSize = columns.some(col => col.name === 'image_size');
    const hasSpecifications = columns.some(col => col.name === 'specifications');
    const hasSku = columns.some(col => col.name === 'sku');
    const hasIsDeleted = columns.some(col => col.name === 'is_deleted');
    
    if (!hasImagePath) {
      db.run('ALTER TABLE items ADD COLUMN image_path TEXT', (err) => {
        if (err) {
          console.error('Error adding image_path column:', err);
        } else {
          console.log('Added image_path column to items table');
        }
      });
    }
    
    if (!hasImageName) {
      db.run('ALTER TABLE items ADD COLUMN image_name TEXT', (err) => {
        if (err) {
          console.error('Error adding image_name column:', err);
        } else {
          console.log('Added image_name column to items table');
        }
      });
    }
    
    if (!hasImageSize) {
      db.run('ALTER TABLE items ADD COLUMN image_size INTEGER', (err) => {
        if (err) {
          console.error('Error adding image_size column:', err);
        } else {
          console.log('Added image_size column to items table');
        }
      });
    }
    
    // 添加规格参数字段
    if (!hasSpecifications) {
      db.run('ALTER TABLE items ADD COLUMN specifications TEXT', (err) => {
        if (err) {
          console.error('Error adding specifications column:', err);
        } else {
          console.log('Added specifications column to items table');
        }
      });
    }
    
    // 添加SKU字段（产品编号）
    if (!hasSku) {
      db.run('ALTER TABLE items ADD COLUMN sku TEXT', (err) => {
        if (err) {
          console.error('Error adding sku column:', err);
        } else {
          console.log('Added sku column to items table');
          // 为现有数据生成SKU
          generateSkuForExistingItems();
        }
      });
    }
    
    // 添加软删除标记字段
    if (!hasIsDeleted) {
      db.run('ALTER TABLE items ADD COLUMN is_deleted INTEGER DEFAULT 0', (err) => {
        if (err) {
          console.error('Error adding is_deleted column:', err);
        } else {
          console.log('Added is_deleted column to items table');
        }
      });
    }
  });
}

// 为现有物品生成SKU
function generateSkuForExistingItems() {
  db.all('SELECT id, name FROM items WHERE sku IS NULL', (err, items) => {
    if (err) {
      console.error('Error querying items without SKU:', err);
      return;
    }
    items.forEach(item => {
      const sku = generateSKU(item.id);
      db.run('UPDATE items SET sku = ? WHERE id = ?', [sku, item.id], (err) => {
        if (err) {
          console.error('Error updating SKU for item:', item.id, err);
        }
      });
    });
  });
}

// 生成SKU编号
function generateSKU(itemId) {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SKU${year}${month}${itemId.toString().padStart(4, '0')}${random}`;
}

// 初始化数据库表
function initDatabase() {
  // 创建分类表
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating categories table:', err);
    } else {
      // 创建物品表
      db.run(`
        CREATE TABLE IF NOT EXISTS items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sku TEXT UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          specifications TEXT,
          price REAL,
          category_id INTEGER,
          image_path TEXT,
          image_name TEXT,
          image_size INTEGER,
          is_deleted INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id)
        )
      `, (err) => {
        if (err) {
          console.error('Error creating items table:', err);
        } else {
          // 为已存在的表添加图片字段（数据库迁移）
          migrateDatabase();
          
          // 创建管理员表
          db.run(`
            CREATE TABLE IF NOT EXISTS admins (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL UNIQUE,
              password TEXT NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('Error creating admins table:', err);
            } else {
              // 检查是否存在默认管理员
              db.get('SELECT * FROM admins WHERE username = ?', ['admin'], (err, row) => {
                if (err) {
                  console.error('Error checking admin:', err);
                } else if (!row) {
                  // 创建默认管理员，密码为 admin123
                  const bcrypt = require('bcryptjs');
                  const hashedPassword = bcrypt.hashSync('admin123', 10);
                  db.run('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword], (err) => {
                    if (err) {
                      console.error('Error creating default admin:', err);
                    } else {
                      console.log('Default admin created');
                    }
                  });
                }
              });
            }
          });

          // 插入一些示例分类数据
          db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
            if (err) {
              console.error('Error checking categories:', err);
            } else if (row.count === 0) {
              const categories = ['锅具', '刀具', '餐具', '厨房小工具', '烘焙工具'];
              categories.forEach(category => {
                db.run('INSERT INTO categories (name) VALUES (?)', [category], (err) => {
                  if (err) {
                    console.error('Error inserting category:', err);
                  }
                });
              });

              // 插入一些示例物品数据
              setTimeout(() => {
                const items = [
                  { name: '炒锅', description: '不粘锅，适合炒菜', price: 299, category_id: 1 },
                  { name: '煎锅', description: '平底煎锅，适合煎蛋', price: 199, category_id: 1 },
                  { name: '菜刀', description: '不锈钢菜刀，锋利耐用', price: 129, category_id: 2 },
                  { name: '水果刀', description: '小巧便携，适合切水果', price: 49, category_id: 2 },
                  { name: '饭碗', description: '陶瓷饭碗，美观实用', price: 29, category_id: 3 },
                  { name: '盘子', description: '陶瓷盘子，适合盛放菜肴', price: 39, category_id: 3 },
                  { name: '削皮器', description: '多功能削皮器，方便实用', price: 19, category_id: 4 },
                  { name: '打蛋器', description: '手动打蛋器，适合烘焙', price: 25, category_id: 5 }
                ];
                items.forEach(item => {
                  db.run('INSERT INTO items (name, description, price, category_id) VALUES (?, ?, ?, ?)', 
                    [item.name, item.description, item.price, item.category_id], (err) => {
                      if (err) {
                        console.error('Error inserting item:', err);
                      }
                    });
                });
              }, 500);
            }
          });
        }
      });
    }
  });
}

module.exports = db;
