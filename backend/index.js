const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '.env') });

const { Sequelize, DataTypes } = require("sequelize");

// Conexión a PostgreSQL
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  logging: false,
});

/* ===========================
   AI SERVICE
=========================== */
const { generateRecommendations, processChatRequest } = require("./services/aiService");


// Verificar conexión
sequelize
  .authenticate()
  .then(() => console.log("Conexión exitosa a PostgreSQL"))
  .catch((err) => console.error("Error al conectar a PostgreSQL:", err));

const app = express();

// Middleware de logging para todas las peticiones
app.use((req, res, next) => {
  console.log(`\n=== ${new Date().toISOString()} ===`);
  console.log(`${req.method} ${req.url}`);
  if (req.method !== 'GET') {
    const bodyCopy = { ...req.body };
    if (bodyCopy.password) bodyCopy.password = '******';
    console.log('Body:', bodyCopy);
  }
  next();
});

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
  }
})

const upload = multer({ storage: storage });
const uploadMultiple = multer({ storage: storage }).array('images', 10); // Máximo 10 imágenes

/* ===========================
   MODELOS
=========================== */

// Usuario
const Usuario = sequelize.define("Usuario", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  isAdmin: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
});

// Categoria
const Categoria = sequelize.define("Categoria", {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  type: { type: DataTypes.STRING, defaultValue: "General" }, // 'Genero', 'Plataforma', 'Clasificacion', etc.
  color: { type: DataTypes.STRING, defaultValue: "#ff4500" },
  icon: { type: DataTypes.STRING, defaultValue: "tag" },
  description: { type: DataTypes.TEXT, allowNull: true },
});

const Producto = sequelize.define("Producto", {
  name: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.FLOAT, allowNull: false },
  description: DataTypes.TEXT,
  image: DataTypes.STRING, // Mantenemos para compatibilidad (será la imagen principal)
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  minRequirements: { type: DataTypes.JSON, allowNull: true },
  recRequirements: { type: DataTypes.JSON, allowNull: true },
  techSpecs: { type: DataTypes.JSON, allowNull: true }, // For hardware/consoles
  developer: DataTypes.STRING,
  publisher: DataTypes.STRING,
  releaseDate: DataTypes.DATEONLY,
  languages: DataTypes.STRING,
  multiplayer: DataTypes.STRING,
  classification: DataTypes.STRING,
  edition: { type: DataTypes.STRING, defaultValue: "Edición Estándar" },
  rating: { type: DataTypes.FLOAT, defaultValue: 4.8 },
  reviewCount: { type: DataTypes.INTEGER, defaultValue: 1245 },
});

// ProductoImagen - Para múltiples imágenes
const ProductoImagen = sequelize.define("ProductoImagen", {
  url: { type: DataTypes.STRING, allowNull: false },
  orden: { type: DataTypes.INTEGER, defaultValue: 0 }, // Para ordenar las imágenes
  esPrincipal: { type: DataTypes.BOOLEAN, defaultValue: false }, // Marca la imagen principal
});

// Carrito
const Carrito = sequelize.define("Carrito", {});

// CarritoProducto (Tabla intermedia para la relación muchos a muchos)
const CarritoProducto = sequelize.define("CarritoProducto", {
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
});

// ProductoCategoria (Tabla intermedia)
const ProductoCategoria = sequelize.define("ProductoCategoria", {});

// Asociaciones
// Producto <-> Categoria (Muchos a Muchos)
Producto.belongsToMany(Categoria, { as: 'Categorias', through: ProductoCategoria });
Categoria.belongsToMany(Producto, { as: 'Productos', through: ProductoCategoria });

// Asociaciones para múltiples imágenes
Producto.hasMany(ProductoImagen, { as: 'imagenes' });
ProductoImagen.belongsTo(Producto);

Usuario.hasOne(Carrito);
Carrito.belongsTo(Usuario);

Carrito.belongsToMany(Producto, { through: CarritoProducto });
Producto.belongsToMany(Carrito, { through: CarritoProducto });

// Sincronizar modelos con la base de datos
sequelize
  .sync({ alter: true })
  .then(() => console.log("Modelos sincronizados"))
  .catch((err) => console.error("Error al sincronizar modelos:", err));

/* ===========================
   MIDDLEWARE
=========================== */

// Middleware para verificar Token JWT
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Acceso denegado. No se proporcionó token." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Token inválido" });
  }
};

