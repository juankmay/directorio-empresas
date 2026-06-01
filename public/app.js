// Estado de la aplicación
const estado = {
  paginaActual: 1,
  totalPaginas: 1,
  busqueda: '',
  filtros: {
    sector: '',
    comarca: '',
    dinamizador: ''
  },
  empresaEditando: null
};

// Elementos del DOM
const elementos = {
  // Vistas
  vistaListado: document.getElementById('vistaListado'),
  vistaDetalle: document.getElementById('vistaDetalle'),
  vistaFormulario: document.getElementById('vistaFormulario'),
  
  // Búsqueda y filtros
  searchInput: document.getElementById('searchInput'),
  filtroSector: document.getElementById('filtroSector'),
  filtroComarca: document.getElementById('filtroComarca'),
  filtroDinamizador: document.getElementById('filtroDinamizador'),
  
  // Tabla
  tablaEmpresas: document.getElementById('tablaEmpresas'),
  resultadosInfo: document.getElementById('resultadosInfo'),
  
  // Paginación
  btnAnterior: document.getElementById('btnAnterior'),
  btnSiguiente: document.getElementById('btnSiguiente'),
  infoPagina: document.getElementById('infoPagina'),
  
  // Botones principales
  btnNuevaEmpresa: document.getElementById('btnNuevaEmpresa'),
  btnExportarCSV: document.getElementById('btnExportarCSV'),
  
  // Formulario
  formularioEmpresa: document.getElementById('formularioEmpresa'),
  tituloFormulario: document.getElementById('tituloFormulario'),
  btnVolverFormulario: document.getElementById('btnVolverFormulario'),
  btnCancelarFormulario: document.getElementById('btnCancelarFormulario'),
  
  // Detalle
  btnVolverDetalle: document.getElementById('btnVolverDetalle'),
  detalleNombreEmpresa: document.getElementById('detalleNombreEmpresa'),
  detalleContenido: document.getElementById('detalleContenido'),
  btnEditarDetalle: document.getElementById('btnEditarDetalle'),
  btnEliminarDetalle: document.getElementById('btnEliminarDetalle'),
  
  // Modal
  modalConfirmacion: document.getElementById('modalConfirmacion'),
  modalTitulo: document.getElementById('modalTitulo'),
  modalMensaje: document.getElementById('modalMensaje'),
  btnConfirmar: document.getElementById('btnConfirmar'),
  btnCancelarModal: document.getElementById('btnCancelarModal')
};

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', () => {
  inicializarEventos();
  cargarFiltros();
  cargarEmpresas();
});

// Configurar event listeners
function inicializarEventos() {
  // Búsqueda en tiempo real
  elementos.searchInput.addEventListener('input', debounce(() => {
    estado.busqueda = elementos.searchInput.value;
    estado.paginaActual = 1;
    cargarEmpresas();
  }, 300));

  // Filtros
  elementos.filtroSector.addEventListener('change', () => {
    estado.filtros.sector = elementos.filtroSector.value;
    estado.paginaActual = 1;
    cargarEmpresas();
  });

  elementos.filtroComarca.addEventListener('change', () => {
    estado.filtros.comarca = elementos.filtroComarca.value;
    estado.paginaActual = 1;
    cargarEmpresas();
  });

  elementos.filtroDinamizador.addEventListener('change', () => {
    estado.filtros.dinamizador = elementos.filtroDinamizador.value;
    estado.paginaActual = 1;
    cargarEmpresas();
  });

  // Paginación
  elementos.btnAnterior.addEventListener('click', () => {
    if (estado.paginaActual > 1) {
      estado.paginaActual--;
      cargarEmpresas();
    }
  });

  elementos.btnSiguiente.addEventListener('click', () => {
    if (estado.paginaActual < estado.totalPaginas) {
      estado.paginaActual++;
      cargarEmpresas();
    }
  });

  // Botones principales
  elementos.btnNuevaEmpresa.addEventListener('click', () => mostrarFormulario());
  elementos.btnExportarCSV.addEventListener('click', exportarCSV);

  // Formulario
  elementos.formularioEmpresa.addEventListener('submit', guardarEmpresa);
  elementos.btnVolverFormulario.addEventListener('click', () => mostrarVista('listado'));
  elementos.btnCancelarFormulario.addEventListener('click', () => mostrarVista('listado'));

  // Detalle
  elementos.btnVolverDetalle.addEventListener('click', () => mostrarVista('listado'));
  elementos.btnEditarDetalle.addEventListener('click', () => {
    mostrarFormulario(estado.empresaEditando);
  });
  elementos.btnEliminarDetalle.addEventListener('click', () => {
    mostrarModal(
      '¿Eliminar empresa?',
      `¿Estás seguro de que deseas eliminar "${estado.empresaEditando.nombre_empresa}"? Esta acción no se puede deshacer.`,
      () => eliminarEmpresa(estado.empresaEditando.id)
    );
  });

  // Modal
  elementos.btnCancelarModal.addEventListener('click', cerrarModal);
}

