// Inicialización de la base de datos SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🚀 Inicializando base de datos...\n');

db.serialize(() => {
  // Crear tabla empresas
  db.run(`
    CREATE TABLE IF NOT EXISTS empresas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sector TEXT,
      nombre_empresa TEXT NOT NULL,
      comarca TEXT,
      correo_electronico TEXT,
      telefono TEXT,
      persona_contacto TEXT,
      cargo TEXT,
      pagina_web TEXT,
      dinamizador TEXT
    )
  `, (err) => {
    if (err) {
      console.error('❌ Error al crear tabla:', err);
      process.exit(1);
    } else {
      console.log('✓ Tabla "empresas" creada correctamente');
    }
  });

  // Verificar si ya hay datos
  db.get('SELECT COUNT(*) as count FROM empresas', [], (err, row) => {
    if (err) {
      console.error('❌ Error al verificar datos:', err);
      process.exit(1);
    }

    if (row.count > 0) {
      console.log(`✓ La base de datos ya contiene ${row.count} empresas`);
      console.log('✓ Base de datos lista\n');
      db.close();
      return;
    }

    console.log('📂 Insertando datos de ejemplo...\n');

    const datosEjemplo = [
      [1, 'Tecnología', 'Innovatech S.L.', 'Tarragonès', 'info@innovatech.es', '977112233', 'Laura Puig', 'CEO', 'https://innovatech.es', 'Joan Martínez'],
      [2, 'Hostelería', 'Restaurant Mar Blau', 'Baix Camp', 'reservas@marblau.com', '977445566', 'Pere Rovira', 'Gerente', 'https://marblau.com', 'Anna Soler'],
      [3, 'Construcción', 'Construccions del Delta S.A.', 'Montsià', 'obra@deltasa.com', '977778899', 'Mª Teresa Ferrer', 'Directora Comercial', 'https://deltasa.com', 'Joan Martínez'],
      [4, 'Comercio', 'Mercat Central BCN', 'Barcelonès', 'info@mercatcentral.cat', '933445566', 'Jordi Camps', 'Director', 'https://mercatcentral.cat', 'Anna Soler'],
      [5, 'Tecnología', 'DevCode Solutions', 'Vallès Occidental', 'contacto@devcode.es', '937889900', 'Carla Miró', 'CTO', 'https://devcode.es', 'Joan Martínez'],
      [6, 'Industria', 'Metalls i Forja SA', 'Bages', 'ventas@metalls.com', '938667788', 'Ramon Font', 'Responsable Ventas', 'https://metalls.com', 'Lluís Torres'],
      [7, 'Hostelería', 'Hotel Vista Mar', 'Garraf', 'reservas@vistamar.es', '938990011', 'Elena Prats', 'Recepción', 'https://vistamar.es', 'Anna Soler'],
      [8, 'Educación', 'Academia Futur', 'Maresme', 'info@academiafutur.cat', '937223344', 'Albert Vidal', 'Director', 'https://academiafutur.cat', 'Lluís Torres'],
      [9, 'Tecnología', 'Cloud Innovators SL', 'Alt Penedès', 'hello@cloudinnovators.io', '938556677', 'Núria Blanc', 'CEO', 'https://cloudinnovators.io', 'Joan Martínez'],
      [10, 'Construcción', 'Reformes Integrals BCN', 'Barcelonès', 'contacto@reformesbcn.com', '934112233', 'Marc Solà', 'Jefe de Obra', 'https://reformesbcn.com', 'Anna Soler']
    ];

    const stmt = db.prepare(`
      INSERT OR IGNORE INTO empresas 
      (id, sector, nombre_empresa, comarca, correo_electronico, telefono, persona_contacto, cargo, pagina_web, dinamizador) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    datosEjemplo.forEach(empresa => {
      stmt.run(empresa);
    });

    stmt.finalize(() => {
      console.log(`✓ ${datosEjemplo.length} empresas de ejemplo insertadas`);
      console.log('✓ Base de datos inicializada correctamente\n');
      console.log('💡 Para cargar tus datos completos, ejecuta luego:');
      console.log('   node import-csv.js Copia-de-EMPRESAS-TODAS-CONECTA-FP-Fusion.csv\n');

      db.close((err) => {
        if (err) {
          console.error('❌ Error al cerrar BD:', err);
          process.exit(1);
        }
      });
    });
  });
});
