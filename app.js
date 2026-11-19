
const API_URL = "https://6aff1ebb3a0e70bc8d54a71a.mockapi.io";
const RUTA = `${API_URL}/Armas`;

const USUARIO_ADMIN = "admin";
const PASSWORD_ADMIN = "armas2026";

let productos = [];

/* ============ NAVEGACIÓN ENTRE VISTAS ============ */

async function cargarDatos() {
    try {
        const r = await fetch(RUTA);
        if (!r.ok) throw new Error();
        productos = await r.json();
        return true;
    } catch (e) {
        console.error("Error al cargar datos:", e);
        return false;
    }
}

async function irATienda() {
    document.getElementById('vistaPublica').classList.remove('d-none');
    document.getElementById('vistaAdmin').classList.add('d-none');

    const ok = await cargarDatos();
    if (ok) {
        llenarFiltroCategorias();
        pintarCatalogo();
    } else {
        const aviso = document.getElementById('aviso');
        aviso.textContent = "⚠️ No se pudo conectar con MockAPI.";
        aviso.classList.remove('d-none');
    }
}

function irAAdmin() {
    document.getElementById('vistaPublica').classList.add('d-none');
    document.getElementById('vistaAdmin').classList.remove('d-none');
    if (sessionStorage.getItem('sesionAdmin') === 'ok') {
        mostrarPanel();
    } else {
        document.getElementById('panelLogin').classList.remove('d-none');
        document.getElementById('panelAdmin').classList.add('d-none');
    }
}

async function init() {
    const ok = await cargarDatos();
    if (ok) {
        llenarFiltroCategorias();
        pintarCatalogo();
    } else {
        const aviso = document.getElementById('aviso');
        aviso.textContent = "⚠️ No se pudo conectar con MockAPI. Revisa la URL en app.js";
        aviso.classList.remove('d-none');
    }
}

function llenarFiltroCategorias() {
    const sel = document.getElementById('filtroCat');
    sel.innerHTML = '<option value="todas">Todas las categorías</option>';
    [...new Set(productos.map(p => p.categoria))].forEach(c => {
        sel.innerHTML += `<option value="${c}">${c}</option>`;
    });
}

function pintarCatalogo() {
    const cat = document.getElementById('filtroCat').value;
    const txt = document.getElementById('buscador').value.toLowerCase();
    const grid = document.getElementById('grid');
    grid.innerHTML = '';

    const lista = productos.filter(p =>
        (cat === 'todas' || p.categoria === cat) &&
        p.nombre.toLowerCase().includes(txt)
    );

    if (!lista.length) {
        grid.innerHTML = '<div class="col-12 text-center text-muted">No hay productos.</div>';
        return;
    }

    lista.forEach(p => {
        const agotado = p.stock <= 0;
        grid.innerHTML += `
      <div class="col">
        <div class="card h-100 shadow-sm">
          <img src="${p.imagen}" class="card-img-top" alt="${p.nombre}"
               onerror="this.src='https://placehold.co/400x200?text=Sin+imagen'">
          <div class="card-body d-flex flex-column">
            <span class="badge bg-secondary align-self-start mb-2">${p.categoria}</span>
            <h5 class="card-title">${p.nombre}</h5>
            <p class="card-text text-muted small flex-grow-1">${p.descripcion}</p>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div>
                <h4 class="text-primary mb-0">$${Number(p.precio).toFixed(2)}</h4>
                <small class="${agotado ? 'text-danger fw-bold' : 'text-success fw-bold'}">
                  ${agotado ? '¡Agotado!' : p.stock + ' disponibles'}
                </small>
              </div>
              <button class="btn btn-success btn-sm" ${agotado ? 'disabled' : ''}
                      onclick="comprar('${p.id}')">
                ${agotado ? 'Agotado' : 'Comprar'}
              </button>
            </div>
          </div>
        </div>
      </div>`;
    });
}

