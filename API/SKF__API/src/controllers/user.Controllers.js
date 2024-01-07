const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const sql = require("mssql");
const emailUtils = require("../utils/emailUtils");
const db = require("../database/database");
const { isValidEmail } = require("../utils/isValidEmail");

// Controlador para crear usuarios
const crearUsuarios = async (req, res) => {
  try {
    // Actualiza los nombres de los campos
    const {VC_CORREO,VC_CLAVE,VC_USUARIO,CH_SITUACION_REGISTRO,CH_ESTADO,CH_SOLICITAR_CLAVE,} = req.body; 

    // Validación de correo
    if (typeof VC_CORREO !== "string" || VC_CORREO.trim() === "") {
      return res.status(400).json({
        message: "El correo electrónico no es una cadena de caracteres válida",
      });
    }

    // Verificación del formato del correo electrónico
    if (!isValidEmail(VC_CORREO)) {
      return res
        .status(400)
        .json({ message: "El formato del correo electrónico no es válido" });
    }

    // Verificar si el correo electrónico ya existe en la base de datos
    const emailCheckRequest = new sql.Request(db);
    emailCheckRequest.input("VC_CORREO", sql.NVarChar(64), VC_CORREO);

    const emailCheckResult = await emailCheckRequest.query(
      "SELECT COUNT(*) as count FROM TA_USUARIO WHERE VC_CORREO = @VC_CORREO"
    );

    if (emailCheckResult.recordset[0].count > 0) {
      return res
        .status(400)
        .json({ message: "El correo electrónico ya está registrado" });
    }

    // Generar un token de verificación único
    const verificationToken = crypto.randomBytes(20).toString("hex");

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(VC_CLAVE, 10);

    // Llamar al procedimiento almacenado para insertar el usuario
    const request = new sql.Request(db);
    request.input("VC_USUARIO", sql.NVarChar(64), VC_USUARIO);
    request.input("VC_CLAVE",   sql.NVarChar(256), hashedPassword);
    request.input("VC_CORREO",  sql.NVarChar(64), VC_CORREO);
    request.input("CH_ESTADO",  sql.NVarChar(1), CH_ESTADO);
    request.input("CH_SITUACION_REGISTRO", sql.NVarChar(1), CH_SITUACION_REGISTRO);
    request.input("CH_SOLICITAR_CLAVE",    sql.VarChar(1), CH_SOLICITAR_CLAVE);
    request.input("VC_CORREO_VERIFICACION_TOKEN", sql.NVarChar(256), verificationToken);


    // Ejecutar el procedimiento almacenado
    await request.execute("SP_INSERTAR_TA_USUARIO");

    // Generar un token JWT
    const token = jwt.sign({ VC_USUARIO, VC_CORREO }, "secreto", {expiresIn: "1h",});

    // Enviar un correo de confirmación
    await emailUtils.sendConfirmationEmail(VC_CORREO, verificationToken);

    res
      .status(200)
      .send(
        "Usuario creado exitosamente. Se ha enviado un correo de confirmación."
      );
  } catch (error) {
    console.error("Error al crear el usuario", error);
    res.status(500).send("Error al crear el usuario.");
  }
};

// Controlador para verificar el token de confirmación
const verificarToken = async (req, res) => {
  try {
    const correoVerificacionToken = req.params.token; // Actualiza el nombre del token

    // Pasar la conexión de la base de datos a la solicitud
    const request = new sql.Request(db);

    request.input(
      "VC_CORREO_VERIFICACION_TOKEN",sql.NVarChar,correoVerificacionToken); // Actualiza el nombre del campo

    const result = await request.query(
      "UPDATE TA_USUARIO SET VC_CORREO_VERIFICADO = 1 WHERE VC_CORREO_VERIFICACION_TOKEN = @VC_CORREO_VERIFICACION_TOKEN"
    ); // Actualiza la tabla y el campo

    if (result.rowsAffected[0] === 0) {
      return res.status(404).send("Token de verificación no válido.");
    }

    res.status(200).send("Correo electrónico verificado correctamente.");
  } catch (error) {
    console.error("Error al verificar el correo electrónico", error);
    res.status(500).send("Error al verificar el correo electrónico.");
  }
};

// Controlador para autenticar usuarios
const login = async (req, res) => {
  try {
    // Elimina espacios en blanco alrededor del correo electrónico
    const VC_CORREO = req.body.VC_CORREO.trim(); // Actualiza el nombre del campo
    // Usa la contraseña original sin convertirla a minúsculas
    const VC_CLAVE = req.body.VC_CLAVE.trim(); // Actualiza el nombre del campo

    console.log(VC_CORREO)

    console.log(VC_CLAVE)


    const user = await authenticateUser(VC_CORREO, VC_CLAVE); // Actualiza los nombres de los campos

    if (!user) {
      return res.status(401).json({ message: "Credenciales incorrectas." });
    }

    if (user.CH_ESTADO=='E') {
      // Actualiza el nombre del campo
      return res.status(401).json({
        message:
          "La cuenta esta Desactivada.",
      });
    }
    

    res.status(200).json({
      message: "Usuario logeado correctamente",
      VC_NOMBRE_COMPLETO: user.VC_NOMBRE_COMPLETO,
      VC_CORREO: user.VC_CORREO
    });
  } catch (error) {
    console.error("Error de autenticación", error);
    res.status(500).json({ message: "Error de autenticación." });
  }
};

// Función para autenticar usuarios en la base de datos
const authenticateUser = async (VC_CORREO, VC_CLAVE) => {
  // Actualiza los nombres de los parámetros


  const request = new sql.Request(db);
  request.input("VC_CORREO", sql.NVarChar, VC_CORREO); // Actualiza el nombre del campo
  try {
    // Consulta SQL para seleccionar al usuario por su VC_CORREO (correo electrónico) y VC_CLAVE (contraseña)
    const query = `
      SELECT IN_CODIGO_USUARIO, VC_USUARIO,VC_NOMBRE_COMPLETO, VC_CLAVE, VC_CORREO,CH_ESTADO
      FROM TA_USUARIO WHERE CH_ESTADO='A' AND VC_CORREO = @VC_CORREO`;

    const result = await request.query(query);
    console.log("result:",result);
    // Comprueba si se encontró un usuario
    if (result.recordset.length === 0) {
      console.log("No se encontró ningún usuario con ese correo electrónico.");
      return null;
    }

    const user = result.recordset[0];

    //console.log("user:", user);
    //console.log("VC_CLAVE:", VC_CLAVE);
    //console.log("user.VC_CLAVE:", user.VC_CLAVE);

    //const hashedPassword = await bcrypt.hash("@SKF123456", 10);
    //console.log("hash.VC_CLAVE:", hashedPassword);
    // Comprueba si la contraseña coincide
    const passwordMatch = await bcrypt.compare(VC_CLAVE, user.VC_CLAVE); // Actualiza el nombre del campo de contraseña

    if (!passwordMatch) {
      console.log("Contraseña incorrecta.");
      return null;
    }

    console.log("Usuario autenticado:", user);
    return user;
  } catch (error) {
    console.error("Error en la función authenticateUser:", error);
    return null;
  }
};

module.exports = {
  crearUsuarios,
  verificarToken,
  login,
};
