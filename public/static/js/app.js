/* =====================================================================
   Pet Manager - lógica de la interfaz (equivalente a frmPet.java)
   Gestiona las pestañas, el CRUD, los reportes y los mensajes.
   ===================================================================== */

const App = (() => {

    // --- Estado en memoria (como las LinkedList de Java) -----------------
    let dogs = [];
    let cats = [];

    // --- Utilidades de DOM ------------------------------------------------
    const $ = (id) => document.getElementById(id);

    const HEALTH_CLASS = {
        'Sick': 'badge-sick',
        'Healthy': 'badge-healthy',
        'In Surgery': 'badge-surgery'
    };

    /** Devuelve el <span> con la insignia del estado de salud. */
    function healthBadge(status) {
        const span = document.createElement('span');
        span.className = 'badge ' + (HEALTH_CLASS[status] || 'badge-other');
        span.textContent = status || '-';
        return span;
    }

    /** Crea una celda de texto. */
    function cell(text) {
        const td = document.createElement('td');
        td.textContent = text === null || text === undefined ? '' : text;
        return td;
    }

    // ==================================================================
    // DIÁLOGO (equivalente a JOptionPane.showMessageDialog)
    // ==================================================================
    let modalResolver = null;

    /**
     * Muestra un diálogo modal.
     * @returns {Promise<void>}
     */
    function showModal(title, message, icon = 'ℹ️') {
        $('modalTitle').textContent = title;
        $('modalMessage').textContent = message;
        $('modalIcon').textContent = icon;
        $('modalBackdrop').hidden = false;
        $('modalOk').focus();
        return new Promise(resolve => { modalResolver = resolve; });
    }

    const showInfo = (title, message) => showModal(title, message, 'ℹ️');
    const showSuccess = (title, message) => showModal(title, message, '✅');
    const showError = (title, message) => showModal(title, message, '⛔');

    function closeModal() {
        $('modalBackdrop').hidden = true;
        if (modalResolver) {
            modalResolver();
            modalResolver = null;
        }
    }

    // ==================================================================
    // BARRA DE ESTADO
    // ==================================================================
    function setStatus(text, state = '') {
        $('statusText').textContent = text;
        $('statusDot').className = 'dot ' + state;
    }

    // ==================================================================
    // PESTAÑAS
    // ==================================================================
    function selectTab(name) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === name);
        });
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === 'panel-' + name);
        });
    }

    // ==================================================================
    // TABLAS
    // ==================================================================
    function fillTable(tableId, rows, columns) {
        const tbody = $(tableId).querySelector('tbody');
        tbody.innerHTML = '';

        if (!rows.length) {
            const tr = document.createElement('tr');
            tr.className = 'empty-row';
            const td = document.createElement('td');
            td.colSpan = columns.length;
            td.textContent = 'No hay registros para mostrar';
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            columns.forEach(column => {
                const value = column.value(row);
                if (value instanceof HTMLElement) {
                    const td = document.createElement('td');
                    td.appendChild(value);
                    tr.appendChild(td);
                } else {
                    tr.appendChild(cell(value));
                }
            });
            tbody.appendChild(tr);
        });
    }

    function renderAll() {
        // --- Todas las mascotas ---
        fillTable('tblPets', dogs.concat(cats), [
            { value: row => row.code },
            { value: row => row.name },
            {
                value: row => {
                    const span = document.createElement('span');
                    span.className = 'badge ' + (row.animalType === 'Dog' ? 'badge-dog' : 'badge-cat');
                    span.textContent = row.animalType;
                    return span;
                }
            },
            { value: row => row.born_year },
            { value: row => row.color },
            { value: row => healthBadge(row.health_status) }
        ]);
        $('petListCount').textContent = `${dogs.length + cats.length} registros`;

        // --- Perros ---
        fillTable('tblDogs', dogs, [
            { value: row => row.code },
            { value: row => row.name },
            { value: row => row.breed },
            { value: row => (row.pedigree ? 'Yes' : 'No') },
            { value: row => row.born_year },
            { value: row => row.color },
            { value: row => healthBadge(row.health_status) }
        ]);
        $('dogListCount').textContent = `${dogs.length} registros`;

        // --- Gatos ---
        fillTable('tblCats', cats, [
            { value: row => row.code },
            { value: row => row.name },
            { value: row => row.breed },
            { value: row => row.born_year },
            { value: row => row.color },
            { value: row => healthBadge(row.health_status) }
        ]);
        $('catListCount').textContent = `${cats.length} registros`;
    }

    // ==================================================================
    // REPORTES (gráficos)
    // ==================================================================
    async function loadReports() {
        try {
            const [pets, dogsReport, catsReport] = await Promise.all([
                API.report('pets'),
                API.report('dogs'),
                API.report('cats')
            ]);

            Charts.renderPie($('chartPets'), pets.data);
            Charts.renderLegend($('legendPets'), pets.data);
            Charts.renderBars($('chartDogs'), dogsReport.data, 'vertical');
            Charts.renderBars($('chartCats'), catsReport.data, 'horizontal');
        } catch (error) {
            console.error('Error al cargar los reportes:', error);
        }
    }

    // ==================================================================
    // CARGA DE DATOS
    // ==================================================================
    async function loadData(silent = false) {
        if (!silent) {
            setStatus('Cargando datos…', 'busy');
        }
        try {
            const [dogResponse, catResponse] = await Promise.all([
                API.listPets('Dog'),
                API.listPets('Cat')
            ]);
            dogs = dogResponse.data;
            cats = catResponse.data;
            renderAll();
            await loadReports();
            setStatus(`Datos cargados: ${dogs.length} perros y ${cats.length} gatos.`, 'ok');
        } catch (error) {
            setStatus(error.message, 'error');
            if (!silent) {
                await showError('Pet Manager', error.message);
            }
        }
    }

    // ==================================================================
    // FORMULARIOS
    // ==================================================================
    function clearDogForm() {
        $('dogCode').value = '';
        $('dogName').value = '';
        $('dogBornYear').value = '';
        $('dogColor').value = '';
        $('dogHealthStatus').selectedIndex = 0;
        $('dogBreed').selectedIndex = 0;
        $('dogPedigree').checked = false;
        $('dogPetId').value = '';
        $('dogId').value = '';
    }

    function clearCatForm() {
        $('catCode').value = '';
        $('catName').value = '';
        $('catBornYear').value = '';
        $('catColor').value = '';
        $('catHealthStatus').selectedIndex = 0;
        $('catBreed').selectedIndex = 0;
        $('catPetId').value = '';
        $('catId').value = '';
    }

    /** Datos del formulario de perro (equivalente a leer los JTextField). */
    function dogForm() {
        return {
            animalType: 'Dog',
            code: $('dogCode').value.trim(),
            name: $('dogName').value.trim(),
            born_year: $('dogBornYear').value.trim(),
            color: $('dogColor').value.trim(),
            health_status: $('dogHealthStatus').value,
            breed: $('dogBreed').value,
            pedigree: $('dogPedigree').checked,
            petId: $('dogPetId').value.trim(),
            dogId: $('dogId').value.trim()
        };
    }

    /** Datos del formulario de gato. */
    function catForm() {
        return {
            animalType: 'Cat',
            code: $('catCode').value.trim(),
            name: $('catName').value.trim(),
            born_year: $('catBornYear').value.trim(),
            color: $('catColor').value.trim(),
            health_status: $('catHealthStatus').value,
            breed: $('catBreed').value,
            petId: $('catPetId').value.trim(),
            catId: $('catId').value.trim()
        };
    }

    // ==================================================================
    // CRUD - PERROS
    // ==================================================================
    async function dogSave() {
        const form = dogForm();
        if (!form.code || !form.name || !form.color) {
            await showInfo('Pet Manager', 'Fill all fields');
            return;
        }
        if (!/^-?\d+$/.test(form.born_year)) {
            await showInfo('Pet Manager', 'Please add a valid born year');
            return;
        }
        try {
            setStatus('Guardando…', 'busy');
            await API.createPet(form);
            clearDogForm();
            await loadData(true);
            await showSuccess('Pet Manager', 'The record has been saved');
            setStatus(`Perro '${form.name}' guardado correctamente.`, 'ok');
        } catch (error) {
            setStatus('Error al guardar el perro.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    async function dogSearch() {
        const code = $('dogCode').value.trim();
        try {
            setStatus('Buscando…', 'busy');
            const response = await API.searchPet('Dog', code);
            if (!response.data) {
                await showInfo('Pet Manager', 'Code not found');
                setStatus('Código no encontrado.', 'error');
                return;
            }
            const pet = response.data;
            $('dogPetId').value = pet.petId;
            $('dogId').value = pet.dogId;
            $('dogName').value = pet.name;
            $('dogColor').value = pet.color;
            $('dogBornYear').value = pet.born_year;
            $('dogHealthStatus').value = pet.health_status;
            $('dogBreed').value = pet.breed;
            $('dogPedigree').checked = !!pet.pedigree;
            setStatus(`Perro '${pet.name}' encontrado.`, 'ok');
        } catch (error) {
            setStatus('Error al buscar el perro.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    async function dogEdit() {
        const form = dogForm();
        if (!/^-?\d+$/.test(form.born_year) || !$('dogPetId').value || !$('dogId').value) {
            await showInfo('Pet Manager', 'You have to search the record to update');
            return;
        }
        try {
            setStatus('Actualizando…', 'busy');
            await API.updatePet(form);
            clearDogForm();
            await loadData(true);
            await showSuccess('Pet Manager', 'Record updated');
            setStatus(`Perro '${form.name}' actualizado correctamente.`, 'ok');
        } catch (error) {
            setStatus('Error al actualizar el perro.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    async function dogDelete() {
        if (!$('dogPetId').value || !$('dogId').value) {
            await showInfo('Pet Manager', 'You have not searched a dog yet');
            return;
        }
        try {
            setStatus('Eliminando…', 'busy');
            await API.deletePet({
                animalType: 'Dog',
                petId: $('dogPetId').value,
                dogId: $('dogId').value
            });
            clearDogForm();
            await loadData(true);
            await showSuccess('Pet Manager', 'The dog has been deleted (removed) successfuly!');
            setStatus('Perro eliminado correctamente.', 'ok');
        } catch (error) {
            setStatus('Error al eliminar el perro.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    // ==================================================================
    // CRUD - GATOS
    // ==================================================================
    async function catSave() {
        const form = catForm();
        if (!form.code || !form.name || !form.color) {
            await showInfo('Pet Manager', 'Fill all fields');
            return;
        }
        if (!/^-?\d+$/.test(form.born_year)) {
            await showInfo('Pet Manager', 'Please add a valid born year');
            return;
        }
        try {
            setStatus('Guardando…', 'busy');
            await API.createPet(form);
            clearCatForm();
            await loadData(true);
            await showSuccess('Pet Manager', 'The record has been saved');
            setStatus(`Gato '${form.name}' guardado correctamente.`, 'ok');
        } catch (error) {
            setStatus('Error al guardar el gato.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    async function catSearch() {
        const code = $('catCode').value.trim();
        try {
            setStatus('Buscando…', 'busy');
            const response = await API.searchPet('Cat', code);
            if (!response.data) {
                await showInfo('Pet Manager', 'Code not found');
                setStatus('Código no encontrado.', 'error');
                return;
            }
            const pet = response.data;
            $('catPetId').value = pet.petId;
            $('catId').value = pet.catId;
            $('catName').value = pet.name;
            $('catColor').value = pet.color;
            $('catBornYear').value = pet.born_year;
            $('catHealthStatus').value = pet.health_status;
            $('catBreed').value = pet.breed;
            setStatus(`Gato '${pet.name}' encontrado.`, 'ok');
        } catch (error) {
            setStatus('Error al buscar el gato.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    async function catEdit() {
        const form = catForm();
        if (!/^-?\d+$/.test(form.born_year) || !$('catPetId').value || !$('catId').value) {
            await showInfo('Pet Manager', 'You have to search the record to update');
            return;
        }
        try {
            setStatus('Actualizando…', 'busy');
            await API.updatePet(form);
            clearCatForm();
            await loadData(true);
            await showSuccess('Pet Manager', 'Record updated');
            setStatus(`Gato '${form.name}' actualizado correctamente.`, 'ok');
        } catch (error) {
            setStatus('Error al actualizar el gato.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    async function catDelete() {
        if (!$('catPetId').value || !$('catId').value) {
            await showInfo('Pet Manager', 'You have not searched a cat yet');
            return;
        }
        try {
            setStatus('Eliminando…', 'busy');
            await API.deletePet({
                animalType: 'Cat',
                petId: $('catPetId').value,
                catId: $('catId').value
            });
            clearCatForm();
            await loadData(true);
            await showSuccess('Pet Manager', 'The cat has been deleted (removed) successfuly!');
            setStatus('Gato eliminado correctamente.', 'ok');
        } catch (error) {
            setStatus('Error al eliminar el gato.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    // ==================================================================
    // EXPORTACIÓN A EXCEL
    // ==================================================================
    async function exportExcel(kind) {
        try {
            setStatus('Generando el archivo…', 'busy');
            const response = await API.exportExcel(kind);

            const disposition = response.headers.get('Content-Disposition') || '';
            const match = disposition.match(/filename="?([^";]+)"?/i);
            const fileName = match ? match[1] : `pet_list_report_${kind}.xlsx`;

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            setStatus(`Archivo exportado: ${fileName}`, 'ok');
            await showSuccess('Pet Manager', `The file has been exported successfully:\n${fileName}`);
        } catch (error) {
            setStatus('Error al exportar el archivo.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    // ==================================================================
    // OTRAS ACCIONES
    // ==================================================================
    async function testConnection() {
        try {
            setStatus('Comprobando la conexión…', 'busy');
            const response = await API.health();
            setStatus(response.message, 'ok');
            await showSuccess('Pet Manager', response.message);
        } catch (error) {
            setStatus('Sin conexión con la base de datos.', 'error');
            await showError('Pet Manager', error.message);
        }
    }

    async function restart() {
        clearDogForm();
        clearCatForm();
        await loadData(true);
        await showInfo('Pet Manager', 'The application has been restarted');
    }

    // ==================================================================
    // INICIALIZACIÓN
    // ==================================================================
    function bindEvents() {
        // Pestañas
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => selectTab(tab.dataset.tab));
        });

        // Diálogo
        $('modalOk').addEventListener('click', closeModal);
        $('modalBackdrop').addEventListener('click', (event) => {
            if (event.target === $('modalBackdrop')) {
                closeModal();
            }
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !$('modalBackdrop').hidden) {
                closeModal();
            }
        });

        // Perros
        $('btnDogSave').addEventListener('click', dogSave);
        $('btnDogSearch').addEventListener('click', dogSearch);
        $('btnDogEdit').addEventListener('click', dogEdit);
        $('btnDogDelete').addEventListener('click', dogDelete);

        // Gatos
        $('btnCatSave').addEventListener('click', catSave);
        $('btnCatSearch').addEventListener('click', catSearch);
        $('btnCatEdit').addEventListener('click', catEdit);
        $('btnCatDelete').addEventListener('click', catDelete);

        // Cabecera
        $('btnTestConnection').addEventListener('click', testConnection);
        $('btnExportPetList').addEventListener('click', () => exportExcel('pets'));
        $('btnExportDogList').addEventListener('click', () => exportExcel('dogs'));
        $('btnExportCatList').addEventListener('click', () => exportExcel('cats'));
        $('btnRestart').addEventListener('click', restart);
        $('btnRefreshReports').addEventListener('click', async () => {
            await loadReports();
            await showInfo('Pet Manager', 'The report has been updated');
        });

        // Enter en los campos -> buscar (cómodo para probar)
        $('dogCode').addEventListener('keydown', (event) => {
            if (event.key === 'Enter') dogSearch();
        });
        $('catCode').addEventListener('keydown', (event) => {
            if (event.key === 'Enter') catSearch();
        });
    }

    function init() {
        bindEvents();
        loadData();
    }

    document.addEventListener('DOMContentLoaded', init);

    return { init, loadData, selectTab };
})();