// Middleware para verificar si el usuario es administrador
const isAdmin = async (req, res, next) => {
  // Si ya pasamos por verifyToken, usamos req.user
  if (req.user) {
    if (req.user.isAdmin) {
      return next();
    } else {
      return res.status(403).json({ message: "Acceso denegado. Se requieren permisos de administrador." });
    }
  }

  // Fallback para compatibilidad (aunque inseguro, lo mantenemos mientras migramos todo el frontend)
  // O podemos eliminarlo si estamos seguros que todo usará token.
  // Por seguridad, vamos a forzar el uso de Token para rutas admin.
  return res.status(401).json({ message: "Acceso denegado. Autenticación requerida." });
};

/* ===========================
   RUTAS DE AUTENTICACIÓN
=========================== */

// POST /registro → Registrar nuevo usuario
app.post("/registro", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    const usuarioExistente = await Usuario.findOne({ where: { email: normalizedEmail } });
    if (usuarioExistente) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const totalUsuarios = await Usuario.count();

    const nuevoUsuario = await Usuario.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      isAdmin: totalUsuarios === 0, // El primer usuario es admin
    });

    // Crear un carrito para el nuevo usuario
    await Carrito.create({ UsuarioId: nuevoUsuario.id });

    // Generar Token
    const token = jwt.sign(
      { id: nuevoUsuario.id, email: nuevoUsuario.email, isAdmin: nuevoUsuario.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      id: nuevoUsuario.id,
      name: nuevoUsuario.name,
      email: nuevoUsuario.email,
      isAdmin: nuevoUsuario.isAdmin,
      token: token,
    });
  } catch (error) {
    console.error('Error en /registro:', error);
    res.status(500).json({ message: "Error en el registro", error: error.message });
  }
});

// POST /login → Iniciar sesión
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email y contraseña son requeridos" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const usuario = await Usuario.findOne({ where: { email: normalizedEmail } });

    if (!usuario) {
      console.log(`Login fallido: Usuario no encontrado (${normalizedEmail})`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      console.log(`Login fallido: Contraseña incorrecta para ${normalizedEmail}`);
      return res.status(401).json({ message: "Credenciales inválidas" });
    }

    console.log(`Login exitoso: ${normalizedEmail}`);

    // Generar Token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, isAdmin: usuario.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      isAdmin: usuario.isAdmin,
      token: token,
    });
  } catch (error) {
    console.error('Error en /login:', error);
    res.status(500).json({ message: "Error en el login", error: error.message || error.toString() || 'Unknown error' });
  }
});

/* ===========================
   RUTAS DE USUARIOS (Admin)
=========================== */

// GET /usuarios → Obtener todos los usuarios
app.get("/usuarios", verifyToken, isAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({ attributes: { exclude: ["password"] } });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuarios", error: error.message });
  }
});

// GET /usuarios/:id → Obtener un usuario por ID
app.get("/usuarios/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, { attributes: { exclude: ["password"] } });
    if (usuario) {
      res.json(usuario);
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al obtener usuario", error: error.message });
  }
});

// POST /usuarios → Crear un nuevo usuario (admin)
app.post("/usuarios", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, isAdmin: newIsAdmin, isActive } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nombre, email y contraseña son requeridos" });
    }
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ message: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const nuevoUsuario = await Usuario.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: newIsAdmin || false,
      isActive: isActive !== undefined ? isActive : true,
    });

    await Carrito.create({ UsuarioId: nuevoUsuario.id });

    res.status(201).json({
      id: nuevoUsuario.id,
      name: nuevoUsuario.name,
      email: nuevoUsuario.email,
      isAdmin: nuevoUsuario.isAdmin,
      isActive: nuevoUsuario.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al crear usuario", error: error.message });
  }
});

// PUT /usuarios/:id → Actualizar datos del usuario
app.put("/usuarios/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, isAdmin: newIsAdmin, isActive } = req.body;
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    usuario.name = name ?? usuario.name;
    usuario.email = email ?? usuario.email;
    usuario.isAdmin = newIsAdmin ?? usuario.isAdmin;
    usuario.isActive = isActive ?? usuario.isActive;
    await usuario.save();
    res.json({
      id: usuario.id,
      name: usuario.name,
      email: usuario.email,
      isAdmin: usuario.isAdmin,
      isActive: usuario.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar usuario", error: error.message });
  }
});

