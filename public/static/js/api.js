/* =====================================================================
   Pet Manager - cliente de la API REST
   Capa de comunicación con el backend Flask (equivale a la capa Model
   desde el punto de vista del navegador).
   ===================================================================== */

const API = (() => {

    /**
     * Petición genérica a la API.
     * @param {string} url    ruta relativa (por ejemplo "/api/pets")
     * @param {object} options { method, body }
     * @returns {Promise<object>} respuesta ya parseada
     */
    async function request(url, options = {}) {
        const config = {
            method: options.method || 'GET',
            headers: { 'Accept': 'application/json' }
        };

        if (options.body !== undefined) {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(options.body);
        }

        let response;
        try {
            response = await fetch(url, config);
        } catch (error) {
            throw new Error('No hay conexión con el servidor. ¿Está Flask ejecutándose?');
        }

        // La descarga de Excel no devuelve JSON.
        if (options.raw) {
            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }
            return response;
        }

        let data = null;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error(`Respuesta inesperada del servidor (${response.status}).`);
        }

        if (!response.ok || data.ok === false) {
            throw new Error(data.error || data.message || `Error ${response.status}`);
        }
        return data;
    }

    return {
        /** Comprueba la conexión con MySQL. */
        health: () => request('/api/health'),

        /** Lista las mascotas de un tipo ('Dog' o 'Cat'). */
        listPets: (type) => request(`/api/pets?type=${encodeURIComponent(type)}`),

        /** Busca una mascota por su código. */
        searchPet: (type, code) =>
            request(`/api/pets/search?type=${encodeURIComponent(type)}&code=${encodeURIComponent(code)}`),

        /** Crea una mascota. */
        createPet: (pet) => request('/api/pets', { method: 'POST', body: pet }),

        /** Actualiza una mascota. */
        updatePet: (pet) => request('/api/pets', { method: 'PUT', body: pet }),

        /** Elimina una mascota. */
        deletePet: (pet) =>
            request('/api/pets', { method: 'DELETE', body: pet }),

        /** Reporte por estado de salud ('pets', 'dogs' o 'cats'). */
        report: (kind) => request(`/api/reports?kind=${encodeURIComponent(kind)}`),

        /** Descarga el reporte en Excel (devuelve la respuesta cruda). */
        exportExcel: (kind) => request(`/api/export?kind=${encodeURIComponent(kind)}`, { raw: true })
    };
})();
