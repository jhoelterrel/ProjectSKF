
require("dotenv").config();
const sql = require('mssql');


// Configuración de la conexión a SQL Server
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER, // Cambia esto por la dirección de tu servidor SQL
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false, // Habilita el modo inseguro
  },
};

// Establecer la conexión a la base de datos
const pool = new sql.ConnectionPool(dbConfig);
pool.connect()
  .then(() => console.log('Conexión exitosa a SQL Server'))
  .catch(error => console.log('Error de conexión a SQL Server', error));

module.exports = pool;
