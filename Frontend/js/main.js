// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api',
    TIMEOUTS: {
        API_REQUEST: 10000, // 10 segundos
        SUCCESS_MESSAGE: 5000, // 5 segundos
        BUTTON_EFFECT: 150
    },
    VALIDATION: {
        MIN_NAME_LENGTH: 2,
        MIN_MESSAGE_LENGTH: 10,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    STORAGE_KEYS: {
        SERVICES_CACHE: 'servitech_services_cache',
        FORM_DRAFT: 'servitech_form_draft'
    }
};

// ===== CLASE PRINCIPAL DE LA APLICACIÓN =====
class ServiTechApp {
    constructor() {
        this.localAgent = new LocalAgentService();
        this.cache = new Map();
        this.init();
    }

    init() {
        console.log('🚀 ServiTech - Inicializando aplicación...');
        
        // Verificar si DOM está listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupApp());
        } else {
            this.setupApp();
        }
    }

    setupApp() {
        this.setActiveNavLink();
        this.initScrollEffects();
        this.initMobileMenu();
        this.setupErrorHandling();
        
        // Debug en desarrollo
        if (this.isDevelopment()) {
            window.serviTechApp = this;
            window.debugServiTech = () => this.debugInfo();
            console.log('💡 Tip: Ejecuta debugServiTech() en la consola para ver información de debug');
        }
        
        console.log('✅ ServiTech inicializado correctamente');
    }

    isDevelopment() {
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.protocol === 'file:';
    }

    setupErrorHandling() {
        // Manejo global de errores no capturados
        window.addEventListener('error', (event) => {
            console.error('Error global capturado:', event.error);
            this.showNotification('Ha ocurrido un error inesperado', 'error');
        });

        // Manejo de promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa rechazada no manejada:', event.reason);
            event.preventDefault();
        });
    }

    // ===== MÉTODOS DE UTILIDAD MEJORADOS =====
    showNotification(message, type = 'info', duration = CONFIG.TIMEOUTS.SUCCESS_MESSAGE) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remove después del tiempo especificado
        const timeout = setTimeout(() => this.removeNotification(notification), duration);

        // Permitir cerrar manualmente
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeout);
            this.removeNotification(notification);
        });

        // Animar entrada
        requestAnimationFrame(() => {
            notification.classList.add('notification-show');
        });
    }

    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.classList.add('notification-hide');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '⚠️',
            info: 'ℹ️',
            warning: '⚡'
        };
        return icons[type] || icons.info;
    }

    // ===== MÉTODOS DE NAVEGACIÓN MEJORADOS =====
    setActiveNavLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (this.isCurrentPage(href, currentPage)) {
                link.classList.add('active');
            }
        });
    }

    isCurrentPage(href, currentPage) {
        return href === currentPage || 
               (currentPage === '' && href === 'index.html') ||
               (currentPage === 'servicio-detalle.html' && href === 'servicios.html');
    }

    // ===== EFECTOS Y ANIMACIONES MEJORADOS =====
    initScrollEffects() {
        // Throttle para mejor rendimiento
        const throttledScroll = this.throttle(() => {
            const navbar = document.querySelector('.navbar');
            if (navbar) {
                navbar.classList.toggle('scrolled', window.scrollY > 50);
            }
        }, 16); // ~60fps

        window.addEventListener('scroll', throttledScroll, { passive: true });

        // Efectos de botones mejorados
        this.initButtonEffects();
        this.initNavLinkEffects();
    }

    initButtonEffects() {
        const buttons = document.querySelectorAll('.btn');
        const config = CONFIG.TIMEOUTS.BUTTON_EFFECT;

        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.transition = 'transform 0.2s ease';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
            });

            button.addEventListener('mousedown', () => {
                button.style.transform = 'translateY(-1px) scale(0.98)';
            });

            button.addEventListener('mouseup', () => {
                button.style.transform = 'translateY(-2px)';
            });
        });
    }

    initNavLinkEffects() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.animateClick(link);
            });
        });
    }

    animateClick(element) {
        element.style.transform = 'scale(0.95)';
        element.style.transition = 'transform 0.15s ease';
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, CONFIG.TIMEOUTS.BUTTON_EFFECT);
    }

    initMobileMenu() {
        // Implementación básica de menú móvil
        const menuToggle = document.querySelector('.menu-toggle');
        const navbar = document.querySelector('.navbar');
        
        if (menuToggle && navbar) {
            menuToggle.addEventListener('click', () => {
                navbar.classList.toggle('menu-open');
            });
        }
    }

    // ===== UTILIDADES DE RENDIMIENTO =====
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // ===== GESTIÓN DE CACHÉ MEJORADA =====
    setCacheItem(key, data, ttl = 300000) { // 5 minutos por defecto
        const item = {
            data,
            timestamp: Date.now(),
            ttl
        };
        this.cache.set(key, item);
        
        // También guardar en localStorage si es posible
        try {
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
        }
    }

    getCacheItem(key) {
        let item = this.cache.get(key);
        
        // Si no está en memoria, intentar recuperar de localStorage
        if (!item) {
            try {
                const stored = localStorage.getItem(key);
                if (stored) {
                    item = JSON.parse(stored);
                    this.cache.set(key, item);
                }
            } catch (e) {
                console.warn('Error al leer desde localStorage:', e);
            }
        }
        
        // Verificar si el item ha expirado
        if (item && (Date.now() - item.timestamp) > item.ttl) {
            this.cache.delete(key);
            try {
                localStorage.removeItem(key);
            } catch (e) {
                console.warn('Error al limpiar localStorage:', e);
            }
            return null;
        }
        
        return item ? item.data : null;
    }

    debugInfo() {
        console.log('=== DEBUG INFO - ServiTech ===');
        console.log('Página actual:', window.location.pathname.split('/').pop());
        console.log('API Base URL:', CONFIG.API_BASE_URL);
        console.log('Cache size:', this.cache.size);
        console.log('Servicios locales:', this.localAgent.servicios.length);
        console.log('Contactos locales:', this.localAgent.contactos.length);
        console.log('Modo desarrollo:', this.isDevelopment());
        console.log('================================');
    }
}