// Cargar valores para filtros
async function cargarFiltros() {
  try {
    const response = await fetch('/api/filtros');
    const filtros = await response.json();

    // Llenar select de sectores
    filtros.sectores.forEach(sector => {
      const option = document.createElement('option');
      option.value = sector;
      option.textContent = sector;
      elementos.filtroSector.appendChild(option);
    });

    // Llenar select de comarcas
    filtros.comarcas.forEach(comarca => {
      const option = document.createElement('option');
      option.value = comarca;
      option.textContent = comarca;
      elementos.filtroComarca.appendChild(option);
    });

    // Llenar select de dinamizadores
    filtros.dinamizadores.forEach(dinamizador => {
      const option = document.createElement('option');
      option.value = dinamizador;
      option.textContent = dinamizador;
      elementos.filtroDinamizador.appendChild(option);
    });

    // Llenar datalists para autocompletado en formulario
    const listaSectores = document.getElementById('listaSectores');
    const listaComarcas = document.getElementById('listaComarcas');
    const listaDinamizadores = document.getElementById('listaDinamizadores');

    filtros.sectores.forEach(sector => {
      const option = document.createElement('option');
      option.value = sector;
      listaSectores.appendChild(option);
    });

    filtros.comarcas.forEach(comarca => {
      const option = document.createElement('option');
      option.value = comarca;
      listaComarcas.appendChild(option);
    });

    filtros.dinamizadores.forEach(dinamizador => {
      const option = document.createElement('option');
      option.value = dinamizador;
      listaDinamizadores.appendChild(option);
    });

  } catch (error) {
    console.error('Error al cargar filtros:', error);
    mostrarNotificacion('Error al cargar filtros', 'error');
  }
}

// Cargar empresas con paginación y filtros
async function cargarEmpresas() {
  try {
    const params = new URLSearchParams({
      page: estado.paginaActual,
      limit: 50,
      search: estado.busqueda,
      sector: estado.filtros.sector,
      comarca: estado.filtros.comarca,
      dinamizador: estado.filtros.dinamizador
    });

    const response = await fetch(`/api/empresas?${params}`);
    const data = await response.json();

    estado.totalPaginas = data.totalPages;
    renderizarTabla(data.empresas);
    actualizarPaginacion(data);
    elementos.resultadosInfo.textContent = `${data.total} empresas encontradas`;

  } catch (error) {
    console.error('Error al cargar empresas:', error);
    mostrarNotificacion('Error al cargar empresas', 'error');
  }
}

