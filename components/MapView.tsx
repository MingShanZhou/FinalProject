import React, { useEffect, useRef, useState } from 'react';
import { TripData } from '../types';

interface MapViewProps {
  tripData: TripData;
  activeDay: number;
}

declare global {
  interface Window {
    google: any;
  }
}

const MapView: React.FC<MapViewProps> = ({ tripData, activeDay }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Script Loading Logic
  useEffect(() => {
    // 1. Check if already loaded and Map constructor is available
    if (window.google?.maps?.Map) {
      setStatus('loaded');
      return;
    }

    // 2. Check if script tag exists (prevent duplicates)
    const existingScript = document.querySelector('script[src^="https://maps.googleapis.com/maps/api/js"]');
    
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.Map) {
          setStatus('loaded');
          clearInterval(checkInterval);
        }
      }, 200);
      
      // Timeout after 10s
      const timeoutId = setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.google?.maps?.Map) setStatus('error');
      }, 10000);

      return () => {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
      };
    }

    // 3. Load Script
    const script = document.createElement('script');
    // Using process.env.API_KEY as per instructions.
    // Removed loading=async to ensure legacy global google.maps.Map is available immediately
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}&libraries=places,marker`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
        // Sometimes google object isn't immediately ready even after onload
        const checkLoaded = setInterval(() => {
            if(window.google?.maps?.Map) {
                setStatus('loaded');
                clearInterval(checkLoaded);
            }
        }, 100);
    };

    script.onerror = () => {
        console.error("Failed to load Google Maps script");
        setStatus('error');
    };

    document.head.appendChild(script);
  }, []);

  // Map Initialization & Updates
  useEffect(() => {
    if (status !== 'loaded' || !mapContainerRef.current) return;

    // Initialize Map if not exists
    if (!mapInstanceRef.current) {
        try {
            mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
                center: { lat: 23.5, lng: 121 }, // Taiwan center default
                zoom: 7,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels.text",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });
        } catch (error) {
            console.error("Map initialization failed:", error);
            return;
        }
    }

    const map = mapInstanceRef.current;

    // Update Markers
    // 1. Clear existing
    if (markersRef.current) {
        markersRef.current.forEach(m => m.setMap(null));
    }
    markersRef.current = [];

    // 2. Add new
    const activePlan = tripData.itinerary.find(d => d.day === activeDay);
    if (activePlan && activePlan.activities) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;

        activePlan.activities.forEach((activity) => {
            const { lat, lng, name } = activity.location;
            
            if (lat && lng && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
                const position = { lat, lng };
                
                // Create Marker
                const marker = new window.google.maps.Marker({
                    position,
                    map,
                    title: name,
                    animation: window.google.maps.Animation.DROP
                });

                // InfoWindow
                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 8px; color: #333; font-family: sans-serif;">
                            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${name}</div>
                            <div style="font-size: 12px; color: #666;">
                                <span style="background: #eee; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">${activity.time}</span>
                                ${activity.description || ''}
                            </div>
                        </div>
                    `
                });

                marker.addListener("click", () => {
                    infoWindow.open({
                        anchor: marker,
                        map,
                        shouldFocus: false
                    });
                });

                markersRef.current.push(marker);
                bounds.extend(position);
                hasPoints = true;
            }
        });

        if (hasPoints) {
            map.fitBounds(bounds);
            // Adjust zoom if too close (single point)
            const listener = window.google.maps.event.addListenerOnce(map, "idle", () => { 
                if (map.getZoom() > 16) map.setZoom(16); 
            });
        }
    }

  }, [status, tripData, activeDay]);

  return (
    <div className="w-full h-full relative bg-gray-100">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />
      
      {status === 'loading' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 font-bold">地圖載入中...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <p className="text-red-500 font-bold text-lg mb-2">地圖載入失敗</p>
            <p className="text-gray-400 text-sm">請確認您的網路連線，或檢查 API Key 設定是否正確。</p>
        </div>
      )}
    </div>
  );
};

export default MapView;