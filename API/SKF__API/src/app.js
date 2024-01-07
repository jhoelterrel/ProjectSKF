// src/app.js
const userRoutes = require('./routes/userRoutes');
const express = require('express');
const cors = require('cors'); // Requiere el módulo cors
require("dotenv").config();
const app = express();
const path = require('path'); 
const port = 3000;

// Middleware para analizar solicitudes JSON
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

// Habilita CORS para todas las rutas y orígenes (esto permite solicitudes desde cualquier origen)
app.use(cors());

// Rutas

app.use(userRoutes);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor en ejecución en el puerto ${port}`);
});