// Renderizar tabla de empresas
function renderizarTabla(empresas) {
  elementos.tablaEmpresas.innerHTML = '';

  if (empresas.length === 0) {
    elementos.tablaEmpresas.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-gray-500">
          No se encontraron empresas
        </td>
      </tr>
    `;
    return;
  }

  empresas.forEach(empresa => {
    const fila = document.createElement('tr');
    fila.className = 'border-b hover:bg-gray-50 cursor-pointer transition';
    fila.innerHTML = `
      <td class="px-4 py-3">
        <div class="font-semibold text-gray-900">${empresa.nombre_empresa || '-'}</div>
        ${empresa.persona_contacto ? `<div class="text-sm text-gray-600">${empresa.persona_contacto}</div>` : ''}
      </td>
      <td class="px-4 py-3 text-gray-700">${empresa.sector || '-'}</td>
      <td class="px-4 py-3 text-gray-700">${empresa.comarca || '-'}</td>
      <td class="px-4 py-3">
        ${empresa.correo_electronico ? `<div class="text-sm text-blue-600">${empresa.correo_electronico}</div>` : ''}
        ${empresa.telefono ? `<div class="text-sm text-gray-600">${empresa.telefono}</div>` : ''}
      </td>
      <td class="px-4 py-3 text-gray-700">${empresa.dinamizador || '-'}</td>
      <td class="px-4 py-3 text-center">
        <button 
          onclick="verDetalle(${empresa.id})" 
          class="text-blue-600 hover:text-blue-800 font-semibold text-sm"
        >
          Ver detalle
        </button>
      </td>
    `;
    
    elementos.tablaEmpresas.appendChild(fila);
  });
}

// Actualizar controles de paginación
function actualizarPaginacion(data) {
  elementos.infoPagina.textContent = `Página ${data.page} de ${data.totalPages}`;
  elementos.btnAnterior.disabled = data.page === 1;
  elementos.btnSiguiente.disabled = data.page === data.totalPages;
}

// Ver detalle de empresa
async function verDetalle(id) {
  try {
    const response = await fetch(`/api/empresas/${id}`);
    const empresa = await response.json();
    
    estado.empresaEditando = empresa;
    elementos.detalleNombreEmpresa.textContent = empresa.nombre_empresa;
    
    elementos.detalleContenido.innerHTML = `
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Sector</label>
        <p class="text-gray-900">${empresa.sector || '-'}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Comarca</label>
        <p class="text-gray-900">${empresa.comarca || '-'}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Correo Electrónico</label>
        <p class="text-gray-900">
          ${empresa.correo_electronico 
            ? `<a href="mailto:${empresa.correo_electronico}" class="text-blue-600 hover:underline">${empresa.correo_electronico}</a>` 
            : '-'}
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Teléfono</label>
        <p class="text-gray-900">
          ${empresa.telefono 
            ? `<a href="tel:${empresa.telefono}" class="text-blue-600 hover:underline">${empresa.telefono}</a>` 
            : '-'}
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Persona de Contacto</label>
        <p class="text-gray-900">${empresa.persona_contacto || '-'}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Cargo</label>
        <p class="text-gray-900">${empresa.cargo || '-'}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Página Web</label>
        <p class="text-gray-900">
          ${empresa.pagina_web 
            ? `<a href="${empresa.pagina_web}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${empresa.pagina_web}</a>` 
            : '-'}
        </p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-500 mb-1">Dinamizador</label>
        <p class="text-gray-900">${empresa.dinamizador || '-'}</p>
      </div>
    `;
    
    mostrarVista('detalle');
    
  } catch (error) {
    console.error('Error al cargar detalle:', error);
    mostrarNotificacion('Error al cargar detalle de la empresa', 'error');
  }
}

// Mostrar formulario (crear o editar)
function mostrarFormulario(empresa = null) {
  estado.empresaEditando = empresa;
  
  if (empresa) {
    elementos.tituloFormulario.textContent = 'Editar Empresa';
    document.getElementById('inputNombreEmpresa').value = empresa.nombre_empresa || '';
    document.getElementById('inputSector').value = empresa.sector || '';
    document.getElementById('inputComarca').value = empresa.comarca || '';
    document.getElementById('inputCorreo').value = empresa.correo_electronico || '';
    document.getElementById('inputTelefono').value = empresa.telefono || '';
    document.getElementById('inputPersonaContacto').value = empresa.persona_contacto || '';
    document.getElementById('inputCargo').value = empresa.cargo || '';
    document.getElementById('inputPaginaWeb').value = empresa.pagina_web || '';
    document.getElementById('inputDinamizador').value = empresa.dinamizador || '';
  } else {
    elementos.tituloFormulario.textContent = 'Nueva Empresa';
    elementos.formularioEmpresa.reset();
  }
  
  mostrarVista('formulario');
}

// Guardar empresa (crear o actualizar)
async function guardarEmpresa(e) {
  e.preventDefault();
  
  const empresaData = {
    nombre_empresa: document.getElementById('inputNombreEmpresa').value,
    sector: document.getElementById('inputSector').value,
    comarca: document.getElementById('inputComarca').value,
    correo_electronico: document.getElementById('inputCorreo').value,
    telefono: document.getElementById('inputTelefono').value,
    persona_contacto: document.getElementById('inputPersonaContacto').value,
    cargo: document.getElementById('inputCargo').value,
    pagina_web: document.getElementById('inputPaginaWeb').value,
    dinamizador: document.getElementById('inputDinamizador').value
  };

  const confirmar = await confirmarAccion(
    estado.empresaEditando ? 'Confirmar cambios' : 'Confirmar creación',
    `¿Deseas ${estado.empresaEditando ? 'guardar los cambios' : 'crear esta empresa'}?`
  );
  
  if (!confirmar) return;

  try {
    const url = estado.empresaEditando 
      ? `/api/empresas/${estado.empresaEditando.id}`
      : '/api/empresas';
    
    const metodo = estado.empresaEditando ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(empresaData)
    });

    if (response.ok) {
      mostrarNotificacion(
        estado.empresaEditando ? 'Empresa actualizada correctamente' : 'Empresa creada correctamente',
        'success'
      );
      mostrarVista('listado');
      cargarEmpresas();
      cargarFiltros();
    } else {
      const error = await response.json();
      mostrarNotificacion(error.error || 'Error al guardar empresa', 'error');
    }
    
  } catch (error) {
    console.error('Error al guardar empresa:', error);
    mostrarNotificacion('Error al guardar empresa', 'error');
  }
}

// Eliminar empresa
async function eliminarEmpresa(id) {
  try {
    const response = await fetch(`/api/empresas/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      mostrarNotificacion('Empresa eliminada correctamente', 'success');
      mostrarVista('listado');
      cargarEmpresas();
      cargarFiltros();
    } else {
      const error = await response.json();
      mostrarNotificacion(error.error || 'Error al eliminar empresa', 'error');
    }
    
  } catch (error) {
    console.error('Error al eliminar empresa:', error);
    mostrarNotificacion('Error al eliminar empresa', 'error');
  }
  
  cerrarModal();
}

