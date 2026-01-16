import { useEffect } from 'react';

function GeoJSONLineLayer({ map, data, lineColor = '#00A86B', lineWidth = 1, lineOpacity = 1, lineDasharray = null }) {
  const sourceId = 'geojson-line-source';
  const layerId = 'geojson-line-layer';

  useEffect(() => {
    if (!map || !data) return;

    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(data);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: data,
      });
    }

    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'line-color', lineColor);
      map.setPaintProperty(layerId, 'line-width', lineWidth);
      map.setPaintProperty(layerId, 'line-opacity', lineOpacity);
      if (lineDasharray) {
        map.setPaintProperty(layerId, 'line-dasharray', lineDasharray);
      }
    } else {
      const layerConfig = {
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': lineColor,
          'line-width': lineWidth,
          'line-opacity': lineOpacity,
        },
      };
      if (lineDasharray) {
        layerConfig.paint['line-dasharray'] = lineDasharray;
      }
      
      // Ensure the line is added BEFORE the markers if they exist
      const markersLayerId = 'point-markers-layer-hubs-landmarks';
      const beforeId = map.getLayer(markersLayerId) ? markersLayerId : undefined;
      
      map.addLayer(layerConfig, beforeId);
    }

    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, data, lineColor, lineWidth, lineOpacity, lineDasharray]);

  return null;
}

export default GeoJSONLineLayer;
