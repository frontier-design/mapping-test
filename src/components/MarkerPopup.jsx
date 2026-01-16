import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

function MarkerPopup({ map, layerIds }) {
  const popupRef = useRef(null);

  useEffect(() => {
    if (!map || !layerIds || layerIds.length === 0) return;

    // Create the popup instance
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10,
      className: 'marker-hover-popup'
    });
    
    popupRef.current = popup;

    const onMouseMove = (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: layerIds });
      
      if (features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
            const feature = features[0];
            const { name, description, type } = feature.properties;
            
            const typeConfig = {
              hub: {
                color: '#24613D', // Dark Green
                textColor: '#66D575', // Light Green text
                image: 'https://www.evergreen.ca/wp-content/uploads/2023/10/1-DonValleyBrickWorksPark_CourtesyEvergreen.jpg'
              },
              landmark: {
                color: '#66D575', // Light Green
                textColor: '#24613D', // Dark Green text
                image: 'https://www.evergreen.ca/wp-content/uploads/2024/08/Quarry_0006.jpg'
              },
              ttc: {
                color: '#FF6A0E', // Orange
                textColor: '#ffffff', // White text
                image: 'https://www.evergreen.ca/wp-content/uploads/2024/05/Bike-Ventures-1.jpg'
              }
            };

            const config = typeConfig[type] || { color: '#333', textColor: '#fff', image: '' };
            
            const content = `
              <div class="popup-container" style="background-color: ${config.color}; color: ${config.textColor}">
                ${config.image ? `<img src="${config.image}" class="popup-image" alt="${name}" />` : ''}
                <div class="popup-content-inner">
                  <div class="popup-title">${name}</div>
                  ${description ? `<div class="popup-description">${description}</div>` : ''}
                </div>
              </div>
            `;

        popup.setLngLat(feature.geometry.coordinates)
          .setHTML(content)
          .addTo(map);
      } else {
        map.getCanvas().style.cursor = '';
        popup.remove();
      }
    };

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    };

    // Add listeners for each layer
    layerIds.forEach(id => {
      map.on('mousemove', id, onMouseMove);
      map.on('mouseleave', id, onMouseLeave);
    });

    return () => {
      layerIds.forEach(id => {
        map.off('mousemove', id, onMouseMove);
        map.off('mouseleave', id, onMouseLeave);
      });
      popup.remove();
    };
  }, [map, layerIds]);

  return null;
}

export default MarkerPopup;