// Exportar a CSV
async function exportarCSV() {
  try {
    const params = new URLSearchParams({
      page: 1,
      limit: 10000,
      search: estado.busqueda,
      sector: estado.filtros.sector,
      comarca: estado.filtros.comarca,
      dinamizador: estado.filtros.dinamizador
    });

    const response = await fetch(`/api/empresas?${params}`);
    const data = await response.json();
    
    const empresas = data.empresas;
    
    if (empresas.length === 0) {
      mostrarNotificacion('No hay datos para exportar', 'error');
      return;
    }

    const headers = ['ID', 'Sector', 'Nombre Empresa', 'Comarca', 'Correo Electrónico', 'Teléfono', 'Persona Contacto', 'Cargo', 'Página Web', 'Dinamizador'];
    
    let csv = headers.join(',') + '\n';
    
    empresas.forEach(emp => {
      const fila = [
        emp.id,
        formatearCampoCSV(emp.sector),
        formatearCampoCSV(emp.nombre_empresa),
        formatearCampoCSV(emp.comarca),
        formatearCampoCSV(emp.correo_electronico),
        formatearCampoCSV(emp.telefono),
        formatearCampoCSV(emp.persona_contacto),
        formatearCampoCSV(emp.cargo),
        formatearCampoCSV(emp.pagina_web),
        formatearCampoCSV(emp.dinamizador)
      ];
      csv += fila.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `empresas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarNotificacion('CSV exportado correctamente', 'success');
    
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    mostrarNotificacion('Error al exportar CSV', 'error');
  }
}

// Formatear campo para CSV (escapar comillas y comas)
function formatearCampoCSV(valor) {
  if (!valor) return '';
  const valorStr = String(valor);
  if (valorStr.includes(',') || valorStr.includes('"') || valorStr.includes('\n')) {
    return '"' + valorStr.replace(/"/g, '""') + '"';
  }
  return valorStr;
}

// Controlar vistas
function mostrarVista(vista) {
  elementos.vistaListado.classList.add('hidden');
  elementos.vistaDetalle.classList.add('hidden');
  elementos.vistaFormulario.classList.add('hidden');

  switch (vista) {
    case 'listado':
      elementos.vistaListado.classList.remove('hidden');
      break;
    case 'detalle':
      elementos.vistaDetalle.classList.remove('hidden');
      break;
    case 'formulario':
      elementos.vistaFormulario.classList.remove('hidden');
      break;
  }
}

// Modal de confirmación
function mostrarModal(titulo, mensaje, onConfirmar) {
  elementos.modalTitulo.textContent = titulo;
  elementos.modalMensaje.textContent = mensaje;
  elementos.modalConfirmacion.classList.remove('hidden');
  
  elementos.btnConfirmar.onclick = () => {
    onConfirmar();
  };
}

function cerrarModal() {
  elementos.modalConfirmacion.classList.add('hidden');
}

// Confirmar acción (Promise)
function confirmarAccion(titulo, mensaje) {
  return new Promise((resolve) => {
    elementos.modalTitulo.textContent = titulo;
    elementos.modalMensaje.textContent = mensaje;
    elementos.modalConfirmacion.classList.remove('hidden');
    
    const confirmar = () => {
      elementos.modalConfirmacion.classList.add('hidden');
      limpiarEventos();
      resolve(true);
    };
    
    const cancelar = () => {
      elementos.modalConfirmacion.classList.add('hidden');
      limpiarEventos();
      resolve(false);
    };
    
    const limpiarEventos = () => {
      elementos.btnConfirmar.removeEventListener('click', confirmar);
      elementos.btnCancelarModal.removeEventListener('click', cancelar);
    };
    
    elementos.btnConfirmar.addEventListener('click', confirmar);
    elementos.btnCancelarModal.addEventListener('click', cancelar);
  });
}

// Sistema de notificaciones toast
function mostrarNotificacion(mensaje, tipo = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${tipo}`;
  
  const icono = tipo === 'success' ? '✓' : tipo === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `
    <span style="font-size: 20px;">${icono}</span>
    <span style="flex: 1;">${mensaje}</span>
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

// Utilidad: debounce
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Hacer verDetalle accesible desde HTML
window.verDetalle = verDetalle;