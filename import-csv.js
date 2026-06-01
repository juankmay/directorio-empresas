// Script para importar empresas desde CSV a SQLite
const fs = require('fs');
const csv = require('csv-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Ruta del archivo CSV a importar
const CSV_FILE = process.argv[2] || 'empresas.csv';

if (!fs.existsSync(CSV_FILE)) {
  console.error(`❌ Error: No se encontró el archivo ${CSV_FILE}`);
  console.log('\nUso: node import-csv.js <ruta-al-archivo.csv>');
  process.exit(1);
}

const empresas = [];
let linea = 0;

console.log(`📂 Leyendo archivo: ${CSV_FILE}\n`);

fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on('data', (row) => {
    linea++;
    
    const empresa = {
      sector: row['Sector'] || row['sector'] || '',
      nombre_empresa: row['Nombre de la empresa'] || row['nombre_empresa'] || row['Empresa'] || '',
      comarca: row['comarca'] || row['Comarca'] || '',
      correo_electronico: row['correo electrónico'] || row['correo_electronico'] || row['email'] || '',
      telefono: row['teléfono'] || row['telefono'] || row['Teléfono'] || '',
      persona_contacto: row['persona de contacto'] || row['persona_contacto'] || row['Contacto'] || '',
      cargo: row['cargo'] || row['Cargo'] || '',
      pagina_web: row['página web'] || row['pagina_web'] || row['web'] || '',
      dinamizador: row['dinamizador'] || row['Dinamizador'] || ''
    };

    if (empresa.nombre_empresa) {
      empresas.push(empresa);
    } else {
      console.warn(`⚠️  Línea ${linea}: Ignorada (sin nombre de empresa)`);
    }
  })
  .on('end', () => {
    console.log(`\n✅ ${empresas.length} empresas leídas del CSV\n`);
    
    if (empresas.length === 0) {
      console.error('❌ No hay datos válidos para importar');
      db.close();
      return;
    }

    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('¿Deseas BORRAR todos los datos existentes antes de importar? (s/N): ', (respuesta) => {
      readline.close();
      
      const borrarDatos = respuesta.toLowerCase() === 's';
      
      db.serialize(() => {
        if (borrarDatos) {
          console.log('🗑️  Borrando datos existentes...\n');
          db.run('DELETE FROM empresas', (err) => {
            if (err) {
              console.error('Error al borrar datos:', err);
              return;
            }
            insertarEmpresas();
          });
        } else {
          console.log('➕ Añadiendo empresas a los datos existentes...\n');
          insertarEmpresas();
        }
      });
    });

    function insertarEmpresas() {
      const stmt = db.prepare(`
        INSERT INTO empresas 
        (sector, nombre_empresa, comarca, correo_electronico, telefono, persona_contacto, cargo, pagina_web, dinamizador) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let insertadas = 0;
      let errores = 0;

      empresas.forEach((empresa, index) => {
        stmt.run(
          empresa.sector,
          empresa.nombre_empresa,
          empresa.comarca,
          empresa.correo_electronico,
          empresa.telefono,
          empresa.persona_contacto,
          empresa.cargo,
          empresa.pagina_web,
          empresa.dinamizador,
          (err) => {
            if (err) {
              console.error(`❌ Error en línea ${index + 1}:`, err.message);
              errores++;
            } else {
              insertadas++;
              if (insertadas % 100 === 0) {
                console.log(`   ${insertadas} empresas importadas...`);
              }
            }

            if (insertadas + errores === empresas.length) {
              finalizarImportacion(insertadas, errores);
            }
          }
        );
      });

      stmt.finalize();
    }

    function finalizarImportacion(insertadas, errores) {
      console.log(`\n${'='.repeat(50)}`);
      console.log('📊 RESUMEN DE IMPORTACIÓN');
      console.log('='.repeat(50));
      console.log(`✅ Empresas importadas: ${insertadas}`);
      if (errores > 0) {
        console.log(`❌ Errores: ${errores}`);
      }
      console.log('='.repeat(50) + '\n');

      db.close((err) => {
        if (err) {
          console.error('Error al cerrar la base de datos:', err);
        } else {
          console.log('✅ Base de datos actualizada correctamente\n');
        }
      });
    }
  })
  .on('error', (error) => {
    console.error('❌ Error al leer el archivo CSV:', error);
    db.close();
  });