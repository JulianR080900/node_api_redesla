import express from 'express';
import v1CSF from './v1/routes/csf.js';
import cors from 'cors';

const app = express();

const whitelist = ['http://localhost', 'https://redesla.la/', 'https://redesla.la/redesla'];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

const PORT = process.env.PORT || 3000;

app.use(cors(corsOptions));
app.use(express.json());

// Rutas de la API
app.use('/api/v1/csf', v1CSF);

// Manejador de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Manejador de errores generales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
