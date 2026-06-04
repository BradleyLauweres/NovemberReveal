import React, { useState, useEffect, useRef } from 'react';
import { Plane } from 'lucide-react';
import heic2any from "heic2any";
import './App.css';

const STOPS_DATA = [
  { 
    id: 1, 
    x: 20, 
    y: 85, 
    label: "December", 
    image: "Fotos/December.JPG",
    description: "Een magische afsluiting van het jaar."
  },
  { 
    id: 2, 
    x: 75, 
    y: 60, 
    label: "Februari", 
    image: "Fotos/Februari.HEIC",
    description: "Samen herinneringen maken."
  },
  { 
    id: 3, 
    x: 25, 
    y: 35, 
    label: "Maart", 
    image: "Fotos/Maart.jpg",
    description: "De lente in onze ogen."
  },
  { 
    id: 4, 
    x: 70, 
    y: 20, 
    label: "April", 
    image: "Fotos/April.JPG",
    description: "Nog meer mooie momenten."
  },
  { 
    id: 5, 
    x: 50, 
    y: 5, 
    label: "Onze Bestemming!", 
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
    description: "Gefeliciteerd! We gaan naar BALI!"
  }
];

function App() {
  const [started, setStarted] = useState(false);
  const [currentStop, setCurrentStop] = useState(-1);
  const [showReveal, setShowReveal] = useState(false);
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const airplaneRef = useRef(null);

  useEffect(() => {
    const processImages = async () => {
      setIsLoading(true);
      const updatedStops = await Promise.all(STOPS_DATA.map(async (stop) => {
        const isExternal = stop.image.startsWith('http');
        const imageUrl = isExternal ? stop.image : `${import.meta.env.BASE_URL}${stop.image}`;

        if (stop.image.toLowerCase().endsWith('.heic')) {
          try {
            const res = await fetch(imageUrl);
            if (!res.ok) throw new Error(`Could not fetch image: ${res.status}`);
            const blob = await res.blob();
            const convertedBlob = await heic2any({
              blob,
              toType: "image/jpeg",
              quality: 0.6
            });
            const url = URL.createObjectURL(Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob);
            return { ...stop, image: url };
          } catch (e) {
            console.error("HEIC conversion failed for", stop.label, e);
            return { ...stop, image: imageUrl };
          }
        }
        return { ...stop, image: imageUrl };
      }));
      setStops(updatedStops);
      setIsLoading(false);
    };
    processImages();
  }, []);

  const handleNext = () => {
    if (!started) {
      setStarted(true);
      moveAirplane(0);
      return;
    }

    const nextIndex = currentStop + 1;
    if (nextIndex < stops.length) {
      moveAirplane(nextIndex);
    } else {
      setShowReveal(true);
    }
  };

  const moveAirplane = (index) => {
    setCurrentStop(index);
    if (airplaneRef.current) {
      const stop = stops[index];
      airplaneRef.current.style.left = `${stop.x}%`;
      airplaneRef.current.style.top = `${stop.y}%`;
      
      if (index < stops.length - 1) {
        const next = stops[index + 1];
        const angle = Math.atan2(next.y - stop.y, next.x - stop.x) * 180 / Math.PI;
        airplaneRef.current.style.transform = `translate(-50%, -50%) rotate(${angle + 90}deg)`;
      } else {
        airplaneRef.current.style.transform = `translate(-50%, -50%) rotate(0deg)`;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-screen">
          <p>Herinneringen laden...</p>
        </div>
      </div>
    );
  }

  if (showReveal) {
    return (
      <div className="reveal-container" onClick={() => window.location.reload()}>
        <div className="reveal-content">
          <h1>BALI! 🌴</h1>
          <img src={stops[stops.length - 1].image} alt="Bali" className="reveal-image" />
          <p className="reveal-text">Fijne verjaardag schat! We gaan samen op avontuur.</p>
          <button className="restart-button">Bekijk de reis opnieuw</button>
        </div>
        <div className="confetti"></div>
      </div>
    );
  }

  return (
    <div className="app-container" onClick={handleNext}>
      {!started ? (
        <div className="welcome-screen">
          <h1>Hoi Lieverd,</h1>
          <p>Ik heb een verrassing voor je verjaardag...</p>
          <p className="hint">Tik op het scherm om te beginnen</p>
          <button className="start-button">
            Ontdek de verrassing!
          </button>
        </div>
      ) : (
        <div className="map-container">
          <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 20 85 C 60 85, 100 75, 75 60 S 0 45, 25 35 S 100 25, 70 20 S 50 5, 50 5"
              fill="none"
              stroke="white"
              strokeWidth="0.6"
              strokeDasharray="3,3"
              className="path-line"
            />
          </svg>

          {stops.map((stop, index) => (
            <div
              key={stop.id}
              className={`stop-marker ${index <= currentStop ? 'active' : ''}`}
              style={{ left: `${stop.x}%`, top: `${stop.y}%` }}
            >
              <div className="marker-dot" />
              {index === currentStop && (
                <div className="photo-popup">
                  <div className="polaroid">
                    <img src={stop.image} alt={stop.label} />
                    <div className="polaroid-text">
                      <h3>{stop.label}</h3>
                      <p>{stop.description}</p>
                    </div>
                  </div>
                  <div className="tap-hint">Tik voor volgende...</div>
                </div>
              )}
            </div>
          ))}

          <div
            ref={airplaneRef}
            className="airplane"
            style={{ left: '20%', top: '85%', opacity: currentStop === -1 ? 0 : 1 }}
          >
            <Plane size={32} color="#ff4757" fill="#ff4757" />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
