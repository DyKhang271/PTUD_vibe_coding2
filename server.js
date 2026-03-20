const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// 1. Dùng __dirname cho static public để đảm bảo đường dẫn luôn đúng
app.use(express.static(path.join(__dirname, 'public')));

// 1. AUTH
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT id, username, role FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Tài khoản hoặc mật khẩu không đúng' });
        res.json({ message: 'Đăng nhập thành công', user: row });
    });
});

// 2. USERS
app.get('/api/users', (req, res) => {
    db.all('SELECT id, username, role FROM users', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message }); res.json(rows);
    });
});
app.post('/api/users', (req, res) => {
    const { username, password, role } = req.body;
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
        if (row) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, role], function(err) {
            if (err) return res.status(500).json({ error: err.message }); res.json({ id: this.lastID, username, role });
        });
    });
});
app.put('/api/users/:id', (req, res) => {
    const { username, password, role } = req.body;
    const id = req.params.id;
    db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id], (err, row) => {
        if (row) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        if (password) {
            db.run('UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?', [username, password, role, id], err => {
                if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Cập nhật thành công' });
            });
        } else {
            db.run('UPDATE users SET username = ?, role = ? WHERE id = ?', [username, role, id], err => {
                if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Cập nhật thành công' });
            });
        }
    });
});
app.delete('/api/users/:id', (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', [req.params.id], err => {
        if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Xóa thành công' });
    });
});

// 3. READERS
app.get('/api/readers', (req, res) => {
    db.all('SELECT * FROM readers', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message }); res.json(rows);
    });
});
app.post('/api/readers', (req, res) => {
    const { full_name, class: reader_class, date_of_birth, gender } = req.body;
    db.get('SELECT id FROM readers WHERE full_name = ? AND date_of_birth = ?', [full_name, date_of_birth], (err, row) => {
        if (row) return res.status(400).json({ error: 'Độc giả này (trùng họ tên và ngày sinh) đã tồn tại' });
        db.run('INSERT INTO readers (full_name, class, date_of_birth, gender) VALUES (?, ?, ?, ?)', 
            [full_name, reader_class, date_of_birth, gender], function(err) {
            if (err) return res.status(500).json({ error: err.message }); res.json({ id: this.lastID, message: 'Thêm độc giả thành công' });
        });
    });
});
app.put('/api/readers/:id', (req, res) => {
    const { full_name, class: reader_class, date_of_birth, gender } = req.body;
    const id = req.params.id;
    db.get('SELECT id FROM readers WHERE full_name = ? AND date_of_birth = ? AND id != ?', [full_name, date_of_birth, id], (err, row) => {
        if (row) return res.status(400).json({ error: 'Độc giả này (trùng họ tên và ngày sinh) đã tồn tại' });
        db.run('UPDATE readers SET full_name = ?, class = ?, date_of_birth = ?, gender = ? WHERE id = ?',
            [full_name, reader_class, date_of_birth, gender, id], err => {
            if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Cập nhật thành công' });
        });
    });
});
app.delete('/api/readers/:id', (req, res) => {
    db.run('DELETE FROM readers WHERE id = ?', [req.params.id], err => {
        if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Xóa thành công' });
    });
});

// 4. CATEGORIES
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message }); res.json(rows);
    });
});
app.post('/api/categories', (req, res) => {
    const { category_name, description } = req.body;
    db.get('SELECT id FROM categories WHERE category_name = ?', [category_name], (err, row) => {
        if (row) return res.status(400).json({ error: 'Tên thể loại này đã tồn tại' });
        db.run('INSERT INTO categories (category_name, description) VALUES (?, ?)', [category_name, description], function(err) {
            if (err) return res.status(500).json({ error: err.message }); res.json({ id: this.lastID, message: 'Thêm thể loại thành công' });
        });
    });
});
app.put('/api/categories/:id', (req, res) => {
    const { category_name, description } = req.body;
    const id = req.params.id;
    db.get('SELECT id FROM categories WHERE category_name = ? AND id != ?', [category_name, id], (err, row) => {
        if (row) return res.status(400).json({ error: 'Tên thể loại này đã tồn tại' });
        db.run('UPDATE categories SET category_name = ?, description = ? WHERE id = ?', [category_name, description, id], err => {
            if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Cập nhật thành công' });
        });
    });
});
app.delete('/api/categories/:id', (req, res) => {
    db.run('DELETE FROM categories WHERE id = ?', [req.params.id], err => {
        if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Xóa thành công' });
    });
});

