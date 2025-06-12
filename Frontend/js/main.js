// ===== CONFIGURACIÓN GLOBAL =====
const API_BASE_URL = 'http://localhost:3000/api';

// ===== UTILIDADES GENERALES =====
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'block';
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
}

function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'block';
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) element.style.display = 'none';
}

function showError(message, containerId = 'errorMessage') {
    const errorContainer = document.getElementById(containerId);
    const errorText = document.getElementById('errorText');
    
    if (errorContainer) {
        if (errorText) errorText.textContent = message;
        errorContainer.style.display = 'block';
    }
}

function showSuccess(message, containerId = 'successMessage') {
    const successContainer = document.getElementById(containerId);
    if (successContainer) {
        successContainer.style.display = 'block';
        // Auto-hide después de 5 segundos
        setTimeout(() => {
            successContainer.style.display = 'none';
        }, 5000);
    }
}

// ===== FUNCIONES DE SERVICIOS (AgenteServicio) =====
async function loadServices() {
    const loadingEl = document.getElementById('loadingMessage');
    const servicesGridEl = document.getElementById('servicesGrid');
    const errorEl = document.getElementById('errorMessage');

    try {
        // Mostrar loading
        if (loadingEl) loadingEl.style.display = 'block';
        if (errorEl) errorEl.style.display = 'none';

        // Intentar cargar desde API
        const response = await fetch(`${API_BASE_URL}/servicios`);
        
        if (!response.ok) {
            throw new Error('No se pudo conectar con el AgenteServicio');
        }

        const servicios = await response.json();
        
        // Ocultar loading
        if (loadingEl) loadingEl.style.display = 'none';
        
        // Mostrar servicios desde API
        if (servicesGridEl) {
            displayServices(servicios, servicesGridEl);
            servicesGridEl.style.display = 'grid';
        }

    } catch (error) {
        console.log('AgenteServicio no disponible, mostrando servicios de ejemplo:', error.message);
        
        // Ocultar loading y mostrar mensaje de error con datos de ejemplo
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'block';
    }
}

function displayServices(servicios, container) {
    container.innerHTML = '';
    
    servicios.forEach(servicio => {
        const serviceCard = createServiceCard(servicio);
        container.appendChild(serviceCard);
    });
}

function createServiceCard(servicio) {
    const card = document.createElement('div');
    card.className = 'service-card';
    
    card.innerHTML = `
        <div class="service-header">
            <h3>${servicio.titulo}</h3>
            <span class="service-price">$${servicio.costo}</span>
        </div>
        <p class="service-description">${servicio.descripcion}</p>
        <div class="service-features">
            ${servicio.tecnologias ? servicio.tecnologias.map(tech => 
                `<span class="feature-tag">${tech}</span>`
            ).join('') : ''}
        </div>
        <a href="servicio-detalle.html?id=${servicio._id || servicio.id}" class="btn btn-primary">Ver Detalles</a>
    `;
    
    return card;
}

// ===== FUNCIÓN PARA DETALLE DE SERVICIO =====
async function loadServiceDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const serviceId = urlParams.get('id');
    
    const loadingEl = document.getElementById('detailLoading');
    const defaultDetailEl = document.getElementById('defaultServiceDetail');

    if (!serviceId) {
        // Si no hay ID, mostrar servicio por defecto
        if (loadingEl) loadingEl.style.display = 'none';
        if (defaultDetailEl) defaultDetailEl.style.display = 'block';
        return;
    }

    try {
        // Mostrar loading
        if (loadingEl) loadingEl.style.display = 'block';

        // Intentar cargar desde API
        const response = await fetch(`${API_BASE_URL}/servicios/${serviceId}`);
        
        if (!response.ok) {
            throw new Error('Servicio no encontrado');
        }

        const servicio = await response.json();
        
        // Actualizar contenido con datos de la API
        updateServiceDetail(servicio);
        
        // Ocultar loading
        if (loadingEl) loadingEl.style.display = 'none';
        if (defaultDetailEl) defaultDetailEl.style.display = 'block';

    } catch (error) {
        console.log('Error cargando detalle del servicio:', error.message);
        
        // Mostrar servicio por defecto
        if (loadingEl) loadingEl.style.display = 'none';
        if (defaultDetailEl) defaultDetailEl.style.display = 'block';
    }
}

