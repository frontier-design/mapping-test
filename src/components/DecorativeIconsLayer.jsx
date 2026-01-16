import { useEffect, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import maplibregl from 'maplibre-gl';
import { Bicycle, Tree } from 'phosphor-react';

const TORONTO_BOUNDS = [
  [-79.65, 43.58],
  [-79.12, 43.85]
];

// Generate random number between min and max
const random = (min, max) => Math.random() * (max - min) + min;

// Generate random coordinates within Toronto bounds
const generateRandomPosition = () => {
  const [minLng, minLat] = TORONTO_BOUNDS[0];
  const [maxLng, maxLat] = TORONTO_BOUNDS[1];
  return [random(minLng, maxLng), random(minLat, maxLat)];
};

// Create icon element from React icon component
const createIconElement = (IconComponent, size, rotation, opacity, color, weight = 'regular') => {
  const container = document.createElement('div');
  container.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(${rotation}deg);
    opacity: ${opacity};
  `;
  
  // Render icon to string and parse it
  const iconHTML = renderToString(
    <IconComponent 
      size={size} 
      color={color}
      weight={weight}
      style={{ display: 'block' }}
    />
  );
  
  // Parse the HTML string and append to container
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = iconHTML;
  const iconElement = tempDiv.firstChild;
  
  if (iconElement) {
    container.appendChild(iconElement);
  }
  
  return container;
};

function DecorativeIconsLayer({ map, visible = true, iconCount = 25 }) {
  const markersRef = useRef([]);
  const iconsDataRef = useRef([]);

  useEffect(() => {
    if (!map || !visible) {
      // Remove all markers if not visible
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      return;
    }

    // Generate icon positions (60% trees, 40% bikes)
    const icons = [];
    const treeCount = Math.floor(iconCount * 0.6);
    const bikeCount = iconCount - treeCount;

    for (let i = 0; i < treeCount; i++) {
      icons.push({
        type: 'tree',
        position: generateRandomPosition(),
        rotation: random(-15, 15),
        baseSize: random(40, 60),
      });
    }

    for (let i = 0; i < bikeCount; i++) {
      icons.push({
        type: 'bike',
        position: generateRandomPosition(),
        rotation: random(-30, 30),
        baseSize: random(35, 50),
      });
    }

    // Store icons data for zoom updates
    iconsDataRef.current = icons;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Create markers for each icon
    icons.forEach(icon => {
      const el = document.createElement('div');
      el.className = 'decorative-icon';
      el.style.cssText = `
        width: ${icon.baseSize}px;
        height: ${icon.baseSize}px;
        pointer-events: none;
        user-select: none;
      `;

      // Render icon based on type - using 'regular' weight for stroke-only icons
      const iconElement = icon.type === 'tree'
        ? createIconElement(Tree, icon.baseSize, icon.rotation, 1.0, '#66D575', 'regular')
        : createIconElement(Bicycle, icon.baseSize, icon.rotation, 1.0, '#24613D', 'regular');
      
      el.appendChild(iconElement);

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(icon.position)
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Update icon sizes based on zoom level
    const updateIconSizes = () => {
      const zoom = map.getZoom();
      const scaleFactor = Math.max(0.7, Math.min(1.3, (zoom - 11) / 7 + 0.7));
      
      markersRef.current.forEach((marker, index) => {
        const el = marker.getElement();
        if (el && iconsDataRef.current[index]) {
          const iconContainer = el.querySelector('div');
          const svg = el.querySelector('svg');
          if (iconContainer && svg) {
            const baseSize = iconsDataRef.current[index].baseSize;
            const newSize = baseSize * scaleFactor;
            iconContainer.style.width = `${newSize}px`;
            iconContainer.style.height = `${newSize}px`;
            svg.setAttribute('width', newSize);
            svg.setAttribute('height', newSize);
            el.style.width = `${newSize}px`;
            el.style.height = `${newSize}px`;
          }
        }
      });
    };

    map.on('zoom', updateIconSizes);
    updateIconSizes();

    return () => {
      map.off('zoom', updateIconSizes);
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
    };
  }, [map, visible, iconCount]);

  return null;
}

export default DecorativeIconsLayer;