// ===== GESTOR DE SERVICIOS MEJORADO =====
class ServiceManager {
    constructor(app) {
        this.app = app;
    }

    async loadServices() {
        const loadingEl = document.getElementById('loadingMessage');
        const servicesGridEl = document.getElementById('servicesGrid');
        const errorEl = document.getElementById('errorMessage');

        try {
            // Mostrar loading
            this.toggleElement(loadingEl, true);
            this.toggleElement(errorEl, false);

            // Verificar caché primero
            const cachedServices = this.app.getCacheItem(CONFIG.STORAGE_KEYS.SERVICES_CACHE);
            if (cachedServices) {
                console.log('📦 Usando servicios desde caché');
                this.displayServices(cachedServices, servicesGridEl);
                this.toggleElement(loadingEl, false);
                this.toggleElement(servicesGridEl, true);
                return;
            }

            // Intentar cargar desde API con timeout
            const response = await this.fetchWithTimeout(`${CONFIG.API_BASE_URL}/servicios`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: No se pudo conectar con el AgenteServicio`);
            }

            const servicios = await response.json();
            
            // Guardar en caché
            this.app.setCacheItem(CONFIG.STORAGE_KEYS.SERVICES_CACHE, servicios);
            
            // Mostrar servicios
            this.displayServices(servicios, servicesGridEl);
            this.toggleElement(loadingEl, false);
            this.toggleElement(servicesGridEl, true);

        } catch (error) {
            console.log('AgenteServicio no disponible:', error.message);
            this.handleServiceError(loadingEl, errorEl);
        }
    }

    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.API_REQUEST);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    handleServiceError(loadingEl, errorEl) {
        this.toggleElement(loadingEl, false);
        this.toggleElement(errorEl, true);
        this.app.showNotification('Mostrando servicios de ejemplo (modo offline)', 'warning');
    }

    displayServices(servicios, container) {
        if (!container) return;
        
        container.innerHTML = '';
        
        servicios.forEach(servicio => {
            const serviceCard = this.createServiceCard(servicio);
            container.appendChild(serviceCard);
        });
    }

    createServiceCard(servicio) {
        const card = document.createElement('div');
        card.className = 'service-card';
        
        // Sanitizar datos para prevenir XSS
        const titulo = this.escapeHtml(servicio.titulo);
        const descripcion = this.escapeHtml(servicio.descripcion);
        const costo = this.formatCurrency(servicio.costo);
        
        card.innerHTML = `
            <div class="service-header">
                <h3>${titulo}</h3>
                <span class="service-price">${costo}</span>
            </div>
            <p class="service-description">${descripcion}</p>
            <div class="service-features">
                ${servicio.tecnologias ? servicio.tecnologias.map(tech => 
                    `<span class="feature-tag">${this.escapeHtml(tech)}</span>`
                ).join('') : ''}
            </div>
            <a href="servicios-detalle.html?id=${encodeURIComponent(servicio._id || servicio.id)}" 
               class="btn btn-primary">Ver Detalles</a>
        `;
        
        return card;
    }

    toggleElement(element, show) {
        if (element) {
            element.style.display = show ? 'block' : 'none';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

// ===== GESTOR DE CONTACTOS MEJORADO =====
class ContactManager {
    constructor(app) {
        this.app = app;
        this.formData = new Map();
    }

    initContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        // Restaurar borrador si existe
        this.restoreFormDraft(form);

        form.addEventListener('submit', (e) => this.handleContactSubmit(e));
        
        // Validación en tiempo real con debounce
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', this.app.debounce(() => {
                this.clearFieldError(input);
                this.saveFormDraft(form);
            }, 300));
        });

        // Guardar borrador periódicamente
        setInterval(() => this.saveFormDraft(form), 30000); // cada 30 segundos
    }

    saveFormDraft(form) {
        const formData = new FormData(form);
        const draft = {};
        
        for (let [key, value] of formData.entries()) {
            if (value.trim()) {
                draft[key] = value;
            }
        }
        
        if (Object.keys(draft).length > 0) {
            try {
                localStorage.setItem(CONFIG.STORAGE_KEYS.FORM_DRAFT, JSON.stringify(draft));
            } catch (e) {
                console.warn('No se pudo guardar borrador:', e);
            }
        }
    }

    restoreFormDraft(form) {
        try {
            const draft = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.FORM_DRAFT) || '{}');
            
            Object.entries(draft).forEach(([key, value]) => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field && !field.value) {
                    field.value = value;
                }
            });
        } catch (e) {
            console.warn('Error al restaurar borrador:', e);
        }
    }

    clearFormDraft() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.FORM_DRAFT);
        } catch (e) {
            console.warn('Error al limpiar borrador:', e);
        }
    }

    async handleContactSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Validar formulario
        if (!this.validateForm(form)) {
            this.app.showNotification('Por favor corrige los errores en el formulario', 'error');
            return;
        }
        
        // Preparar datos para AgenteContacto
        const contactData = {
            nombre: formData.get('nombre').trim(),
            email: formData.get('email').trim(),
            mensaje: formData.get('mensaje').trim(),
            fecha: new Date().toISOString(),
            agente: 'AgenteContacto',
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        };
        
        // Mostrar estado de envío
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const submitLoading = document.getElementById('submitLoading');
        
        this.setSubmitState(submitBtn, submitText, submitLoading, true);
        
        // Ocultar mensajes anteriores
        this.hideMessages();
        
        try {
            // Enviar al AgenteContacto con timeout
            const response = await this.fetchWithTimeout(`${CONFIG.API_BASE_URL}/contactos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: Error en el servidor del AgenteContacto`);
            }
            
            const result = await response.json();
            
            // Éxito
            this.app.showNotification('¡Mensaje enviado exitosamente por el AgenteContacto!', 'success');
            this.resetForm(form);
            this.clearFormDraft();
            
        } catch (error) {
            console.log('AgenteContacto no disponible:', error.message);
            
            // Modo offline - simular envío
            setTimeout(() => {
                this.app.showNotification('¡Mensaje procesado localmente! (AgenteContacto simulado)', 'success');
                this.resetForm(form);
                this.clearFormDraft();
            }, 1000);
        } finally {
            this.setSubmitState(submitBtn, submitText, submitLoading, false);
        }
    }

    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.API_REQUEST);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    setSubmitState(btn, text, loading, isSubmitting) {
        if (btn) btn.disabled = isSubmitting;
        if (text) text.style.display = isSubmitting ? 'none' : 'inline';
        if (loading) loading.style.display = isSubmitting ? 'inline' : 'none';
    }

    hideMessages() {
        ['successMessage', 'errorMessage'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    resetForm(form) {
        form.reset();
        // Limpiar estilos de validación
        const fields = form.querySelectorAll('input, textarea');
        fields.forEach(field => {
            field.style.borderColor = '';
            this.clearFieldError(field);
        });
    }

    validateForm(form) {
        const nombre = form.querySelector('#nombre');
        const email = form.querySelector('#email');
        const mensaje = form.querySelector('#mensaje');
        
        let isValid = true;
        
        if (!this.validateField(nombre)) isValid = false;
        if (!this.validateField(email)) isValid = false;
        if (!this.validateField(mensaje)) isValid = false;
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let errorMessage = '';
        
        // Validaciones específicas
        switch (fieldName) {
            case 'nombre':
                if (!value) {
                    errorMessage = 'El nombre es requerido';
                } else if (value.length < CONFIG.VALIDATION.MIN_NAME_LENGTH) {
                    errorMessage = `El nombre debe tener al menos ${CONFIG.VALIDATION.MIN_NAME_LENGTH} caracteres`;
                } else if (!/^[a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+$/.test(value)) {
                    errorMessage = 'El nombre solo puede contener letras y espacios';
                }
                break;
                
            case 'email':
                if (!value) {
                    errorMessage = 'El email es requerido';
                } else if (!CONFIG.VALIDATION.EMAIL_REGEX.test(value)) {
                    errorMessage = 'Por favor ingresa un email válido';
                }
                break;
                
            case 'mensaje':
                if (!value) {
                    errorMessage = 'El mensaje es requerido';
                } else if (value.length < CONFIG.VALIDATION.MIN_MESSAGE_LENGTH) {
                    errorMessage = `El mensaje debe tener al menos ${CONFIG.VALIDATION.MIN_MESSAGE_LENGTH} caracteres`;
                }
                break;
        }
        
        // Mostrar/ocultar error
        this.displayFieldError(fieldName, errorMessage);
        
        // Cambiar estilo del campo
        this.updateFieldStyle(field, !!errorMessage);
        
        return !errorMessage;
    }

    displayFieldError(fieldName, errorMessage) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.style.display = errorMessage ? 'block' : 'none';
        }
    }

    updateFieldStyle(field, hasError) {
        if (hasError) {
            field.style.borderColor = '#dc2626';
            field.classList.add('field-error');
        } else if (field.value.trim()) {
            field.style.borderColor = '#16a34a';
            field.classList.remove('field-error');
            field.classList.add('field-valid');
        } else {
            field.style.borderColor = '';
            field.classList.remove('field-error', 'field-valid');
        }
    }

    clearFieldError(field) {
        const fieldName = field.name;
        const errorElement = document.getElementById(`${fieldName}Error`);
        
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        
        field.style.borderColor = '';
        field.classList.remove('field-error');
    }
}

// ===== GESTOR DE DETALLES DE SERVICIO =====
class ServiceDetailManager {
    constructor(app) {
        this.app = app;
    }

    async loadServiceDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const serviceId = urlParams.get('id');
        
        const loadingEl = document.getElementById('detailLoading');
        const defaultDetailEl = document.getElementById('defaultServiceDetail');

        try {
            if (!serviceId) {
                throw new Error('No se proporcionó ID del servicio');
            }

            // Mostrar loading
            if (loadingEl) loadingEl.style.display = 'block';

            // Intentar cargar desde API
            const response = await this.fetchWithTimeout(`${CONFIG.API_BASE_URL}/servicios/${serviceId}`);
            
            if (!response.ok) {
                throw new Error(`Servicio no encontrado (${response.status})`);
            }

            const servicio = await response.json();
            
            // Actualizar contenido con datos de la API
            this.updateServiceDetail(servicio);

        } catch (error) {
            console.log('Error cargando detalle del servicio:', error.message);
            this.app.showNotification('Mostrando información de ejemplo', 'info', 3000);
        } finally {
            // Mostrar contenido por defecto
            if (loadingEl) loadingEl.style.display = 'none';
            if (defaultDetailEl) defaultDetailEl.style.display = 'block';
        }
    }

    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUTS.API_REQUEST);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    updateServiceDetail(servicio) {
        // Sanitizar y actualizar elementos específicos
        const updates = {
            'serviceTitle': servicio.titulo,
            'servicePrice': this.formatCurrency(servicio.costo),
            'serviceDescription': servicio.descripcion
        };

        Object.entries(updates).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.textContent = value;
            }
        });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

// ===== SERVICIO LOCAL MEJORADO =====
class LocalAgentService {
    constructor() {
        this.servicios = this.getExampleServices();
        this.contactos = [];
    }
    
    async getServicios() {
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

    getExampleServices() {
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
                descripcion: 'Diseño de interfaces con teoría del color aplicada',
                costo: 600,
                tecnologias: ['Figma', 'Prototipado', 'Teoría del Color'],
                agente: 'AgenteServicio'
            }
        ];
    }
}

// ===== FUNCIONES GLOBALES PARA COMPATIBILIDAD =====
let appInstance;

// Funciones globales que mantienen compatibilidad con el HTML existente
window.loadServices = async function() {
    if (!appInstance) return;
    const serviceManager = new ServiceManager(appInstance);
    await serviceManager.loadServices();
};

window.loadServiceDetail = async function() {
    if (!appInstance) return;
    const detailManager = new ServiceDetailManager(appInstance);
    await detailManager.loadServiceDetail();
};

window.initContactForm = function() {
    if (!appInstance) return;
    const contactManager = new ContactManager(appInstance);
    contactManager.initContactForm();
};

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
appInstance = new ServiTechApp();

// ===== EXPORTS PARA TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ServiTechApp,
        ServiceManager,
        ContactManager,
        LocalAgentService,
        CONFIG
    };
}