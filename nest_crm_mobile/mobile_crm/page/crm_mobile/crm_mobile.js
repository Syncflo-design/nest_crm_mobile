// NestERP CRM Mobile - rep-facing customer + quick order screen
// Page route: /desk/crm-mobile

frappe.pages['crm-mobile'].on_page_load = function(wrapper) {
    const page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'NestERP CRM Mobile',
        single_column: true
    });

    const BUILD_MARKER = 'v0.1.4-2026-05-17-css-split';
    console.log('NestERP CRM Mobile loaded:', BUILD_MARKER);

    // Load page styles from the separate CSS file (keeps this JS under the
    // Cowork ~20KB Write/Edit truncation cap). See CLAUDE.md gotcha 2026-05-17.
    if (!document.getElementById('crm-mobile-stylesheet')) {
        const link = document.createElement('link');
        link.id = 'crm-mobile-stylesheet';
        link.rel = 'stylesheet';
        link.href = '/assets/nest_crm_mobile/css/crm_mobile.css';
        document.head.appendChild(link);
    }

    const CRM_HTML = [
        '<div class="crm-app">',
        '  <div class="crm-topbar">',
        '    <button class="crm-back-btn" id="crm-back" onclick="window.crmMobile.back()" style="display:none">&larr;</button>',
        '    <div class="crm-title" id="crm-view-title">Customers</div>',
        '  </div>',
        '  <div id="crm-view-list" class="crm-view">',
        '    <input class="crm-search" id="crm-search-customer" placeholder="Search customer..." oninput="window.crmMobile.searchCustomers(this.value)" />',
        '    <div id="crm-customer-list" class="crm-list"></div>',
        '  </div>',
        '  <div id="crm-view-customer" class="crm-view" style="display:none">',
        '    <div id="crm-customer-card"></div>',
        '    <button class="crm-primary" onclick="window.crmMobile.startOrder()">+ Start Order</button>',
        '    <h3>Recent Orders</h3>',
        '    <div id="crm-recent-orders"></div>',
        '  </div>',
        '  <div id="crm-view-order" class="crm-view" style="display:none">',
        '    <div id="crm-order-customer" class="crm-order-header"></div>',
        '    <input class="crm-search" id="crm-search-item" placeholder="Search item..." oninput="window.crmMobile.searchItems(this.value)" />',
        '    <div id="crm-item-list" class="crm-list"></div>',
        '    <div id="crm-cart" class="crm-cart">',
        '      <h4>Cart</h4>',
        '      <div id="crm-cart-lines"></div>',
        '      <div class="crm-cart-total" id="crm-cart-total">Total: R 0.00</div>',
        '      <button class="crm-primary" onclick="window.crmMobile.submitOrder()" id="crm-submit-btn" disabled>Submit Order</button>',
        '    </div>',
        '  </div>',
        '  <div id="crm-view-drafts" class="crm-view" style="display:none">',
        '    <h3>My Recent Orders</h3>',
        '    <div id="crm-drafts-list"></div>',
        '    <p class="crm-note">Offline drafts &amp; sync queue coming in Phase 2.</p>',
        '  </div>',
        '  <div class="crm-bottomnav">',
        '    <button id="crm-nav-customers" class="active" onclick="window.crmMobile.goCustomers()">Customers</button>',
        '    <button id="crm-nav-drafts" onclick="window.crmMobile.goDrafts()">My Orders</button>',
        '  </div>',
        '</div>'
    ].join('\n');

    page.main.html(CRM_HTML);

    window.crmMobile = {
        state: {
            customers: [],
            items: [],
            currentCustomer: null,
            cart: []
        },

        esc(s) {
            return frappe.utils.escape_html(s == null ? '' : String(s));
        },

        fmt(n) {
            return 'R ' + (Number(n) || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        },

        init() {
            this.loadCustomers();
        },

        showView(name) {
            const views = ['list', 'customer', 'order', 'drafts'];
            views.forEach((v) => {
                const el = document.getElementById('crm-view-' + v);
                if (el) el.style.display = (v === name) ? 'block' : 'none';
            });
            const titles = { list: 'Customers', customer: 'Customer', order: 'New Order', drafts: 'My Orders' };
            document.getElementById('crm-view-title').textContent = titles[name] || '';
            document.getElementById('crm-back').style.display = (name === 'list' || name === 'drafts') ? 'none' : 'inline-block';
            document.getElementById('crm-nav-customers').classList.toggle('active', name !== 'drafts');
            document.getElementById('crm-nav-drafts').classList.toggle('active', name === 'drafts');
        },

        back() {
            const orderVisible = document.getElementById('crm-view-order').style.display !== 'none';
            const custVisible = document.getElementById('crm-view-customer').style.display !== 'none';
            if (orderVisible) this.showView('customer');
            else if (custVisible) this.showView('list');
            else this.showView('list');
        },

        goCustomers() { this.showView('list'); },
        goDrafts()    { this.loadDrafts(); this.showView('drafts'); },

        loadCustomers() {
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Customer',
                    fields: ['name', 'customer_name', 'mobile_no', 'email_id', 'customer_group', 'territory'],
                    limit_page_length: 100,
                    order_by: 'modified desc'
                },
                callback: (r) => {
                    this.state.customers = r.message || [];
                    this.renderCustomerList(this.state.customers);
                }
            });
        },

        renderCustomerList(list) {
            const html = list.map((c) => {
                const safe = this.esc(c.name).replace(/'/g, '&apos;');
                return '<div class="crm-card" onclick="window.crmMobile.openCustomer(&apos;' + safe + '&apos;)">' +
                    '<div class="crm-card-title">' + this.esc(c.customer_name || c.name) + '</div>' +
                    '<div class="crm-card-sub">' + this.esc(c.customer_group || '') + ' &middot; ' + this.esc(c.territory || '') + '</div>' +
                    '</div>';
            }).join('');
            document.getElementById('crm-customer-list').innerHTML = html || '<p class="crm-empty">No customers found.</p>';
        },

        searchCustomers(q) {
            const query = (q || '').toLowerCase().trim();
            if (!query) return this.renderCustomerList(this.state.customers);
            const filtered = this.state.customers.filter((c) =>
                (c.customer_name || '').toLowerCase().includes(query) ||
                (c.name || '').toLowerCase().includes(query)
            );
            this.renderCustomerList(filtered);
        },

        openCustomer(name) {
            this.state.currentCustomer = name;
            frappe.call({
                method: 'frappe.client.get',
                args: { doctype: 'Customer', name: name },
                callback: (r) => {
                    this.renderCustomerCard(r.message);
                    this.loadRecentOrders(name);
                    this.showView('customer');
                }
            });
        },

        renderCustomerCard(c) {
            const html = '<div class="crm-customer-card">' +
                '<h2>' + this.esc(c.customer_name || c.name) + '</h2>' +
                '<div class="crm-meta">' + this.esc(c.customer_group || '') + ' &middot; ' + this.esc(c.territory || '') + '</div>' +
                '<div class="crm-info">' +
                '<div><strong>Phone:</strong> ' + this.esc(c.mobile_no || '—') + '</div>' +
                '<div><strong>Email:</strong> ' + this.esc(c.email_id || '—') + '</div>' +
                '<div><strong>Outstanding:</strong> ' + this.fmt(c.outstanding_amount) + '</div>' +
                '</div></div>';
            document.getElementById('crm-customer-card').innerHTML = html;
        },

        loadRecentOrders(customer) {
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Sales Order',
                    filters: { customer: customer },
                    fields: ['name', 'transaction_date', 'grand_total', 'status'],
                    limit_page_length: 5,
                    order_by: 'transaction_date desc'
                },
                callback: (r) => {
                    const orders = r.message || [];
                    const html = orders.length ? orders.map((o) => {
                        const safe = this.esc(o.name).replace(/'/g, '&apos;');
                        return '<div class="crm-card" onclick="window.crmMobile.openSalesOrder(&apos;' + safe + '&apos;)">' +
                        '<div class="crm-card-title">' + this.esc(o.name) + '</div>' +
                        '<div class="crm-card-sub">' + this.esc(o.transaction_date) + ' &middot; ' + this.fmt(o.grand_total) + ' &middot; ' + this.esc(o.status) + '</div>' +
                        '</div>';
                    }).join('') : '<p class="crm-empty">No orders yet for this customer.</p>';
                    document.getElementById('crm-recent-orders').innerHTML = html;
                }
            });
        },

        startOrder() {
            if (!this.state.currentCustomer) return;
            this.state.cart = [];
            document.getElementById('crm-order-customer').innerHTML =
                '<strong>Customer:</strong> ' + this.esc(this.state.currentCustomer);
            document.getElementById('crm-search-item').value = '';
            this.loadItems();
            this.renderCart();
            this.showView('order');
        },

        loadItems() {
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Item',
                    fields: ['name', 'item_name', 'item_code', 'standard_rate', 'stock_uom'],
                    filters: { disabled: 0, is_sales_item: 1 },
                    limit_page_length: 100,
                    order_by: 'item_name'
                },
                callback: (r) => {
                    this.state.items = r.message || [];
                    this.renderItemList(this.state.items);
                }
            });
        },

        renderItemList(list) {
            const html = list.map((i) => {
                const safe = this.esc(i.name).replace(/'/g, '&apos;');
                return '<div class="crm-item-row" onclick="window.crmMobile.addToCart(&apos;' + safe + '&apos;)">' +
                    '<div class="crm-item-info">' +
                    '<div class="crm-item-name">' + this.esc(i.item_name || i.name) + '</div>' +
                    '<div class="crm-item-sub">' + this.esc(i.item_code) + ' &middot; ' + this.fmt(i.standard_rate) + ' / ' + this.esc(i.stock_uom || '') + '</div>' +
                    '</div>' +
                    '<span class="crm-add-btn">+</span>' +
                    '</div>';
            }).join('');
            document.getElementById('crm-item-list').innerHTML = html || '<p class="crm-empty">No items found.</p>';
        },

        searchItems(q) {
            const query = (q || '').toLowerCase().trim();
            if (!query) return this.renderItemList(this.state.items);
            const filtered = this.state.items.filter((i) =>
                (i.item_name || '').toLowerCase().includes(query) ||
                (i.item_code || '').toLowerCase().includes(query)
            );
            this.renderItemList(filtered);
        },

        addToCart(itemName) {
            const item = this.state.items.find((i) => i.name === itemName);
            if (!item) return;
            const existing = this.state.cart.find((l) => l.item_code === item.item_code);
            if (existing) {
                existing.qty += 1;
            } else {
                this.state.cart.push({
                    item_code: item.item_code,
                    item_name: item.item_name,
                    qty: 1,
                    rate: Number(item.standard_rate) || 0,
                    uom: item.stock_uom
                });
            }
            this.renderCart();
        },

        updateQty(idx, delta) {
            const line = this.state.cart[idx];
            if (!line) return;
            line.qty = Math.max(0, (Number(line.qty) || 0) + delta);
            if (line.qty === 0) this.state.cart.splice(idx, 1);
            this.renderCart();
        },

        renderCart() {
            const lines = this.state.cart.map((l, idx) =>
                '<div class="crm-cart-line">' +
                '<div class="crm-cart-info">' +
                '<div>' + this.esc(l.item_name) + '</div>' +
                '<div class="crm-cart-sub">' + this.fmt(l.rate) + ' / ' + this.esc(l.uom || '') + '</div>' +
                '</div>' +
                '<div class="crm-qty-ctrl">' +
                '<button onclick="window.crmMobile.updateQty(' + idx + ', -1)">&minus;</button>' +
                '<span>' + l.qty + '</span>' +
                '<button onclick="window.crmMobile.updateQty(' + idx + ', 1)">+</button>' +
                '</div>' +
                '<div class="crm-cart-line-total">' + this.fmt(l.qty * l.rate) + '</div>' +
                '</div>'
            ).join('');
            document.getElementById('crm-cart-lines').innerHTML = lines || '<p class="crm-empty">Cart is empty. Tap items above to add.</p>';
            const total = this.state.cart.reduce((s, l) => s + (Number(l.qty) * Number(l.rate)), 0);
            document.getElementById('crm-cart-total').textContent = 'Total: ' + this.fmt(total);
            document.getElementById('crm-submit-btn').disabled = this.state.cart.length === 0;
        },

        submitOrder() {
            if (!this.state.currentCustomer || !this.state.cart.length) return;
            const today = frappe.datetime.get_today();
            const deliveryDate = frappe.datetime.add_days(today, 7);
            const doc = {
                doctype: 'Sales Order',
                customer: this.state.currentCustomer,
                transaction_date: today,
                delivery_date: deliveryDate,
                items: this.state.cart.map((l) => ({
                    item_code: l.item_code,
                    qty: l.qty,
                    rate: l.rate,
                    uom: l.uom,
                    delivery_date: deliveryDate
                }))
            };
            frappe.dom.freeze('Submitting order to NestERP...');
            frappe.call({
                method: 'frappe.client.insert',
                args: { doc: doc },
                callback: (r) => {
                    frappe.dom.unfreeze();
                    if (r && r.message) {
                        frappe.show_alert({ message: 'Order ' + r.message.name + ' created', indicator: 'green' }, 5);
                        this.state.cart = [];
                        const cust = this.state.currentCustomer;
                        this.openCustomer(cust);
                    }
                },
                error: () => {
                    frappe.dom.unfreeze();
                    frappe.show_alert({ message: 'Could not create order. Check console.', indicator: 'red' }, 5);
                }
            });
        },

        openSalesOrder(name) {
            frappe.set_route('Form', 'Sales Order', name);
        },

        loadDrafts() {
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Sales Order',
                    fields: ['name', 'customer', 'transaction_date', 'grand_total', 'status'],
                    filters: { owner: frappe.session.user },
                    limit_page_length: 30,
                    order_by: 'creation desc'
                },
                callback: (r) => {
                    const orders = r.message || [];
                    const html = orders.length ? orders.map((o) => {
                        const safe = this.esc(o.name).replace(/'/g, '&apos;');
                        return '<div class="crm-card" onclick="window.crmMobile.openSalesOrder(&apos;' + safe + '&apos;)">' +
                        '<div class="crm-card-title">' + this.esc(o.name) + '</div>' +
                        '<div class="crm-card-sub">' + this.esc(o.customer) + ' &middot; ' + this.esc(o.transaction_date) + ' &middot; ' + this.fmt(o.grand_total) + ' &middot; ' + this.esc(o.status) + '</div>' +
                        '</div>';
                    }).join('') : '<p class="crm-empty">You haven&apos;t created any orders yet.</p>';
                    document.getElementById('crm-drafts-list').innerHTML = html;
                }
            });
        }
    };

    window.crmMobile.init();
};