// DELETE /usuarios/:id → Eliminar usuario
app.delete("/usuarios/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deleted = await Usuario.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Usuario no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar usuario", error: error.message });
  }
});


/* ===========================
   RUTAS DE PRODUCTOS
=========================== */

// GET /productos → Listar todos los productos
app.get("/productos", async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: [
        { model: Categoria, as: 'Categorias' },
        { model: ProductoImagen, as: 'imagenes', order: [['orden', 'ASC']] }
      ]
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos", error: error.message });
  }
});

// GET /productos/:id → Obtener producto por ID
app.get("/productos/:id", async (req, res) => {
  try {
    const producto = await Producto.findByPk(req.params.id, {
      include: [
        { model: Categoria, as: 'Categorias' },
        { model: ProductoImagen, as: 'imagenes', order: [['orden', 'ASC']] }
      ]
    });
    if (producto) {
      res.json(producto);
    } else {
      res.status(404).json({ message: "Producto no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al obtener producto", error: error.message });
  }
});

// POST /productos → Crear nuevo producto (admin)
app.post("/productos", [verifyToken, uploadMultiple, isAdmin], async (req, res) => {
  console.log('POST /productos called');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  console.log('User ID from header:', req.header("X-User-ID"));

  try {
    const { 
      name, price, description, stock, categoriaIds,
      developer, publisher, releaseDate, languages,
      multiplayer, classification, edition,
      minRequirements, recRequirements, techSpecs
    } = req.body;

    const parseJSON = (val) => {
      if (!val) return null;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (e) { return null; }
    };

    // Crear el producto primero
    const nuevoProducto = await Producto.create({
      name,
      price,
      description,
      stock,
      developer,
      publisher,
      releaseDate,
      languages,
      multiplayer,
      classification,
      edition: edition || "Edición Estándar",
      minRequirements: parseJSON(minRequirements),
      recRequirements: parseJSON(recRequirements),
      techSpecs: parseJSON(techSpecs)
    });

    console.log('Producto creado con ID:', nuevoProducto.id);

    // Asociar categorías (Tags) - sanitizar/normalizar los IDs
    if (categoriaIds) {
      let ids = categoriaIds;
      console.log('categoriaIds recibido:', categoriaIds, 'tipo:', typeof categoriaIds);

      // Si viene como string, intentar parsear JSON o coma-separado
      if (typeof categoriaIds === 'string') {
        if (categoriaIds.trim().startsWith('[')) {
          try {
            ids = JSON.parse(categoriaIds);
          } catch (e) {
            console.error('Error parsing categoriaIds JSON:', e);
            ids = [];
          }
        } else {
          ids = categoriaIds.split(',').map(id => id.trim()).filter(id => id);
        }
      }

      // Coerce a números y filtrar valores inválidos
      if (Array.isArray(ids)) {
        ids = ids.map(i => Number(i)).filter(n => Number.isInteger(n) && n > 0);
      } else if (typeof ids === 'number') {
        ids = [ids];
      } else {
        ids = [];
      }

      console.log('IDs procesados (coercion a número):', ids);

      if (ids.length > 0) {
        try {
          await nuevoProducto.setCategorias(ids);
          console.log('Categorías asignadas correctamente');
        } catch (e) {
          console.error('Error al asignar categorías:', e);
          // No exponer stack a producción, pero enviar mensaje útil al cliente en desarrollo
          throw new Error('Error al asignar categorías: ' + (e.message || e));
        }
      }
    }

    // Procesar las imágenes si existen
    if (req.files && req.files.length > 0) {
      const imagenesData = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        orden: index,
        esPrincipal: index === 0,
        ProductoId: nuevoProducto.id
      }));

      await ProductoImagen.bulkCreate(imagenesData);
      await nuevoProducto.update({ image: imagenesData[0].url });
    }

    // Obtener el producto completo con sus imágenes
    const productoCompleto = await Producto.findByPk(nuevoProducto.id, {
      include: [
        { model: Categoria, as: 'Categorias' },
        { model: ProductoImagen, as: 'imagenes', order: [['orden', 'ASC']] }
      ]
    });

    if (productoCompleto) {
      try {
        console.log('Product created successfully:', productoCompleto.toJSON ? productoCompleto.toJSON() : productoCompleto);
      } catch (e) {
        console.log('Producto creado pero no se pudo serializar con toJSON():', e);
      }
    }

    res.status(201).json(productoCompleto);
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Error stack:', error && error.stack ? error.stack : error);
    // Enviar mensaje claro al cliente para depuración
    res.status(500).json({ message: "Error al crear producto", error: error.message || String(error) });
  }
});

