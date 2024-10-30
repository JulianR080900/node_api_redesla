import express from 'express';
import csfController from '../../controller/csfController.js';
import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.post('/read', (req, res, next) => {
    upload.single("file")(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Error de multer (por ejemplo, nombre del campo inesperado)
            return res.status(400).json({ error: 'Campo de archivo inesperado' });
        } else if (err) {
            // Otro tipo de error
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (!req.file) {
            // Si no se envió el archivo
            return res.status(400).json({ error: 'un archivo es requerido en la solicitud' });
        }
        
        // Si no hay errores, continua al controlador
        next();
    });
}, csfController.readCSF);

export default router;
