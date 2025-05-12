// -----------------------------
// Funciones de LocalStorage
// -----------------------------

// Guardar datos en localStorage
function guardarEnStorage(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
}

// Cargar datos desde localStorage
function cargarDesdeStorage(clave) {
    const datos = localStorage.getItem(clave);
    return datos ? JSON.parse(datos) : [];
}

// -----------------------------
// Función para formatear fecha
// -----------------------------

function formatearFecha(fecha) {
    const f = new Date(fecha);
    return f.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// -----------------------------
// Función para mostrar alertas
// -----------------------------

function mostrarAlerta(mensaje, tipo = 'success') {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = mensaje;

    const contenedor = document.querySelector('.container') || document.body;
    contenedor.insertBefore(alerta, contenedor.firstChild);

    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// -----------------------------
// Inicializar estructuras de datos
// -----------------------------

function inicializarParqueadero() {
    if (!localStorage.getItem('parking_users')) {
        guardarEnStorage('parking_users', []);
    }
    if (!localStorage.getItem('parking_cells')) {
        guardarEnStorage('parking_cells', []);
    }
    if (!localStorage.getItem('parking_entries')) {
        guardarEnStorage('parking_entries', []);
    }
    if (!localStorage.getItem('parking_payments')) {
        guardarEnStorage('parking_payments', []);
    }
}

// -----------------------------
// Evento al cargar la página
// -----------------------------

document.addEventListener('DOMContentLoaded', inicializarParqueadero);
