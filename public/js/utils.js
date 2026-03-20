// Base URL cho API
const API_URL = 'http://localhost:3000/api';

// Hàm helper để get fetch API
async function apiFetch(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Có lỗi xảy ra');
        }
        
        if (method !== 'GET' && data.message) {
            if (typeof window.showToast === 'function') {
                window.showToast('Thành công', data.message, 'success');
            }
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// Kiểm tra đăng nhập
function checkAuth() {
    const user = localStorage.getItem('library_user');
    if (!user) {
        window.location.href = '/index.html';
        return null;
    }
    return JSON.parse(user);
}

// Đăng xuất
function logout() {
    localStorage.removeItem('library_user');
    window.location.href = '/index.html';
}

// Hàm format ngày (YYYY-MM-DD -> DD/MM/YYYY)
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

window.showConfirm = function(title, message, onConfirm) {
    let modal = document.getElementById('globalConfirmModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'globalConfirmModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content confirm-modal-content">
                <i class='bx bx-error-circle confirm-icon'></i>
                <h3 class="confirm-title" id="confirmTitle">Xác nhận</h3>
                <p class="confirm-text" id="confirmMessage">Bạn có chắc chắn?</p>
                <div class="flex-gap" style="justify-content: center;">
                    <button class="btn" style="background:#e2e8f0; color: var(--text-main)" onclick="document.getElementById('globalConfirmModal').classList.remove('active')">Hủy</button>
                    <button class="btn btn-danger" id="confirmBtn">Xóa</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const confirmBtn = document.getElementById('confirmBtn');
    
    // Clear old events
    const newBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
    
    newBtn.onclick = () => {
        modal.classList.remove('active');
        onConfirm();
    };
    modal.classList.add('active');
};    

// Setup common UI cho dashboard pages
function setupLayout() {
    const user = checkAuth();
    if (!user) return;
    
    // Nếu có logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Hiển thị tên user
    const usernameDisplay = document.getElementById('usernameDisplay');
    if (usernameDisplay) {
        usernameDisplay.textContent = user.username + (user.role === 'admin' ? ' (Admin)' : ' (Thủ thư)');
    }

    // Ẩn menu Admin nếu không phải admin
    if (user.role !== 'admin') {
        const adminMenu = document.getElementById('adminMenu');
        if (adminMenu) adminMenu.style.display = 'none';
    }

    // Auto initialize Custom Selects
    setTimeout(() => {
        document.querySelectorAll('select.form-control').forEach(select => {
            if(select.id) window.setupCustomSelect(select.id);
        });
    }, 100);
}

// ---- TOAST MODULE ----
window.showToast = function(title, message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = type === 'success' ? 'bx-check-circle' : 'bx-error-circle';
    toast.innerHTML = `
        <i class='bx ${icon} toast-icon'></i>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    container.appendChild(toast);
    // Trigger paint before animating
    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

window.originalAlert = window.alert;
window.alert = function(msg) {
    const message = String(msg);
    if (message.toLowerCase().includes('lỗi')) {
        showToast('Có lỗi xảy ra', message, 'error');
    } else {
        showToast('Thành công', message, 'success');
    }
};

// Form Validation UI
window.validateForm = function(rules) {
    let isValid = true;
    for (const [inputId, rule] of Object.entries(rules)) {
        const input = document.getElementById(inputId);
        if (!input) continue;

        let errorMsg = '';
        const val = input.value.trim();
        
        if (rule.required && !val) {
            errorMsg = rule.message || 'Vui lòng nhập trường này';
        } else if (rule.custom && !rule.custom(val)) {
            errorMsg = rule.message || 'Dữ liệu không hợp lệ';
        }
        
        let errorEl = input.nextElementSibling;
        if (!errorEl || !errorEl.classList.contains('error-text')) {
            errorEl = document.createElement('div');
            errorEl.className = 'error-text';
            input.parentNode.insertBefore(errorEl, input.nextSibling);
        }
        
        if (errorMsg) {
            input.classList.add('input-error');
            errorEl.textContent = errorMsg;
            errorEl.classList.add('active');
            isValid = false;
        } else {
            input.classList.remove('input-error');
            errorEl.classList.remove('active');
        }
        
        input.addEventListener('input', () => {
            input.classList.remove('input-error');
            errorEl.classList.remove('active');
        }, { once: true });
        
        input.addEventListener('change', () => {
            input.classList.remove('input-error');
            errorEl.classList.remove('active');
        }, { once: true });
    }
    return isValid;
};

// Date Format DD/MM/YYYY auto-slash
window.setupDateFormat = function(inputId) {
    const input = document.getElementById(inputId);
    if(!input) return;
    input.addEventListener('input', function (e) {
        let val = this.value.replace(/\D/g, '');
        if (val.length > 8) val = val.substring(0, 8);
        
        let out = '';
        if (val.length > 0) out += val.substring(0, 2);
        if (val.length > 2) out += '/' + val.substring(2, 4);
        if (val.length > 4) out += '/' + val.substring(4, 8);
        
        this.value = out;
        
        // Remove error on input if typed
        this.classList.remove('input-error');
        if(this.nextElementSibling && this.nextElementSibling.classList.contains('error-text')) {
             this.nextElementSibling.classList.remove('active');
        }
    });
};

// Custom Select Implementation
window.setupCustomSelect = function(selectId) {
    const select = document.getElementById(selectId);
    if (!select || select.dataset.customized === 'true') return;
    
    // hide original
    select.style.display = 'none';
    select.dataset.customized = 'true';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select-wrapper';
    
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    
    const trigger = document.createElement('div');
    trigger.className = `custom-select__trigger ${select.classList.contains('input-error') ? 'input-error' : ''}`;
    
    const textSpan = document.createElement('span');
    textSpan.textContent = select.options[select.selectedIndex]?.text || 'Chọn...';
    
    const iconSpan = document.createElement('i');
    iconSpan.className = 'bx bx-chevron-down';
    
    trigger.appendChild(textSpan);
    trigger.appendChild(iconSpan);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-options';
    
    const renderOptions = () => {
        optionsContainer.innerHTML = '';
        Array.from(select.options).forEach((opt, idx) => {
            if (opt.value === '' && opt.text.startsWith('Chọn') && opt.disabled) return; // Skip dummy placeholders if needed
            const optDiv = document.createElement('div');
            optDiv.className = `custom-option ${select.value === opt.value ? 'selected' : ''}`;
            optDiv.textContent = opt.text;
            optDiv.dataset.value = opt.value;
            optDiv.addEventListener('click', () => {
                select.value = opt.value;
                textSpan.textContent = opt.text;
                customSelect.classList.remove('open');
                // trigger change
                select.dispatchEvent(new Event('change'));
                
                // re-render options selection state
                Array.from(optionsContainer.children).forEach(c => c.classList.remove('selected'));
                optDiv.classList.add('selected');
            });
            optionsContainer.appendChild(optDiv);
        });
        textSpan.textContent = select.options[select.selectedIndex]?.text || 'Chọn...';
    };
    
    // observe changes to select options
    const observer = new MutationObserver(() => {
        renderOptions();
    });
    observer.observe(select, { childList: true });
    
    renderOptions();
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // close others
        document.querySelectorAll('.custom-select').forEach(cs => {
            if (cs !== customSelect) cs.classList.remove('open');
        });
        customSelect.classList.toggle('open');
    });
    
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    customSelect.appendChild(trigger);
    customSelect.appendChild(optionsContainer);
    wrapper.appendChild(customSelect);
    select.parentNode.insertBefore(wrapper, select.nextSibling);

    // Sync input error styling and value changes done programmatically
    const classObserver = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if (m.attributeName === 'class') {
                if (select.classList.contains('input-error')) trigger.classList.add('input-error');
                else trigger.classList.remove('input-error');
            }
        });
    });
    classObserver.observe(select, { attributes: true });

    // Sync value when changed from JS directly (like form.reset or editItem)
    select.addEventListener('change', () => {
        renderOptions();
    });
};