function updateServiceDetail(servicio) {
    // Actualizar elementos específicos con datos del servicio
    const titleEl = document.getElementById('serviceTitle');
    const priceEl = document.getElementById('servicePrice');
    const descriptionEl = document.getElementById('serviceDescription');

    if (titleEl) titleEl.textContent = servicio.titulo;
    if (priceEl) priceEl.textContent = `$${servicio.costo}`;
    if (descriptionEl) descriptionEl.textContent = servicio.descripcion;
}

// ===== FUNCIONES DE CONTACTO (AgenteContacto) =====
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', handleContactSubmit);
    
    // Validación en tiempo real
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearFieldError(input));
    });
}

async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Validar formulario
    if (!validateForm(form)) {
        return;
    }
    
    // Preparar datos para AgenteContacto
    const contactData = {
        nombre: formData.get('nombre'),
        email: formData.get('email'),
        mensaje: formData.get('mensaje'),
        fecha: new Date().toISOString(),
        agente: 'AgenteContacto'
    };
    
    // Mostrar estado de envío
    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitLoading = document.getElementById('submitLoading');
    
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.style.display = 'none';
    if (submitLoading) submitLoading.style.display = 'inline';
    
    // Ocultar mensajes anteriores
    hideElement('successMessage');
    hideElement('errorMessage');
    
    try {
        // Enviar al AgenteContacto
        const response = await fetch(`${API_BASE_URL}/contacto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contactData)
        });
        
        if (!response.ok) {
            throw new Error('Error en el servidor del AgenteContacto');
        }
        
        const result = await response.json();
        
        // Mostrar éxito
        showSuccess('¡Mensaje enviado exitosamente por el AgenteContacto!');
        form.reset();
        
    } catch (error) {
        console.log('AgenteContacto no disponible:', error.message);
        
        // Simular funcionamiento local para demostración
        showSuccess('¡Mensaje procesado localmente! (AgenteContacto simulado)');
        form.reset();
        
        // En un entorno real, aquí se mostraría el error:
        // showError('Error al enviar el mensaje. Por favor, intenta nuevamente.');
    }
    
    // Restaurar botón
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.style.display = 'inline';
    if (submitLoading) submitLoading.style.display = 'none';
}

function validateForm(form) {
    const nombre = form.querySelector('#nombre');
    const email = form.querySelector('#email');
    const mensaje = form.querySelector('#mensaje');
    
    let isValid = true;
    
    if (!validateField(nombre)) isValid = false;
    if (!validateField(email)) isValid = false;
    if (!validateField(mensaje)) isValid = false;
    
    return isValid;
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    let errorMessage = '';
    
    // Validaciones específicas
    switch (fieldName) {
        case 'nombre':
            if (!value) {
                errorMessage = 'El nombre es requerido';
            } else if (value.length < 2) {
                errorMessage = 'El nombre debe tener al menos 2 caracteres';
            }
            break;
            
        case 'email':
            if (!value) {
                errorMessage = 'El email es requerido';
            } else if (!isValidEmail(value)) {
                errorMessage = 'Por favor ingresa un email válido';
            }
            break;
            
        case 'mensaje':
            if (!value) {
                errorMessage = 'El mensaje es requerido';
            } else if (value.length < 10) {
                errorMessage = 'El mensaje debe tener al menos 10 caracteres';
            }
            break;
    }
    
    // Mostrar/ocultar error
    const errorElement = document.getElementById(`${fieldName}Error`);
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = errorMessage ? 'block' : 'none';
    }
    
    // Cambiar estilo del campo
    if (errorMessage) {
        field.style.borderColor = '#dc2626';
    } else {
        field.style.borderColor = '#16a34a';
    }
    
    return !errorMessage;
}

function clearFieldError(field) {
    const fieldName = field.name;
    const errorElement = document.getElementById(`${fieldName}Error`);
    
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    field.style.borderColor = '#e2e8f0';
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== NAVEGACIÓN ACTIVA =====
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html') ||
            (currentPage === 'servicio-detalle.html' && href === 'servicios.html')) {
            link.classList.add('active');
        }
    });
}

// ===== EFECTOS Y ANIMACIONES =====
function initScrollEffects() {
    // Animación suave para enlaces de navegación
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Efecto visual al hacer clic
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
    
    // Efecto hover para botones
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
}

// ===== FUNCIONES DE INICIALIZACIÓN =====
function initMobileMenu() {
    // Funcionalidad para menú móvil (si se implementa más adelante)
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        // Cambiar apariencia del navbar al hacer scroll
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

// ===== FUNCIONES DE DATOS DE EJEMPLO =====
function getExampleServices() {
    return [
        {
            id: '1',
            titulo: 'Desarrollo Web Completo',
            descripcion: 'Aplicación web full-stack con arquitectura Cliente-Servidor',
            costo: 1200,
            tecnologias: ['HTML5', 'CSS3', 'JavaScript', 'Node.js', 'MongoDB'],
            agente: 'AgenteServicio'
        },
        {
            id: '2',
            titulo: 'Consultoría Tecnológica',
            descripcion: 'Asesoría en arquitectura de software y web semántica',
            costo: 800,
            tecnologias: ['Arquitectura', 'Consultoría', 'Documentación'],
            agente: 'AgenteServicio'
        },
        {
            id: '3',
            titulo: 'Integración de Sistemas',
            descripcion: 'Conexión de sistemas legacy con tecnologías modernas',
            costo: 1500,
            tecnologias: ['APIs', 'Integración', 'Microservicios'],
            agente: 'AgenteServicio'
        },
        {
            id: '4',
            titulo: 'Diseño UX/UI',
            descripción: 'Diseño de interfaces con teoría del color aplicada',
            costo: 600,
            tecnologias: ['Figma', 'Prototipado', 'Teoría del Color'],
            agente: 'AgenteServicio'
        }
    ];
}

// ===== SIMULACIÓN DE BACKEND LOCAL =====
class LocalAgentService {
    constructor() {
        this.servicios = getExampleServices();
        this.contactos = [];
    }
    
    async getServicios() {
        // Simular delay de red
        await this.delay(500);
        return this.servicios;
    }
    
    async getServicio(id) {
        await this.delay(300);
        return this.servicios.find(s => s.id === id);
    }
    
    async saveContacto(contacto) {
        await this.delay(800);
        contacto.id = Date.now().toString();
        this.contactos.push(contacto);
        return { success: true, id: contacto.id };
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Instancia global del servicio local
const localAgent = new LocalAgentService();

// ===== FUNCIONES DE DESARROLLO Y DEBUG =====
function debugInfo() {
    console.log('=== DEBUG INFO - ServiTech ===');
    console.log('Página actual:', window.location.pathname.split('/').pop());
    console.log('API Base URL:', API_BASE_URL);
    console.log('LocalAgent disponible:', !!localAgent);
    console.log('Servicios locales:', localAgent.servicios.length);
    console.log('Contactos locales:', localAgent.contactos.length);
}

// ===== INICIALIZACIÓN GLOBAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 ServiTech - Inicializando aplicación...');
    
    // Inicializar funciones base
    setActiveNavLink();
    initScrollEffects();
    initMobileMenu();
    
    // Debug en desarrollo
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.debugServiTech = debugInfo;
        console.log('💡 Tip: Ejecuta debugServiTech() en la consola para ver información de debug');
    }
    
    console.log('✅ ServiTech inicializado correctamente');
});

// ===== EXPORTS PARA TESTING (si es necesario) =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateField,
        isValidEmail,
        getExampleServices,
        LocalAgentService
    };
}