import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Using a Vector Style URL instead of a manual raster object
const defaultVectorStyle = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const TORONTO_BOUNDS = [
  [-79.65, 43.58],
  [-79.12, 43.85]
];

const TORONTO_CENTER = [-79.41, 43.71];
const DEFAULT_ZOOM = 11;
const MIN_ZOOM = 11;
const MAX_ZOOM = 18;

function MapContainer({ children, onMapLoad, style }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const mapLoadedRef = useRef(false);
  const isInitializingRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);

  const mapStyle = style || defaultVectorStyle;

  useEffect(() => {
    if (map.current || isInitializingRef.current) return;
    if (!mapContainer.current) return;

    isInitializingRef.current = true;

    const instance = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: TORONTO_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: TORONTO_BOUNDS,
      fadeDuration: 0,
      attributionControl: false,
    });

    map.current = instance;

    instance.addControl(new maplibregl.NavigationControl(), 'top-right');

    const handleLoad = () => {
      if (!mapLoadedRef.current) {
        mapLoadedRef.current = true;

        // --- DISTINCT COLOR SCHEME: Vibrant Light Green Background, Very Light Blue Water ---
        // Vibrant light green background with very light blue water
        const mapBg = '#D4EDDA'; // More saturated vibrant light green background
        const allLayers = instance.getStyle().layers;
        
        // Check if background layer exists, if not add one
        let backgroundLayerId = null;
        allLayers.forEach(layer => {
          if (layer.type === 'background') {
            backgroundLayerId = layer.id;
          }
        });
        
        if (!backgroundLayerId) {
          // Add background layer (background layers are automatically placed at the bottom)
          instance.addLayer({
            id: 'background-layer',
            type: 'background',
            paint: {
              'background-color': mapBg
            }
          });
          backgroundLayerId = 'background-layer';
        } else {
          // Update existing background layer
          try {
            instance.setPaintProperty(backgroundLayerId, 'background-color', mapBg);
          } catch (e) {
            console.warn('Could not set background color:', e);
          }
        }
        
        const roadGray = '#B8D4C0'; // Light green-tinted gray for roads and building outlines
        
        allLayers.forEach(layer => {
          try {
            const layerName = layer.id.toLowerCase();
            const isBuilding = layerName.includes('building') || layerName.includes('extrusion');
            
            if (layer.type === 'fill') {
              // Check if this is a water layer
              const isWater = layerName.includes('water');
              if (isWater) {
                instance.setPaintProperty(layer.id, 'fill-color', '#E6F3FF'); // Really really light blue water
              } else {
                instance.setPaintProperty(layer.id, 'fill-color', mapBg); // Really really light green land
              }
              // Hide buildings until zoom 14 using opacity
              if (isBuilding) {
                instance.setPaintProperty(layer.id, 'fill-opacity', [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  11, 0,    // Invisible at zoom 11
                  13, 0,    // Still invisible at zoom 13
                  14, 1,    // Fully visible at zoom 14
                  15, 1     // Fully visible at zoom 15+
                ]);
                try {
                  instance.setPaintProperty(layer.id, 'fill-outline-opacity', [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    11, 0,
                    13, 0,
                    14, 1,
                    15, 1
                  ]);
                } catch {
                  // Some layers don't support outline opacity
                }
              } else {
                instance.setPaintProperty(layer.id, 'fill-opacity', 1); // Full opacity for non-building fills
              }
              // Set outline color to light gray
              try {
                instance.setPaintProperty(layer.id, 'fill-outline-color', roadGray);
              } catch {
                // Some layers don't support outline
              }
            } else if (layer.type === 'fill-extrusion') {
              // 3D buildings - make them match the theme
              instance.setPaintProperty(layer.id, 'fill-extrusion-color', mapBg);
              // Hide buildings until zoom 14 using opacity
              instance.setPaintProperty(layer.id, 'fill-extrusion-opacity', [
                'interpolate',
                ['linear'],
                ['zoom'],
                11, 0,    // Invisible at zoom 11
                13, 0,    // Still invisible at zoom 13
                14, 1,    // Fully visible at zoom 14
                15, 1     // Fully visible at zoom 15+
              ]);
            } else if (layer.type === 'line') {
              instance.setPaintProperty(layer.id, 'line-color', roadGray); // Light gray roads
              // Make highways thinner
              const isHighway = layerName.includes('highway') || layerName.includes('motorway') || layerName.includes('trunk');
              if (isHighway) {
                instance.setPaintProperty(layer.id, 'line-width', 2); // Thinner highways
              }
            }
          } catch {
            // Some properties can't be set dynamically, ignore
          }
        });
        // --- END COLOR SCHEME ---

        setMapInstance(instance);
        setMapReady(true);
        
        if (onMapLoad && map.current === instance) {
          onMapLoad(instance);
        }
      }
    };

    instance.on('load', handleLoad);

    const handleError = (e) => {
      console.error('Map error:', e);
    };

    instance.on('error', handleError);

    return () => {
      if (instance) {
        try {
          instance.remove();
        } catch {
          // Map might already be removed
        }
        map.current = null;
        mapLoadedRef.current = false;
        isInitializingRef.current = false;
        setMapReady(false);
        setMapInstance(null);
      }
    };
  }, [onMapLoad, mapStyle]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#D4EDDA' // More saturated vibrant light green background color while loading
      }}
    >
      {children && mapReady && mapInstance ? children(mapInstance) : null}
    </div>
  );
}

export default MapContainer;
