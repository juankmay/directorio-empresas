// Servidor Express para Directorio Empresarial CONECTA FP
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
// Puerto dinámico para Render y 3000 para local
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
// Servir archivos estáticos del frontend
app.use(express.static('public'));

// Conexión a base de datos SQLite
const db = new sqlite3.Database('./database/database.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err);
  } else {
    console.log('✓ Conectado a la base de datos SQLite');
  }
});

// GET /api/empresas - Obtener empresas con paginación, búsqueda y filtros
app.get('/api/empresas', (req, res) => {
  const { page = 1, limit = 50, search = '', sector = '', comarca = '', dinamizador = '' } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const offset = (pageNum - 1) * limitNum;

  let whereConditions = [];
  let params = [];

  if (search) {
    whereConditions.push(`(
      nombre_empresa LIKE ? OR 
      persona_contacto LIKE ? OR 
      sector LIKE ? OR 
      comarca LIKE ? OR 
      dinamizador LIKE ?
    )`);
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
  }

  if (sector) {
    whereConditions.push('sector = ?');
    params.push(sector);
  }

  if (comarca) {
    whereConditions.push('comarca = ?');
    params.push(comarca);
  }

  if (dinamizador) {
    whereConditions.push('dinamizador = ?');
    params.push(dinamizador);
  }

  const whereClause = whereConditions.length > 0
    ? 'WHERE ' + whereConditions.join(' AND ')
    : '';

  // Contar total de registros
  db.get(
    `SELECT COUNT(*) as total FROM empresas ${whereClause}`,
    params,
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const total = row.total;

      // Obtener registros paginados
      db.all(
        `SELECT * FROM empresas ${whereClause} 
         ORDER BY nombre_empresa ASC 
         LIMIT ? OFFSET ?`,
        [...params, limitNum, offset],
        (err, rows) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            empresas: rows,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
          });
        }
      );
    }
  );
});

// GET /api/empresas/:id - Obtener una empresa por ID
app.get('/api/empresas/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM empresas WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    res.json(row);
  });
});

// POST /api/empresas - Crear nueva empresa
app.post('/api/empresas', (req, res) => {
  const {
    sector,
    nombre_empresa,
    comarca,
    correo_electronico,
    telefono,
    persona_contacto,
    cargo,
    pagina_web,
    dinamizador
  } = req.body;

  if (!nombre_empresa) {
    return res.status(400).json({ error: 'El nombre de empresa es obligatorio' });
  }

  db.run(
    `INSERT INTO empresas 
    (sector, nombre_empresa, comarca, correo_electronico, telefono, persona_contacto, cargo, pagina_web, dinamizador) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sector, nombre_empresa, comarca, correo_electronico, telefono, persona_contacto, cargo, pagina_web, dinamizador],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        id: this.lastID,
        message: 'Empresa creada correctamente'
      });
    }
  );
});

// PUT /api/empresas/:id - Actualizar empresa
app.put('/api/empresas/:id', (req, res) => {
  const { id } = req.params;
  const {
    sector,
    nombre_empresa,
    comarca,
    correo_electronico,
    telefono,
    persona_contacto,
    cargo,
    pagina_web,
    dinamizador
  } = req.body;

  if (!nombre_empresa) {
    return res.status(400).json({ error: 'El nombre de empresa es obligatorio' });
  }

  db.run(
    `UPDATE empresas 
    SET sector = ?, nombre_empresa = ?, comarca = ?, correo_electronico = ?, 
        telefono = ?, persona_contacto = ?, cargo = ?, pagina_web = ?, dinamizador = ?
    WHERE id = ?`,
    [sector, nombre_empresa, comarca, correo_electronico, telefono, persona_contacto, cargo, pagina_web, dinamizador, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Empresa no encontrada' });
      }
      res.json({ message: 'Empresa actualizada correctamente' });
    }
  );
});

// DELETE /api/empresas/:id - Eliminar empresa
app.delete('/api/empresas/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM empresas WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }
    res.json({ message: 'Empresa eliminada correctamente' });
  });
});

// GET /api/filtros - Obtener valores únicos para filtros
app.get('/api/filtros', (req, res) => {
  const queries = {
    sectores: 'SELECT DISTINCT sector FROM empresas WHERE sector IS NOT NULL AND sector != "" ORDER BY sector',
    comarcas: 'SELECT DISTINCT comarca FROM empresas WHERE comarca IS NOT NULL AND comarca != "" ORDER BY comarca',
    dinamizadores: 'SELECT DISTINCT dinamizador FROM empresas WHERE dinamizador IS NOT NULL AND dinamizador != "" ORDER BY dinamizador'
  };

  const resultados = {};
  let completadas = 0;

  Object.keys(queries).forEach(key => {
    db.all(queries[key], [], (err, rows) => {
      if (err) {
        console.error(`Error obteniendo ${key}:`, err);
        resultados[key] = [];
      } else {
        resultados[key] = rows.map(row => Object.values(row)[0]);
      }

      completadas++;
      if (completadas === 3) {
        res.json(resultados);
      }
    });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});

// Cerrar base de datos al terminar
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err);
    }
    console.log('\n✓ Base de datos cerrada');
    process.exit(0);
  });
});