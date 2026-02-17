class Tarea {
    constructor(id, descripcion, estado = "pendiente", fechaCreacion = new Date(), fechaLimite = null) {
        this.id = id
        this.descripcion = descripcion
        this.estado = estado
        this.fechaCreacion = fechaCreacion
        this.fechaLimite = fechaLimite
    }
    cambiarEstado() {
        if (this.estado === "pendiente") {
            this.estado = "completada"
        } else {
            this.estado = "pendiente"
        }
    }
    toString() {
        const fechaFormateada = this.fechaCreacion.toLocaleString(`es-CL`)
        return `${this.id} ${this.descripcion} - ${this.estado} ${fechaFormateada}`
    }
}

class GestorTareas {
    constructor() {
        this.tareas = []
        this.ultimoId = 0
    }


    agregarTarea(descripcion, fechaLimite, estado = "pendiente") {
        this.ultimoId++
        const id = this.ultimoId
        const nuevaTarea = new Tarea(id, descripcion, estado, new Date(), fechaLimite)
        this.tareas.push(nuevaTarea)
        this.guardarEnLocalStorage()

    }

    agregarMultiplesTareas(...descripciones) {
        descripciones.forEach(descripcion => this.agregarTarea(descripcion))
    }

    eliminarTarea(id) {
        this.tareas = this.tareas.filter(tarea => tarea.id !== id)
        this.guardarEnLocalStorage()
    }

    cambiarEstadoTarea(id) {
        const tarea = this.tareas.find(tarea => tarea.id === id)
        if (tarea) {
            tarea.cambiarEstado()
        }
        this.guardarEnLocalStorage()
    }
    obtenerInfo() {
        const { tareas, ultimoId } = this
        return `Gestor: ${tareas.length} tarea/s, Último ID: ${ultimoId}`
    }

    obtenerTodasLasTareas() {
        return [...this.tareas]
    }

    guardarEnLocalStorage() {
        localStorage.setItem('tareas', JSON.stringify(this.tareas))
        localStorage.setItem('ultimoId', this.ultimoId)
    }

    cargarDesdeLocalStorage() {
        const tareasGuardadas = localStorage.getItem('tareas')

        if (tareasGuardadas) {
            const tareasParseadas = JSON.parse(tareasGuardadas)

            // reconstruir cada tarea con las fechas correctas de string a date
            this.tareas = tareasParseadas.map(tarea => {
                return new Tarea(
                    tarea.id,
                    tarea.descripcion,
                    tarea.estado,
                    new Date(tarea.fechaCreacion),
                    tarea.fechaLimite ? new Date(tarea.fechaLimite) : null
                )
            })
        }
        const idGuardado = localStorage.getItem('ultimoId')
        if (idGuardado) {
            this.ultimoId = parseInt(idGuardado)
        }
    }
}

//crear instancia del gestor
const gestor = new GestorTareas()
gestor.cargarDesdeLocalStorage()

//obtener referencias del DOM
const formulario = document.getElementById("formulario-tareas")
const inputTarea = document.getElementById("input-tarea")
const contadorCaracteres = document.getElementById("contador-caracteres")
contadorCaracteres.textContent = "Carácteres: 0"
const notificacion = document.getElementById("notificacion")
const inputFechaLimite = document.getElementById("input-fecha-limite")

//capturar el evento submit
formulario.addEventListener('submit', (evento) => {
    evento.preventDefault()

    const descripcion = inputTarea.value.trim()
    const valorFecha = inputFechaLimite.value
    const fechaLimite = valorFecha ? new Date(valorFecha) : null

    if (descripcion) {
        inputTarea.value = ''
        inputFechaLimite.value = ''
        contadorCaracteres.textContent = "Carácteres: 0"
        notificacion.textContent = "Agregando Tarea..."
        setTimeout(() => {
            notificacion.textContent = '¡Tarea Agregada exitosamente!'
            gestor.agregarTarea(descripcion, fechaLimite)
            mostrarTareas()
            setTimeout(() => {
                notificacion.textContent = ''
            }, 2000);
        }, 1000);
        console.log(gestor.tareas)
    }
})

inputTarea.addEventListener('keyup', () => {
    const conteoLetras = inputTarea.value.length
    contadorCaracteres.textContent = `Carácteres: ${conteoLetras}`
})

// funcion para mostrar en el DOM


function mostrarTareas() {
    const listaTareas = document.getElementById("lista-tareas")
    let html = ''
    gestor.tareas.forEach(tarea => {
        html += `<li class="task-list__item">
        <span>${tarea.descripcion} - ${tarea.estado} - ${calcularTiempoRestante(tarea.fechaLimite)}</span>
        <div>
            <button class="task-list__button task-list__button--delete" onclick="eliminarTareaDOM(${tarea.id})">Eliminar</button>
        <button class="task-list__button task-list__button--toggle" onclick="cambiarEstadoTareaDOM(${tarea.id})">Cambiar Estado</button>
            </div>
        </li>`
    });

    listaTareas.innerHTML = html

};

function eliminarTareaDOM(id) {
    gestor.eliminarTarea(id)
    mostrarTareas()
}

function cambiarEstadoTareaDOM(id) {
    gestor.cambiarEstadoTarea(id)
    mostrarTareas()
}

function calcularTiempoRestante(fechaLimite) {
    if (!fechaLimite) return "Sin fecha límite"

    const ahora = new Date()
    const diferencia = fechaLimite - ahora

    if (diferencia <= 0) {
        return "¡Tiempo agotado!"
    }

    // convertir las unidades de fecha
    const segundos = Math.floor(diferencia / 1000)
    const minutos = Math.floor(segundos / 60)
    const horas = Math.floor(minutos / 60)
    const dias = Math.floor(horas / 24)

    // que mostrar dependiendo de la fecha limite
    if (dias > 0) {
        return `Faltan ${dias} día${dias > 1 ? 's' : ''}`
    } else if (horas > 0) {
        return `Faltan ${horas} hora${horas > 1 ? 's' : ''}`
    } else if (minutos > 0) {
        return `Faltan ${minutos} minuto${minutos > 1 ? 's' : ''}`
    } else {
        return `Faltan ${segundos} segundo${segundos > 1 ? 's' : ''}`
    }
}

async function obtenerTareasAPI() {
    try {
        // 1. hacer la petición
        const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5')
        // 2. convertir a JSON
        const datos = await response.json()
        //3. recorrer y agregar tareas
        datos.forEach(tareaAPI => {
            const estado = tareaAPI.completed ? "completada" : "pendiente"
            gestor.agregarTarea(tareaAPI.title, null, estado)
        })
        // 4. actualizar vista
        mostrarTareas()
        console.log('Tareas importadas exitosamente desde la API')


    } catch (error) {
        console.error('Error al obtener tareas', error)
    }
}

// mostrar tareas al cargar la página
mostrarTareas()

//actualizar contadores cada segundo
setInterval(() => {
    mostrarTareas()
}, 1000);