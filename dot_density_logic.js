
function generateDotFeatures(features, areaField, breaks) {
  const allDots = [];

  features.forEach(f => {
    const area = f.get(areaField);
    const cls = getBreakClass(area, breaks);
    const dotCount = cls + 1; // Class 0 gets 1 dot, class 7 gets 8 dots
    const geometry = f.getGeometry();
    const extent = geometry.getExtent();

    for (let i = 0; i < dotCount; i++) {
      const [minX, minY, maxX, maxY] = extent;
      let point;
      let tries = 0;
      do {
        const x = minX + Math.random() * (maxX - minX);
        const y = minY + Math.random() * (maxY - minY);
        point = new ol.geom.Point([x, y]);
        tries++;
      } while (!geometry.intersectsCoordinate(point.getCoordinates()) && tries < 10);

      if (tries < 10) {
        const dot = new ol.Feature({ geometry: point });
        dot.set('class', cls);
        allDots.push(dot);
      }
    }
  });

  return allDots;
}

function renderDotDensityLayer(features, year) {
  const areaField = `Area_${year}`;
  const areaVals = features.map(f => f.get(areaField)).filter(v => typeof v === 'number');
  if (!areaVals.length) return null;
  const breaks = ss.jenks(areaVals, 8);

  const dots = generateDotFeatures(features, areaField, breaks);
  const vectorSource = new ol.source.Vector({ features: dots });

  const layer = new ol.layer.Vector({
    source: vectorSource,
    style: f => {
      const cls = f.get('class');
      return new ol.style.Style({
        image: new ol.style.Circle({
          radius: 2 + cls * 0.6,
          fill: new ol.style.Fill({ color: '#654321' }),
          stroke: new ol.style.Stroke({ color: '#222', width: 0.3 })
        })
      });
    }
  });

  renderDotLegend(breaks);
  return layer;
}

function renderDotLegend(breaks) {
  const container = document.getElementById('legendBox');
  const legendHTML = `<div class="legend-title">Area Harvested (Dot Density)</div><div class="dot-legend">` +
    breaks.slice(0, -1).map((b, i) => {
      const size = 2 + i * 0.6;
      const label = abbrev(breaks[i]) + '–' + abbrev(breaks[i + 1]);
      return `<div class="dot-swatch">
        <span class="dot-circle" style="width:${size * 2}px;height:${size * 2}px;"></span>${label}
      </div>`;
    }).join('') + `</div>`;
  container.innerHTML = legendHTML;
}
