const fs = require('fs');
const path = require('path');

const dataFile = path.join(__dirname, 'data.json');

// Initialize data.json if not exists
if (!fs.existsSync(dataFile)) {
    const initialData = {
        users: [
            { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
            { id: 2, username: 'thuthu1', password: '123456', role: 'librarian' }
        ],
        readers: [
            { id: 1, full_name: 'Nguyễn Văn A', class: 'KTPM_01', date_of_birth: '2000-01-01', gender: 'Nam' },
            { id: 2, full_name: 'Trần Thị B', class: 'HTTT_02', date_of_birth: '2001-05-15', gender: 'Nữ' },
            { id: 3, full_name: 'Lê Minh C', class: 'MTT_01', date_of_birth: '1999-10-20', gender: 'Nam' }
        ],
        categories: [
            { id: 1, category_name: 'Công nghệ Thông tin', description: 'Sách về lập trình, mạng, phần mềm' },
            { id: 2, category_name: 'Kinh tế', description: 'Sách về quản trị kinh doanh, marketing' },
            { id: 3, category_name: 'Toán học', description: 'Sách toán đại cương, rời rạc' }
        ],
        book_titles: [
            { id: 1, title_name: 'Clean Code', publisher: 'Prentice Hall', pages: 464, size: '15x22 cm', author: 'Robert C. Martin', quantity: 2, category_id: 1 },
            { id: 2, title_name: 'Cấu trúc Dữ liệu & Giải thuật', publisher: 'NXB KHTN', pages: 300, size: '17x24 cm', author: 'Nguyễn Đức Nghĩa', quantity: 1, category_id: 1 }
        ],
        book_copies: [
            { id: 1, title_id: 1, status: 'available', import_date: '2023-01-10' },
            { id: 2, title_id: 1, status: 'available', import_date: '2023-01-10' },
            { id: 3, title_id: 2, status: 'available', import_date: '2023-02-15' }
        ],
        borrows: []
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
}

function getData() {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

// Giả lập API của SQLite để tương thích với server.js mà không cần dùng alasql hay sqlite3
const db = {
    get: function(query, params, cb) {
        // Mock get based on simplistic regex parsing of the query
        // This is a minimal mock targeting ONLY what server.js actually executes
        const data = getData();
        let result = null;
        try {
            if (query.includes('FROM users WHERE username = ? AND password = ?')) {
                result = data.users.find(u => u.username === params[0] && u.password === params[1]);
            } else if (query.includes('FROM users WHERE username = ? AND id != ?')) {
                result = data.users.find(u => u.username === params[0] && u.id != params[1]);
            } else if (query.includes('FROM users WHERE username = ?')) {
                result = data.users.find(u => u.username === params[0]);
            } else if (query.includes('FROM readers WHERE full_name = ? AND date_of_birth = ? AND id != ?')) {
                result = data.readers.find(r => r.full_name === params[0] && r.date_of_birth === params[1] && r.id != params[2]);
            } else if (query.includes('FROM readers WHERE full_name = ? AND date_of_birth = ?')) {
                result = data.readers.find(r => r.full_name === params[0] && r.date_of_birth === params[1]);
            } else if (query.includes('FROM categories WHERE category_name = ? AND id != ?')) {
                result = data.categories.find(c => c.category_name === params[0] && c.id != params[1]);
            } else if (query.includes('FROM categories WHERE category_name = ?')) {
                result = data.categories.find(c => c.category_name === params[0]);
            } else if (query.includes('FROM book_titles WHERE title_name = ? AND author = ? AND id != ?')) {
                result = data.book_titles.find(t => t.title_name === params[0] && t.author === params[1] && t.id != params[2]);
            } else if (query.includes('FROM book_titles WHERE title_name = ? AND author = ?')) {
                result = data.book_titles.find(t => t.title_name === params[0] && t.author === params[1]);
            } else if (query.includes('FROM book_copies WHERE id = ?')) {
                result = data.book_copies.find(c => c.id == params[0]);
            } else if (query.includes('FROM borrows WHERE reader_id = ? AND status =')) {
                const count = data.borrows.filter(b => b.reader_id == params[0] && b.status === "borrowing").length;
                result = { count };
            } else if (query.includes('FROM borrows WHERE id = ?')) {
                result = data.borrows.find(b => b.id == params[0]);
            }
            cb(null, result || null);
        } catch (err) {
            cb(err, null);
        }
    },
    all: function(query, params, cb) {
        const data = getData();
        let results = [];
        try {
            if (query.includes('FROM users')) results = data.users;
            else if (query.includes('FROM readers')) results = data.readers;
            else if (query.includes('FROM categories')) results = data.categories;
            else if (query.includes('FROM book_titles')) {
                results = data.book_titles.map(t => ({
                    ...t,
                    category_name: data.categories.find(c => c.id == t.category_id)?.category_name
                }));
            } else if (query.includes('FROM book_copies')) {
                results = data.book_copies.map(c => ({
                    ...c,
                    title_name: data.book_titles.find(t => t.id == c.title_id)?.title_name
                }));
            } else if (query.includes('FROM borrows b')) {
                // Check if it's borrows list or reports
                if (query.includes('COUNT(b.id) as borrow_count')) {
                    // most-borrowed report
                    const borrowedCounts = {};
                    data.borrows.forEach(b => {
                        const copy = data.book_copies.find(c => c.id == b.copy_id);
                        if (copy) {
                            borrowedCounts[copy.title_id] = (borrowedCounts[copy.title_id] || 0) + 1;
                        }
                    });
                    results = Object.keys(borrowedCounts).map(tid => ({
                        title_name: data.book_titles.find(t => t.id == tid)?.title_name,
                        borrow_count: borrowedCounts[tid]
                    })).sort((a,b) => b.borrow_count - a.borrow_count).slice(0, 10);
                } else if (query.includes("b.status = 'borrowing'")) {
                    // not-returned report
                    results = data.borrows.filter(b => b.status === 'borrowing').map(b => {
                        const r = data.readers.find(r => r.id == b.reader_id);
                        const c = data.book_copies.find(c => c.id == b.copy_id);
                        const t = c ? data.book_titles.find(t => t.id == c.title_id) : null;
                        return {
                            full_name: r?.full_name,
                            class: r?.class,
                            title_name: t?.title_name,
                            borrow_date: b.borrow_date
                        };
                    });
                } else {
                    // all borrows list
                    results = data.borrows.map(b => {
                        const r = data.readers.find(r => r.id == b.reader_id);
                        const u = data.users.find(u => u.id == b.librarian_id);
                        const c = data.book_copies.find(c => c.id == b.copy_id);
                        const t = c ? data.book_titles.find(t => t.id == c.title_id) : null;
                        return {
                            ...b,
                            reader_name: r?.full_name,
                            librarian_name: u?.username,
                            title_name: t?.title_name,
                            copy_id: c?.id
                        };
                    });
                }
            }
            cb(null, results);
        } catch (err) {
            cb(err, null);
        }
    },
    run: function(query, params, cb) {
        const data = getData();
        const callback = typeof params === 'function' ? params : cb;
        const p = Array.isArray(params) ? params : [];
        let err = null;
        let lastID = null;

        try {
            if (query.includes('INSERT INTO users')) {
                lastID = (data.users.length ? Math.max(...data.users.map(i=>i.id)) : 0) + 1;
                data.users.push({ id: lastID, username: p[0], password: p[1], role: p[2] });
            } else if (query.includes('UPDATE users')) {
                const idx = data.users.findIndex(u => u.id == p[p.length-1]);
                if (idx !== -1) {
                    if (query.includes('password = ?')) {
                        data.users[idx] = { ...data.users[idx], username: p[0], password: p[1], role: p[2] };
                    } else {
                        data.users[idx] = { ...data.users[idx], username: p[0], role: p[1] };
                    }
                }
            } else if (query.includes('DELETE FROM users')) {
                data.users = data.users.filter(u => u.id != p[0]);
            }
            else if (query.includes('INSERT INTO readers')) {
                lastID = (data.readers.length ? Math.max(...data.readers.map(i=>i.id)) : 0) + 1;
                data.readers.push({ id: lastID, full_name: p[0], class: p[1], date_of_birth: p[2], gender: p[3] });
            } else if (query.includes('UPDATE readers')) {
                const idx = data.readers.findIndex(r => r.id == p[4]);
                if (idx !== -1) data.readers[idx] = { ...data.readers[idx], full_name: p[0], class: p[1], date_of_birth: p[2], gender: p[3] };
            } else if (query.includes('DELETE FROM readers')) {
                data.readers = data.readers.filter(r => r.id != p[0]);
            }
            else if (query.includes('INSERT INTO categories')) {
                lastID = (data.categories.length ? Math.max(...data.categories.map(i=>i.id)) : 0) + 1;
                data.categories.push({ id: lastID, category_name: p[0], description: p[1] });
            } else if (query.includes('UPDATE categories')) {
                const idx = data.categories.findIndex(c => c.id == p[2]);
                if (idx !== -1) data.categories[idx] = { ...data.categories[idx], category_name: p[0], description: p[1] };
            } else if (query.includes('DELETE FROM categories')) {
                data.categories = data.categories.filter(c => c.id != p[0]);
            }
            else if (query.includes('INSERT INTO book_titles')) {
                lastID = (data.book_titles.length ? Math.max(...data.book_titles.map(i=>i.id)) : 0) + 1;
                data.book_titles.push({ id: lastID, title_name: p[0], publisher: p[1], pages: p[2], size: p[3], author: p[4], category_id: p[5], quantity: 0 });
            } else if (query.includes('UPDATE book_titles SET title_name = ?')) {
                const idx = data.book_titles.findIndex(t => t.id == p[6]);
                if (idx !== -1) Object.assign(data.book_titles[idx], { title_name: p[0], publisher: p[1], pages: p[2], size: p[3], author: p[4], category_id: p[5] });
            } else if (query.includes('UPDATE book_titles SET quantity = quantity + 1')) {
                const idx = data.book_titles.findIndex(t => t.id == p[0]);
                if (idx !== -1) data.book_titles[idx].quantity += 1;
            } else if (query.includes('UPDATE book_titles SET quantity = quantity - 1')) {
                const idx = data.book_titles.findIndex(t => t.id == p[0]);
                if (idx !== -1) data.book_titles[idx].quantity = Math.max(0, data.book_titles[idx].quantity - 1);
            } else if (query.includes('DELETE FROM book_titles')) {
                data.book_titles = data.book_titles.filter(t => t.id != p[0]);
            }
            else if (query.includes('INSERT INTO book_copies')) {
                lastID = (data.book_copies.length ? Math.max(...data.book_copies.map(i=>i.id)) : 0) + 1;
                data.book_copies.push({ id: lastID, title_id: p[0], status: p[1], import_date: p[2] });
            } else if (query.includes('UPDATE book_copies SET status = "borrowed"')) {
                const idx = data.book_copies.findIndex(c => c.id == p[0]);
                if (idx !== -1) data.book_copies[idx].status = 'borrowed';
            } else if (query.includes('UPDATE book_copies SET status = "available"')) {
                const idx = data.book_copies.findIndex(c => c.id == p[0]);
                if (idx !== -1) data.book_copies[idx].status = 'available';
            } else if (query.includes('UPDATE book_copies SET status = ?')) {
                const idx = data.book_copies.findIndex(c => c.id == p[1]);
                if (idx !== -1) data.book_copies[idx].status = p[0];
            } else if (query.includes('DELETE FROM book_copies')) {
                data.book_copies = data.book_copies.filter(c => c.id != p[0]);
            }
            else if (query.includes('INSERT INTO borrows')) {
                lastID = (data.borrows.length ? Math.max(...data.borrows.map(i=>i.id)) : 0) + 1;
                data.borrows.push({ id: lastID, copy_id: p[0], reader_id: p[1], librarian_id: p[2], borrow_date: p[3], status: 'borrowing' });
            } else if (query.includes('UPDATE borrows SET status = "returned"')) {
                const idx = data.borrows.findIndex(b => b.id == p[1]);
                if (idx !== -1) Object.assign(data.borrows[idx], { status: 'returned', return_date: p[0] });
            }

            saveData(data);
        } catch (e) { err = e; }
        
        if (callback) callback.call({ lastID }, err);
    }
};

module.exports = db;
