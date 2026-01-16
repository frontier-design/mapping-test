import { useState } from 'react';
import MapContainer from './components/MapContainer';
import GeoJSONLineLayer from './components/GeoJSONLineLayer';
import PointMarkersLayer from './components/PointMarkersLayer';
import MarkerPopup from './components/MarkerPopup';
import DecorativeIconsLayer from './components/DecorativeIconsLayer';
import { ArrowRight } from 'phosphor-react';
import pointsData from './data/points.json';
import ttcStationsData from './data/ttc_stations.json';
import trailData from './data/torontoTrailLoop.json';
import './App.css';

function App() {
  const [loading] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    trail: true,
    hubs: true,
    landmarks: true,
    ttc: true
  });

  const toggleLayer = (layerId) => {
    setVisibleLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId]
    }));
  };

  const activePopupLayers = [];
  if (visibleLayers.hubs || visibleLayers.landmarks) activePopupLayers.push('point-markers-layer-hubs-landmarks');
  if (visibleLayers.ttc) activePopupLayers.push('point-markers-layer-ttc');

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Explore The Loop Trail</h1>
          <p className="sidebar-subtitle">
            Dive deeper into the Loop Trail's route, features, and connections through our detailed interactive maps.
          </p>
          <a href="#" className="explore-button">
            Explore Detailed Local Maps <ArrowRight size={20} weight="bold" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
          </a>
        </div>

        <div className="layer-controls">
          <div className={`legend-item ${!visibleLayers.trail ? 'inactive' : ''}`} onClick={() => toggleLayer('trail')}>
            <span>The Loop Trail</span>
            <div className="legend-line" style={{ backgroundColor: '#00A86B' }}></div>
          </div>
          
                 <div className={`legend-item ${!visibleLayers.hubs ? 'inactive' : ''}`} onClick={() => toggleLayer('hubs')}>
                   <span>Key Hubs</span>
                   <div className="legend-color" style={{ backgroundColor: '#24613D' }}></div>
                 </div>
                 
                 <div className={`legend-item ${!visibleLayers.landmarks ? 'inactive' : ''}`} onClick={() => toggleLayer('landmarks')}>
                   <span>Landmarks</span>
                   <div className="legend-color" style={{ backgroundColor: '#66D575' }}></div>
                 </div>
                 
                 <div className={`legend-item ${!visibleLayers.ttc ? 'inactive' : ''}`} onClick={() => toggleLayer('ttc')}>
                   <span>TTC Connections</span>
                   <div className="legend-color" style={{ backgroundColor: '#FF6A0E' }}></div>
                 </div>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer>
          {(map) => (
            <>
              {!loading && trailData && visibleLayers.trail && (
                <GeoJSONLineLayer
                  map={map}
                  data={trailData}
                  lineColor="#00A86B"
                  lineWidth={8}
                  lineOpacity={1}
                />
              )}
              {!loading && (visibleLayers.hubs || visibleLayers.landmarks) && (
                <PointMarkersLayer
                  map={map}
                  data={{
                    points: pointsData.points.filter(p => 
                      (p.type === 'hub' && visibleLayers.hubs) || 
                      (p.type === 'landmark' && visibleLayers.landmarks)
                    )
                  }}
                  id="hubs-landmarks"
                />
              )}
              {!loading && visibleLayers.ttc && (
                <PointMarkersLayer
                  map={map}
                  data={ttcStationsData}
                  id="ttc"
                />
              )}
              {!loading && activePopupLayers.length > 0 && (
                <MarkerPopup 
                  map={map} 
                  layerIds={activePopupLayers} 
                />
              )}
              {/* Decorative icons layer disabled for now */}
              {/* {!loading && (
                <DecorativeIconsLayer
                  map={map}
                  visible={true}
                  iconCount={25}
                />
              )} */}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}


export default App;