// PUT /productos/:id → Editar producto (admin)
app.put("/productos/:id", [verifyToken, uploadMultiple, isAdmin], async (req, res) => {
  try {
    const { 
      name, price, description, stock, categoriaIds,
      developer, publisher, releaseDate, languages,
      multiplayer, classification, edition,
      minRequirements, recRequirements, techSpecs
    } = req.body;

    const parseJSON = (val) => {
      if (!val) return null;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (e) { return null; }
    };

    const updateData = { 
      name, price, description, stock,
      developer, publisher, releaseDate, languages,
      multiplayer, classification, edition,
      minRequirements: parseJSON(minRequirements),
      recRequirements: parseJSON(recRequirements),
      techSpecs: parseJSON(techSpecs)
    };

    // Actualizar datos básicos del producto
    const [updated] = await Producto.update(updateData, { where: { id: req.params.id } });

    if (!updated) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const producto = await Producto.findByPk(req.params.id);

    // Actualizar categorías
    if (categoriaIds) {
      let ids = categoriaIds;
      // Handle if FormData sent as string
      if (typeof categoriaIds === 'string') {
        try { ids = JSON.parse(categoriaIds); } catch (e) {
          ids = categoriaIds.split(',').map(id => id.trim());
        }
      }
      if (Array.isArray(ids)) {
        await producto.setCategorias(ids);
      }
    }

    // Si hay nuevas imágenes, reemplazar todas las existentes
    if (req.files && req.files.length > 0) {
      // Eliminar imágenes existentes
      await ProductoImagen.destroy({ where: { ProductoId: req.params.id } });

      // Crear nuevas imágenes
      const imagenesData = req.files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        orden: index,
        esPrincipal: index === 0,
        ProductoId: req.params.id
      }));

      await ProductoImagen.bulkCreate(imagenesData);

      // Actualizar el campo image del producto con la primera imagen (compatibilidad)
      await Producto.update(
        { image: imagenesData[0].url },
        { where: { id: req.params.id } }
      );
    }

    // Obtener el producto actualizado con sus imágenes
    const updatedProducto = await Producto.findByPk(req.params.id, {
      include: [
        { model: Categoria, as: 'Categorias' },
        { model: ProductoImagen, as: 'imagenes', order: [['orden', 'ASC']] }
      ]
    });

    res.json(updatedProducto);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar producto", error: error.message });
  }
});

// DELETE /productos/:id → Eliminar producto (admin)
app.delete("/productos/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deleted = await Producto.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Producto no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar producto", error: error.message });
  }
});

/* ===========================
   RUTAS DE CATEGORÍAS
=========================== */

// GET /categorias → Listar categorías
app.get("/categorias", async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      include: [{ model: Producto, as: 'Productos', attributes: ['id'] }]
    });
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener categorías", error: error.message });
  }
});

// GET /categorias/:id → Obtener productos por categoría
app.get("/categorias/:id", async (req, res) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id, {
      include: [{ model: Producto, as: 'Productos' }]
    });
    if (categoria) {
      res.json(categoria.Productos);
    } else {
      res.status(404).json({ message: "Categoría no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al obtener productos por categoría", error: error.message });
  }
});

// POST /categorias → Crear categoría (admin)
app.post("/categorias", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, type, color, icon, description } = req.body;
    const nuevaCategoria = await Categoria.create({ name, type, color, icon, description });
    res.status(201).json(nuevaCategoria);
  } catch (error) {
    res.status(500).json({ message: "Error al crear categoría", error: error.message });
  }
});

// PUT /categorias/:id → Editar categoría (admin)
app.put("/categorias/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, type, color, icon, description } = req.body;
    const [updated] = await Categoria.update({ name, type, color, icon, description }, { where: { id: req.params.id } });
    if (updated) {
      const updatedCategoria = await Categoria.findByPk(req.params.id);
      res.json(updatedCategoria);
    } else {
      res.status(404).json({ message: "Categoría no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar categoría", error: error.message });
  }
});