// 5. TITLES
app.get('/api/titles', (req, res) => {
    db.all('SELECT t.*, c.category_name FROM book_titles t LEFT JOIN categories c ON t.category_id = c.id', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message }); res.json(rows);
    });
});
app.post('/api/titles', (req, res) => {
    const { title_name, publisher, pages, size, author, category_id } = req.body;
    db.get('SELECT id FROM book_titles WHERE title_name = ? AND author = ?', [title_name, author], (err, row) => {
        if (row) return res.status(400).json({ error: 'Đầu sách và Tác giả này đã tồn tại' });
        db.run('INSERT INTO book_titles (title_name, publisher, pages, size, author, category_id, quantity) VALUES (?, ?, ?, ?, ?, ?, 0)',
            [title_name, publisher, pages, size, author, category_id], function(err) {
            if (err) return res.status(500).json({ error: err.message }); res.json({ id: this.lastID, message: 'Thêm đầu sách thành công' });
        });
    });
});
app.put('/api/titles/:id', (req, res) => {
    const { title_name, publisher, pages, size, author, category_id } = req.body;
    const id = req.params.id;
    db.get('SELECT id FROM book_titles WHERE title_name = ? AND author = ? AND id != ?', [title_name, author, id], (err, row) => {
        if (row) return res.status(400).json({ error: 'Đầu sách và Tác giả này đã tồn tại' });
        db.run('UPDATE book_titles SET title_name = ?, publisher = ?, pages = ?, size = ?, author = ?, category_id = ? WHERE id = ?',
            [title_name, publisher, pages, size, author, category_id, id], err => {
            if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Cập nhật thành công' });
        });
    });
});
app.delete('/api/titles/:id', (req, res) => {
    db.run('DELETE FROM book_titles WHERE id = ?', [req.params.id], err => {
        if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Xóa thành công' });
    });
});

// 6. COPIES
app.get('/api/copies', (req, res) => {
    db.all('SELECT c.*, t.title_name FROM book_copies c LEFT JOIN book_titles t ON c.title_id = t.id', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message }); res.json(rows);
    });
});
app.post('/api/copies', (req, res) => {
    const { title_id, status, import_date } = req.body;
    db.run('INSERT INTO book_copies (title_id, status, import_date) VALUES (?, ?, ?)', [title_id, status, import_date], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        db.run('UPDATE book_titles SET quantity = quantity + 1 WHERE id = ?', [title_id], () => {
            res.json({ id: this.lastID, message: 'Thêm bản sao thành công' });
        });
    });
});
app.put('/api/copies/:id', (req, res) => {
    db.run('UPDATE book_copies SET status = ? WHERE id = ?', [req.body.status, req.params.id], err => {
        if (err) return res.status(500).json({ error: err.message }); res.json({ message: 'Cập nhật thành công' });
    });
});
app.delete('/api/copies/:id', (req, res) => {
    db.get('SELECT title_id FROM book_copies WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            db.run('DELETE FROM book_copies WHERE id = ?', [req.params.id], err2 => {
                if (err2) return res.status(500).json({ error: err2.message });
                db.run('UPDATE book_titles SET quantity = quantity - 1 WHERE id = ?', [row.title_id], () => {
                    res.json({ message: 'Xóa thành công' });
                });
            });
        } else {
            res.status(404).json({ error: 'Không tìm thấy' });
        }
    });
});

// 7. BORROWS
app.get('/api/borrows', (req, res) => {
    db.all('SELECT b.* FROM borrows b', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message }); res.json(rows);
    });
});
app.post('/api/borrows', (req, res) => {
    const { copy_id, reader_id, librarian_id, borrow_date } = req.body;
    db.get("SELECT COUNT(*) as count FROM borrows WHERE reader_id = ? AND status = 'borrowing'", [reader_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row && row.count >= 1) return res.status(400).json({ error: 'Độc giả này đang mượn sách' });

        db.get("SELECT status FROM book_copies WHERE id = ?", [copy_id], (err, cRow) => {
            if (err) return res.status(500).json({ error: err.message });
            if (!cRow || cRow.status !== 'available') return res.status(400).json({ error: 'Sách không khả dụng' });

            db.run('INSERT INTO borrows (copy_id, reader_id, librarian_id, borrow_date, status) VALUES (?, ?, ?, ?, "borrowing")',
                [copy_id, reader_id, librarian_id, borrow_date], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                db.run('UPDATE book_copies SET status = "borrowed" WHERE id = ?', [copy_id], () => {
                    res.json({ id: this.lastID, message: 'Mượn sách thành công' });
                });
            });
        });
    });
});
app.post('/api/borrows/:id/return', (req, res) => {
    db.get('SELECT copy_id, status FROM borrows WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Không tìm thấy phiếu' });
        if (row.status === 'returned') return res.status(400).json({ error: 'Sách đã trả' });

        db.run('UPDATE borrows SET status = "returned", return_date = ? WHERE id = ?', [req.body.return_date, req.params.id], err => {
            if (err) return res.status(500).json({ error: err.message });
            db.run('UPDATE book_copies SET status = "available" WHERE id = ?', [row.copy_id], () => {
                res.json({ message: 'Trả sách thành công' });
            });
        });
    });
});

// 8. REPORTS
app.get('/api/reports/most-borrowed', (req, res) => {
    db.all('SELECT t.title_name, COUNT(b.id) as borrow_count FROM borrows b ...', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message }); res.json(rows);
    });
});
app.get('/api/reports/not-returned', (req, res) => {
    db.all("SELECT r.full_name, r.class, t.title_name, b.borrow_date FROM borrows b WHERE b.status = 'borrowing'", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message }); res.json(rows);
    });
});

// Chuyển hướng các đường dẫn không xác định về các trang tĩnh (SPA Fallback)
app.get('*', (req, res) => {
    let target = req.path;
    if (target === '/') target = '/index.html';
    res.sendFile(path.join(__dirname, 'public', target), err => {
        if (err) res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
});

app.listen(PORT, () => {
    console.log(`Server Express đang chạy tại http://localhost:${PORT}`);
});
