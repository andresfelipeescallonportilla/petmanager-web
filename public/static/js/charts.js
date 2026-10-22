/* =====================================================================
   Pet Manager - gráficos
   Sustituyen a los de JFreeChart (matplotlib) de la versión de escritorio.
   Se dibujan con SVG puro: sin librerías externas y sin conexión a Internet.
   ===================================================================== */

const Charts = (() => {

    const SVG_NS = 'http://www.w3.org/2000/svg';

    /** Colores por estado de salud (los mismos que en la GUI de escritorio). */
    const COLORS = {
        'Sick': '#e74c3c',
        'Healthy': '#27ae60',
        'In Surgery': '#f39c12'
    };
    const DEFAULT_COLOR = '#3498db';

    /** Devuelve el color asociado a un estado de salud. */
    function colorFor(label) {
        return COLORS[label] || DEFAULT_COLOR;
    }

    /** Crea un elemento SVG con sus atributos. */
    function svgEl(tag, attributes = {}) {
        const element = document.createElementNS(SVG_NS, tag);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    }

    /** Crea un elemento de texto SVG. */
    function textEl(x, y, content, options = {}) {
        const element = svgEl('text', {
            x: x, y: y,
            'font-size': options.size || 13,
            'font-family': 'Segoe UI, Roboto, Arial, sans-serif',
            'font-weight': options.weight || 600,
            'fill': options.fill || '#1f2d3d',
            'text-anchor': options.anchor || 'middle',
            'dominant-baseline': options.baseline || 'auto'
        });
        element.textContent = content;
        return element;
    }

    /** Pinta un mensaje cuando no hay datos. */
    function renderEmpty(container, message = 'No hay datos para mostrar') {
        container.innerHTML = '';
        const empty = document.createElement('p');
        empty.className = 'chart-empty';
        empty.textContent = message;
        container.appendChild(empty);
    }

    /**
     * Gráfico circular (donut) de mascotas por estado de salud.
     * @param {HTMLElement} container
     * @param {Array<{health_status:string, amount:number}>} data
     */
    function renderPie(container, data) {
        container.innerHTML = '';
        const items = (data || []).filter(item => item.amount > 0);

        if (!items.length) {
            renderEmpty(container);
            return;
        }

        const total = items.reduce((acc, item) => acc + item.amount, 0);
        const size = 380;
        const center = size / 2;
        const outerRadius = 140;
        const innerRadius = 78;

        const svg = svgEl('svg', {
            viewBox: `0 0 ${size} ${size}`,
            width: size,
            height: size,
            role: 'img',
            'aria-label': 'Gráfico circular de mascotas por estado de salud'
        });

        // Sombreado bajo el gráfico (estilo "3D" de JFreeChart).
        const shadow = svgEl('ellipse', {
            cx: center, cy: center + 16, rx: outerRadius * .92, ry: outerRadius * .3,
            fill: 'rgba(31,45,61,.12)'
        });
        svg.appendChild(shadow);

        let angle = -Math.PI / 2;  // empieza por arriba
        items.forEach(item => {
            const portion = item.amount / total;
            const end = angle + portion * Math.PI * 2;
            const largeArc = portion > 0.5 ? 1 : 0;

            const x1 = center + outerRadius * Math.cos(angle);
            const y1 = center + outerRadius * Math.sin(angle);
            const x2 = center + outerRadius * Math.cos(end);
            const y2 = center + outerRadius * Math.sin(end);
            const x3 = center + innerRadius * Math.cos(end);
            const y3 = center + innerRadius * Math.sin(end);
            const x4 = center + innerRadius * Math.cos(angle);
            const y4 = center + innerRadius * Math.sin(angle);

            const path = svgEl('path', {
                d: `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} ` +
                    `L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`,
                fill: colorFor(item.health_status),
                stroke: '#ffffff',
                'stroke-width': 2
            });
            path.appendChild(svgEl('title', {})).textContent =
                `${item.health_status}: ${item.amount} (${(portion * 100).toFixed(1)}%)`;
            svg.appendChild(path);

            // Porcentaje dentro de la banda (si hay sitio).
            if (portion > 0.07) {
                const mid = angle + portion * Math.PI / 2;
                const radius = (outerRadius + innerRadius) / 2;
                svg.appendChild(textEl(
                    center + radius * Math.cos(mid),
                    center + radius * Math.sin(mid),
                    `${(portion * 100).toFixed(0)}%`,
                    { size: 13, fill: '#ffffff' }
                ));
            }

            angle = end;
        });

        // Texto central con el total.
        svg.appendChild(textEl(center, center - 6, String(total),
            { size: 34, weight: 700, baseline: 'middle' }));
        svg.appendChild(textEl(center, center + 20, 'mascotas',
            { size: 12, weight: 600, fill: '#5b6b7f', baseline: 'middle' }));

        container.appendChild(svg);
    }

    /**
     * Gráfico de barras por estado de salud.
     * @param {HTMLElement} container
     * @param {Array<{health_status:string, amount:number}>} data
     * @param {'vertical'|'horizontal'} orientation
     */
    function renderBars(container, data, orientation = 'vertical') {
        container.innerHTML = '';
        const items = (data || []).filter(item => item.amount >= 0);

        if (!items.length) {
            renderEmpty(container);
            return;
        }

        const width = 720;
        const height = 400;
        const padding = { top: 30, right: 40, bottom: 60, left: 70 };

        const svg = svgEl('svg', {
            viewBox: `0 0 ${width} ${height}`,
            width: width,
            height: height,
            role: 'img',
            'aria-label': 'Gráfico de barras por estado de salud'
        });

        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;
        const maxValue = Math.max(1, ...items.map(item => item.amount));

        // Ejes
        svg.appendChild(svgEl('line', {
            x1: padding.left, y1: padding.top,
            x2: padding.left, y2: height - padding.bottom,
            stroke: '#c8d2df', 'stroke-width': 2
        }));
        svg.appendChild(svgEl('line', {
            x1: padding.left, y1: height - padding.bottom,
            x2: width - padding.right, y2: height - padding.bottom,
            stroke: '#c8d2df', 'stroke-width': 2
        }));

        if (orientation === 'horizontal') {
            // ----- Barras horizontales (gatos) -----
            const step = plotHeight / items.length;
            const barHeight = Math.min(52, step * 0.6);

            items.forEach((item, index) => {
                const barWidth = (item.amount / maxValue) * plotWidth;
                const y = padding.top + index * step + (step - barHeight) / 2;

                svg.appendChild(svgEl('rect', {
                    x: padding.left, y: y,
                    width: Math.max(barWidth, 2), height: barHeight,
                    rx: 5, fill: colorFor(item.health_status)
                }));

                svg.appendChild(textEl(
                    padding.left - 12, y + barHeight / 2, item.health_status,
                    { anchor: 'end', baseline: 'middle', size: 13 }
                ));
                svg.appendChild(textEl(
                    padding.left + barWidth + 10, y + barHeight / 2, String(item.amount),
                    { anchor: 'start', baseline: 'middle', size: 13, fill: '#5b6b7f' }
                ));
            });

            svg.appendChild(textEl(
                padding.left + plotWidth / 2, height - 18, 'Health Status',
                { size: 13, fill: '#5b6b7f' }
            ));
            svg.appendChild(textEl(
                18, padding.top + plotHeight / 2, 'Amount Of Cats',
                { size: 13, fill: '#5b6b7f' }
            ));
        } else {
            // ----- Barras verticales (perros) -----
            const step = plotWidth / items.length;
            const barWidth = Math.min(90, step * 0.55);
            const ticks = 5;

            // Marcas del eje vertical
            for (let index = 0; index <= ticks; index++) {
                const value = (maxValue / ticks) * index;
                const y = height - padding.bottom - (value / maxValue) * plotHeight;
                svg.appendChild(svgEl('line', {
                    x1: padding.left, y1: y, x2: width - padding.right, y2: y,
                    stroke: '#eef2f7', 'stroke-width': 1
                }));
                svg.appendChild(textEl(
                    padding.left - 10, y, String(Math.round(value)),
                    { anchor: 'end', baseline: 'middle', size: 11, fill: '#8a97a8', weight: 500 }
                ));
            }

            items.forEach((item, index) => {
                const barHeight = (item.amount / maxValue) * plotHeight;
                const x = padding.left + index * step + (step - barWidth) / 2;
                const y = height - padding.bottom - barHeight;

                svg.appendChild(svgEl('rect', {
                    x: x, y: y, width: barWidth, height: Math.max(barHeight, 2),
                    rx: 5, fill: colorFor(item.health_status)
                }));
                svg.appendChild(textEl(
                    x + barWidth / 2, y - 9, String(item.amount),
                    { size: 13, fill: '#1f2d3d' }
                ));
                svg.appendChild(textEl(
                    x + barWidth / 2, height - padding.bottom + 22, item.health_status,
                    { size: 13 }
                ));
            });

            svg.appendChild(textEl(
                padding.left + plotWidth / 2, height - 16, 'Health Status',
                { size: 13, fill: '#5b6b7f' }
            ));
            svg.appendChild(textEl(
                20, padding.top + plotHeight / 2, 'Amount of Dogs',
                { size: 13, fill: '#5b6b7f' }
            ));
        }

        container.appendChild(svg);
    }

    /**
     * Leyenda (se dibuja aparte para poder maquetarla con CSS).
     * @param {HTMLElement} container
     * @param {Array<{health_status:string, amount:number}>} data
     */
    function renderLegend(container, data) {
        container.innerHTML = '';
        (data || []).forEach(item => {
            const element = document.createElement('div');
            element.className = 'legend-item';

            const swatch = document.createElement('span');
            swatch.className = 'legend-swatch';
            swatch.style.background = colorFor(item.health_status);

            const label = document.createElement('span');
            label.textContent = `${item.health_status}: ${item.amount}`;

            element.appendChild(swatch);
            element.appendChild(label);
            container.appendChild(element);
        });
    }

    return { renderPie, renderBars, renderLegend, colorFor };
})();
