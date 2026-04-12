import express from 'express'
import bcrypt from 'bcrypt'
import session from 'express-session'

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Para parsear formularios

app.use(session({
    secret: 'inventariox-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // En producción, usar HTTPS
}));

app.set('view engine', 'ejs');
app.set('views', './views');

// In-memory users storage (in production, use a database)
const users = [
    { id: 1, username: 'admin', password: bcrypt.hashSync('admin123', 10), role: 'admin' },
    { id: 2, username: 'seller', password: bcrypt.hashSync('seller123', 10), role: 'seller' },
    { id: 3, username: 'client', password: bcrypt.hashSync('client123', 10), role: 'client' }
];
// In-memory clients/suppliers storage
let clients = [
    { id: 1, name: 'Proveedor A', email: 'proveedora@example.com', phone: '111-1111', address: 'Calle 1' },
    { id: 2, name: 'Proveedor B', email: 'proveedorb@example.com', phone: '222-2222', address: 'Calle 2' }
];
let nextClientId = 3;

// In-memory offers/promotions storage
let offers = [
    { id: 1, productId: 1, discount: 10, description: '10% descuento' }
];
let nextOfferId = 2;
// Middleware to check authentication
function requireAuth(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

// Middleware to check role
function requireRole(roles) {
    return (req, res, next) => {
        if (req.session.user && (Array.isArray(roles) ? roles.includes(req.session.user.role) : req.session.user.role === roles)) {
            return next();
        }
        res.status(403).send('Acceso denegado');
    };
}

// In-memory storage for products
let products = [];
let nextId = 1;

// Authentication routes

// GET /login - Show login form
app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { error: null });
});

// POST /login - Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = { id: user.id, username: user.username, role: user.role };
        res.redirect('/');
    } else {
        res.render('login', { error: 'Credenciales inválidas' });
    }
});

// POST /logout - Handle logout
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Routes for product stock control

// GET /products - List all products (public for clients)
app.get('/products', (req, res) => {
    res.json(products);
});

// POST /products - Add a new product (admin/seller only)
app.post('/products', requireAuth, requireRole(['admin', 'seller']), (req, res) => {
    const { name, description, price, stock } = req.body;
    const acceptsHtml = req.accepts('html');
    const isFormSubmission = req.is('application/x-www-form-urlencoded') || acceptsHtml;

    if (!name || !price || stock === undefined) {
        if (isFormSubmission) {
            return res.status(400).send('Name, price, and stock are required');
        }
        return res.status(400).json({ error: 'Name, price, and stock are required' });
    }
    const newProduct = {
        id: nextId++,
        name,
        description: description || '',
        price: parseFloat(price),
        stock: parseInt(stock)
    };
    products.push(newProduct);

    if (isFormSubmission) {
        if (req.session.user && req.session.user.role === 'admin') {
            return res.redirect('/admin/products');
        }
        return res.redirect('/catalog');
    }
    res.status(201).json(newProduct);
});

// GET /products/:id - Get a specific product (public)
app.get('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
});

// PUT /products/:id - Update a product (admin/seller only)
app.put('/products/:id', requireAuth, requireRole(['admin', 'seller']), (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    const { name, description, price, stock } = req.body;
    if (name !== undefined) products[productIndex].name = name;
    if (description !== undefined) products[productIndex].description = description;
    if (price !== undefined) products[productIndex].price = parseFloat(price);
    if (stock !== undefined) products[productIndex].stock = parseInt(stock);
    res.json(products[productIndex]);
});

// DELETE /products/:id - Delete a product (admin only)
app.delete('/products/:id', requireAuth, requireRole('admin'), (req, res) => {
    const id = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    products.splice(productIndex, 1);
    res.status(204).send();
});

// Additional routes for stock management

// POST /products/:id/add-stock - Add stock to a product
app.post('/products/:id/add-stock', (req, res) => {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    if (quantity === undefined || quantity <= 0) {
        return res.status(400).json({ error: 'Valid quantity is required' });
    }
    const product = products.find(p => p.id === id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    product.stock += parseInt(quantity);
    res.json(product);
});

// POST /products/:id/remove-stock - Remove stock from a product
app.post('/products/:id/remove-stock', (req, res) => {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    if (quantity === undefined || quantity <= 0) {
        return res.status(400).json({ error: 'Valid quantity is required' });
    }
    const product = products.find(p => p.id === id);
    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }
    if (product.stock < quantity) {
        return res.status(400).json({ error: 'Insufficient stock' });
    }
    product.stock -= parseInt(quantity);
    res.json(product);
});

