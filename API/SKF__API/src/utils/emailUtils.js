// emailUtils.js
const transporter = require("./mailer");

// Función para enviar un correo de confirmación
async function sendConfirmationEmail(email, correoVerificacionToken) {
  
  const verificationLink = `http://localhost:3000/confirm-email/${correoVerificacionToken}`;

  const mailOptions = {
    from: 'jhoel00742@gmail.com',
    to: email,
    subject: 'Confirmación de registro',
    text: `¡Gracias por registrarte en nuestra plataforma!\n\nHaz clic en el siguiente enlace para confirmar tu registro:\n\n${verificationLink}`,
  };

  try {
    // Enviar el correo electrónico usando el transportador configurado
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error al enviar el correo de confirmación', error);
    throw error; // Puedes manejar el error según tus necesidades
  }
}

module.exports = { sendConfirmationEmail };