async function comprar(id) {
    const p = productos.find(x => x.id == id);
    if (!p || p.stock <= 0) return;
    const nuevoStock = p.stock - 1;
    const r = await fetch(`${RUTA}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, stock: nuevoStock })
    });
    if (r.ok) {
        p.stock = nuevoStock;
        pintarCatalogo();
        alert(`✅ Compra registrada: ${p.nombre}\nStock restante: ${nuevoStock}`);
    } else {
        alert('❌ Error al actualizar el stock');
    }
}

function login(e) {
    e.preventDefault();
    const u = document.getElementById('usuario').value.trim();
    const p = document.getElementById('password').value;
    if (u === USUARIO_ADMIN && p === PASSWORD_ADMIN) {
        sessionStorage.setItem('sesionAdmin', 'ok');
        document.getElementById('msgLogin').textContent = '';
        mostrarPanel();
    } else {
        document.getElementById('msgLogin').textContent = '❌ Usuario o contraseña incorrectos';
    }
}

function logout() {
    sessionStorage.removeItem('sesionAdmin');
    location.reload();
}

async function mostrarPanel() {
    document.getElementById('panelLogin').classList.add('d-none');
    document.getElementById('panelAdmin').classList.remove('d-none');
    await cargarAdmin();
}

async function cargarAdmin() {
    const ok = await cargarDatos();
    if (ok) {
        document.getElementById('listaCat').innerHTML =
            [...new Set(productos.map(p => p.categoria))].map(c => `<option value="${c}">`).join('');
        pintarTabla();
    } else {
        alert("⚠️ No se pudieron cargar los datos del panel de administración.");
    }
}

function pintarTabla() {
    document.getElementById('tbody').innerHTML = productos.map(p => `
    <tr>
      <td>${p.nombre}</td>
      <td>${p.categoria}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td>${p.stock}</td>
      <td class="d-flex gap-1 flex-wrap">
        <button class="btn btn-sm btn-outline-info" onclick="verDetalles('${p.id}')" title="Ver detalles">
          👁️ 
        </button>
        <button class="btn btn-sm btn-outline-warning" onclick="editar('${p.id}')" title="Editar">
          ✏️
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="eliminar('${p.id}')" title="Eliminar">
          🗑️
        </button>
      </td>
    </tr>`).join('');
}

function verDetalles(id) {
    const p = productos.find(x => x.id == id);
    if (!p) return;

    const agotado = p.stock <= 0;

    document.getElementById('detNombre').textContent = p.nombre;
    document.getElementById('detCategoria').textContent = p.categoria;
    document.getElementById('detDescripcion').textContent = p.descripcion;
    document.getElementById('detPrecio').textContent = `$${Number(p.precio).toFixed(2)}`;
    document.getElementById('detStock').innerHTML = `
    <span class="${agotado ? 'text-danger fw-bold' : 'text-success fw-bold'}">
      ${agotado ? '¡Agotado!' : p.stock + ' unidades disponibles'}
    </span>`;
    document.getElementById('detImagen').src = p.imagen;
    document.getElementById('detImagen').onerror = function () {
        this.src = 'https://placehold.co/400x200?text=Sin+imagen';
    };

    const modal = new bootstrap.Modal(document.getElementById('modalDetalles'));
    modal.show();
}

async function guardarProducto(e) {
    e.preventDefault();
    const id = document.getElementById('id').value;
    const data = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(document.getElementById('precio').value),
        stock: parseInt(document.getElementById('stock').value),
        categoria: document.getElementById('categoria').value,
        imagen: document.getElementById('imagen').value || 'https://placehold.co/400x200?text=Sin+imagen'
    };

    const esEdicion = id !== '';
    const url = esEdicion ? `${RUTA}/${id}` : RUTA;

    const r = await fetch(url, {
        method: esEdicion ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (r.ok) {
        resetForm();
        await cargarAdmin();
    } else {
        alert('❌ Error al guardar');
    }
}

function editar(id) {
    const p = productos.find(x => x.id == id);
    document.getElementById('id').value = p.id;
    document.getElementById('nombre').value = p.nombre;
    document.getElementById('descripcion').value = p.descripcion;
    document.getElementById('precio').value = p.precio;
    document.getElementById('stock').value = p.stock;
    document.getElementById('categoria').value = p.categoria;
    document.getElementById('imagen').value = p.imagen;
    document.getElementById('btnGuardar').textContent = 'Actualizar';

    document.getElementById('formProd').scrollIntoView({ behavior: 'smooth' });
}

async function eliminar(id) {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;

    try {
        const r = await fetch(`${RUTA}/${id}`, {
            method: 'DELETE'
        });

        if (r.ok) {
            alert('✅ Producto eliminado correctamente');
            await cargarAdmin();
        } else {
            alert('❌ Error al eliminar el producto. Intenta nuevamente.');
        }
    } catch (e) {
        console.error('Error en eliminar:', e);
        alert('⚠️ No se pudo conectar con el servidor. Verifica tu conexión.');
    }
}

function resetForm() {
    document.getElementById('formProd').reset();
    document.getElementById('id').value = '';
    document.getElementById('btnGuardar').textContent = 'Agregar';
}

/*  ARRANQUE  */
init();