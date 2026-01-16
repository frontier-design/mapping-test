import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

function PointMarkersLayer({ map, data, id = 'default' }) {
  const hubMarkersRef = useRef([]);

  useEffect(() => {
    const sourceId = `point-markers-source-${id}`;
    const glowLayerId = `point-markers-glow-${id}`;
    const layerId = `point-markers-layer-${id}`;
    if (!map || !data || !data.points) return;

    // Separate hub points from other points
    const hubPoints = data.points.filter(point => point.type === 'hub');
    const otherPoints = data.points.filter(point => point.type !== 'hub');

    // Convert non-hub points to GeoJSON FeatureCollection
    const geoJsonData = {
      type: 'FeatureCollection',
      features: otherPoints.map((point, index) => ({
        type: 'Feature',
        id: index,
        properties: {
          name: point.name,
          type: point.type,
          description: point.description || '',
        },
        geometry: {
          type: 'Point',
          coordinates: point.coordinates,
        },
      })),
    };

    if (map.getSource(sourceId)) {
      map.getSource(sourceId).setData(geoJsonData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geoJsonData,
      });

      // Add glow layer behind markers (only for non-hub types)
      map.addLayer({
        id: glowLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': [
            'match',
            ['get', 'type'],
            'landmark', '#66D575', // Light Green
            'ttc', '#FF6A0E',      // Orange
            '#66D575',             // Default
          ],
          'circle-radius': [
            'match',
            ['get', 'type'],
            'landmark', 20,  // Landmark glow (increased from 14)
            'ttc', 14,       // TTC glow (increased from 8)
            14,
          ],
          'circle-blur': 1,
          'circle-opacity': 0.3,
        },
      });

      // Add circle layer for landmarks and TTC
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': [
            'match',
            ['get', 'type'],
            'landmark', '#66D575', // Light Green
            'ttc', '#FF6A0E',      // Orange
            '#66D575',             // Default
          ],
          'circle-radius': [
            'match',
            ['get', 'type'],
            'landmark', 14,  // Increased from 8
            'ttc', 10,       // Increased from 5
            10, // Default
          ],
          'circle-stroke-width': 0,
          'circle-stroke-color': 'rgba(0,0,0,0)',
          'circle-opacity': 1,
        },
      });
    }

    // Remove existing hub markers
    hubMarkersRef.current.forEach(marker => marker.remove());
    hubMarkersRef.current = [];

    // Create popup for hub markers
    const hubPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 15,
      className: 'marker-hover-popup'
    });

    // Hub image mapping - different image for each hub
    const hubImages = {
      'The Bentway Conservancy': 'https://www.evergreen.ca/wp-content/uploads/2023/10/1-DonValleyBrickWorksPark_CourtesyEvergreen.jpg',
      'Waterfront Toronto': 'https://www.evergreen.ca/wp-content/uploads/2024/08/Quarry_0006.jpg',
      'Evergreen Brick Works': 'https://www.evergreen.ca/wp-content/uploads/2023/10/1-DonValleyBrickWorksPark_CourtesyEvergreen.jpg',
      'Toronto Botanical Garden': 'https://www.evergreen.ca/wp-content/uploads/2024/05/Bike-Ventures-1.jpg',
      'Black Creek Community Farm': 'https://www.evergreen.ca/wp-content/uploads/2024/08/Quarry_0006.jpg',
      'Learning Enrichment Foundation': 'https://www.evergreen.ca/wp-content/uploads/2024/05/Bike-Ventures-1.jpg',
    };

    // Create HTML markers for hub points
    hubPoints.forEach(point => {
      // Create the marker container
      const el = document.createElement('div');
      el.className = 'hub-marker-container';
      
      // Create the circular image - use image from mapping or fallback
      const image = document.createElement('img');
      image.className = 'hub-image';
      image.src = point.image || hubImages[point.name] || 'https://www.evergreen.ca/wp-content/uploads/2023/10/1-DonValleyBrickWorksPark_CourtesyEvergreen.jpg';
      image.alt = point.name;
      
      el.appendChild(image);
      
      // Add hover events for popup - attach to both container and image
      const handleMouseEnter = () => {
        const content = `
          <div class="popup-container" style="background-color: #24613D; color: #66D575">
            <img src="${point.image || hubImages[point.name] || 'https://www.evergreen.ca/wp-content/uploads/2023/10/1-DonValleyBrickWorksPark_CourtesyEvergreen.jpg'}" class="popup-image" alt="${point.name}" />
            <div class="popup-content-inner">
              <div class="popup-title">${point.name}</div>
              ${point.description ? `<div class="popup-description">${point.description}</div>` : ''}
            </div>
          </div>
        `;
        hubPopup.setLngLat(point.coordinates)
          .setHTML(content)
          .addTo(map);
      };

      const handleMouseLeave = () => {
        hubPopup.remove();
      };

      // Attach events to both container and image for better hover detection
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
      image.addEventListener('mouseenter', handleMouseEnter);
      image.addEventListener('mouseleave', handleMouseLeave);

      // Create the marker - anchor to center of image
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(point.coordinates)
        .addTo(map);

      hubMarkersRef.current.push(marker);
    });
    
    // Always ensure markers layer is on top by moving it to the end (after all other layers)
    const ensureOnTop = () => {
      if (map.getLayer(glowLayerId)) {
        map.moveLayer(glowLayerId);
      }
      if (map.getLayer(layerId)) {
        map.moveLayer(layerId);
      }
    };

    ensureOnTop();
    requestAnimationFrame(ensureOnTop);

    return () => {
      // Clean up hub markers
      hubMarkersRef.current.forEach(marker => marker.remove());
      hubMarkersRef.current = [];

      const cleanupSourceId = `point-markers-source-${id}`;
      const cleanupGlowId = `point-markers-glow-${id}`;
      const cleanupLayerId = `point-markers-layer-${id}`;
      
      if (map.getLayer(cleanupLayerId)) {
        map.removeLayer(cleanupLayerId);
      }
      if (map.getLayer(cleanupGlowId)) {
        map.removeLayer(cleanupGlowId);
      }
      if (map.getSource(cleanupSourceId)) {
        map.removeSource(cleanupSourceId);
      }
    };
  }, [map, data, id]);

  return null;
}

export default PointMarkersLayer;