// DELETE /categorias/:id → Eliminar categoría (admin)
app.delete("/categorias/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deleted = await Categoria.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Categoría no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar categoría", error: error.message });
  }
});

/* ===========================
   RUTAS DEL CARRITO
=========================== */

// GET /carrito/:usuarioId → Obtener carrito de un usuario
app.get("/carrito/:usuarioId", async (req, res) => {
  try {
    const carrito = await Carrito.findOne({
      where: { UsuarioId: req.params.usuarioId },
      include: [{ 
        model: Producto, 
        through: { attributes: ['quantity'] },
        include: [{ model: Categoria, as: 'Categorias' }]
      }]
    });
    if (carrito) {
      res.json(carrito);
    } else {
      res.status(404).json({ message: "Carrito no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al obtener el carrito", error: error.message });
  }
});

// POST /carrito/:usuarioId → Agregar producto al carrito
app.post("/carrito/:usuarioId", async (req, res) => {
  try {
    const { productoId, quantity } = req.body;
    const carrito = await Carrito.findOne({ where: { UsuarioId: req.params.usuarioId } });
    const producto = await Producto.findByPk(productoId);

    if (!carrito || !producto) {
      return res.status(404).json({ message: "Carrito o Producto no encontrado" });
    }

    const [carritoProducto, created] = await CarritoProducto.findOrCreate({
      where: { CarritoId: carrito.id, ProductoId: producto.id },
      defaults: { quantity: quantity || 1 }
    });

    if (!created) {
      carritoProducto.quantity += (quantity || 1);
      await carritoProducto.save();
    }

    res.status(201).json(carritoProducto);
  } catch (error) {
    res.status(500).json({ message: "Error al agregar producto al carrito", error: error.message });
  }
});

// PUT /carrito/:usuarioId → Actualizar cantidad de un producto
app.put("/carrito/:usuarioId", async (req, res) => {
  try {
    const { productoId, quantity } = req.body;
    const carrito = await Carrito.findOne({ where: { UsuarioId: req.params.usuarioId } });

    if (!carrito) return res.status(404).json({ message: "Carrito no encontrado" });

    const item = await CarritoProducto.findOne({ where: { CarritoId: carrito.id, ProductoId: productoId } });

    if (item) {
      item.quantity = quantity;
      await item.save();
      res.json(item);
    } else {
      res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar el carrito", error: error.message });
  }
});

// DELETE /carrito/:usuarioId/:prodId → Eliminar un producto del carrito
app.delete("/carrito/:usuarioId/:prodId", async (req, res) => {
  try {
    const { usuarioId, prodId } = req.params;
    const carrito = await Carrito.findOne({ where: { UsuarioId: usuarioId } });

    if (!carrito) return res.status(404).json({ message: "Carrito no encontrado" });

    const deleted = await CarritoProducto.destroy({ where: { CarritoId: carrito.id, ProductoId: prodId } });

    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: "Producto no encontrado en el carrito" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar producto del carrito", error: error.message });
  }
});

// DELETE /carrito/:usuarioId → Vaciar carrito
app.delete("/carrito/:usuarioId", async (req, res) => {
  try {
    const carrito = await Carrito.findOne({ where: { UsuarioId: req.params.usuarioId } });
    if (!carrito) return res.status(404).json({ message: "Carrito no encontrado" });
    await CarritoProducto.destroy({ where: { CarritoId: carrito.id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error al vaciar el carrito", error: error.message });
  }
});


/* ===========================
   RUTAS DE IA (Recomendaciones)
=========================== */

// POST /api/recommendations
app.post("/api/recommendations", async (req, res) => {
  try {
    const { cartItems } = req.body;
    const allProducts = await Producto.findAll({
      include: [{ model: Categoria, as: 'Categorias' }, { model: ProductoImagen, as: 'imagenes' }]
    });
    const recommendations = await generateRecommendations(cartItems, allProducts);
    res.json(recommendations);
  } catch (error) {
    console.error("Error in recommendation endpoint:", error);
    res.status(500).json({ message: "Error generating recommendations" });
  }
});

// POST /api/ai/chat
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { message, cartItems, behaviorContext } = req.body;
    const response = await processChatRequest(message, cartItems, behaviorContext);
    res.json({ response });
  } catch (error) {
    console.error("Error in AI chat endpoint:", error);
    res.status(500).json({ message: "Error in AI chat processing" });
  }
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor funcionando en el puerto ${PORT}`);
});
