const Express = require('express');
const router = Express.Router();
const { crearUsuarios , verificarToken,login} = require('../controllers/user.Controllers')

//Rutas 


router.post('/usuario', crearUsuarios);
router.post('/login',login)
router.get('/confirm-email/:token', verificarToken);



module.exports = router;