// Routes for UI

// GET / - Root redirige al formulario de login
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    if (req.session.user.role === 'admin') {
        return res.redirect('/admin/dashboard');
    }
    return res.redirect('/catalog');
});

// GET /catalog - Catálogo para seller/client
app.get('/catalog', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('catalog', { products, user: req.session.user });
});

// GET /cart - Carrito de compras
app.get('/cart', requireAuth, (req, res) => {
    req.session.cart = req.session.cart || [];
    const cart = req.session.cart.map(item => {
        const product = products.find(p => p.id === item.id);
        return product ? { ...product, quantity: item.quantity } : null;
    }).filter(item => item !== null);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    res.render('cart', { cart, total, user: req.session.user });
});

// POST /cart/add/:id - Agregar producto al carrito
app.post('/cart/add/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product || product.stock <= 0) {
        return res.status(400).json({ error: 'Producto no disponible' });
    }
    req.session.cart = req.session.cart || [];
    const existing = req.session.cart.find(item => item.id === id);
    if (existing) {
        if (existing.quantity >= product.stock) {
            return res.status(400).json({ error: 'No hay suficiente stock' });
        }
        existing.quantity++;
    } else {
        req.session.cart.push({ id, quantity: 1 });
    }
    res.status(200).json({ message: 'Producto agregado' });
});

// POST /cart/update/:id - Actualizar cantidad en carrito
app.post('/cart/update/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    const product = products.find(p => p.id === id);
    if (!product || quantity < 1 || quantity > product.stock) {
        return res.status(400).json({ error: 'Cantidad inválida' });
    }
    req.session.cart = req.session.cart || [];
    const item = req.session.cart.find(item => item.id === id);
    if (item) {
        item.quantity = parseInt(quantity);
    }
    res.status(200).json({ message: 'Cantidad actualizada' });
});

// POST /cart/remove/:id - Remover producto del carrito
app.post('/cart/remove/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    req.session.cart = req.session.cart || [];
    req.session.cart = req.session.cart.filter(item => item.id !== id);
    res.status(200).json({ message: 'Producto removido' });
});

// POST /cart/checkout - Generar compra
app.post('/cart/checkout', requireAuth, (req, res) => {
    req.session.cart = req.session.cart || [];
    if (req.session.cart.length === 0) {
        return res.status(400).json({ error: 'Carrito vacío' });
    }
    // Verificar stock y reducir
    for (const item of req.session.cart) {
        const product = products.find(p => p.id === item.id);
        if (!product || product.stock < item.quantity) {
            return res.status(400).json({ error: 'Stock insuficiente para ' + product.name });
        }
        product.stock -= item.quantity;
    }
    // Vaciar carrito
    req.session.cart = [];
    res.status(200).json({ message: 'Compra generada' });
});

// ADMIN ROUTES
app.get('/admin/dashboard', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
    }
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    res.render('admin/dashboard', { user: req.session.user, products, clients, offers, totalValue, totalStock });
});

// GET /admin/products - Mantenedor de productos
app.get('/admin/products', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
    }
    res.render('admin/products', { products, user: req.session.user });
});

// GET /admin/clients - Mantenedor de clientes/proveedores
app.get('/admin/clients', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
    }
    res.render('admin/clients', { clients, user: req.session.user });
});

// GET /admin/offers - Mantenedor de ofertas
app.get('/admin/offers', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/');
    }
    res.render('admin/offers', { offers, products, user: req.session.user });
});

// GET /add - Form to add product
app.get('/add', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.render('add', { user: req.session.user });
});

// GET /edit/:id - Form to edit product
app.get('/edit/:id', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const id = parseInt(req.params.id);
    const product = products.find(p => p.id === id);
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('edit', { product, user: req.session.user });
});

app.listen(3000, () =>{
    console.log("Server running on port 3000")
});