import { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import useAppStore from '../store/useAppStore.js';
import { SEARCH_OVERRIDES } from '../constants.js';

function fetchImage(name, service) {
  const query = SEARCH_OVERRIDES[name] ?? name;
  return new Promise(resolve => {
    service.findPlaceFromQuery(
      { query, fields: ['place_id', 'photos'] },
      (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results?.[0]) {
          resolve(null); return;
        }
        const first   = results[0];
        const placeId = first.place_id;
        if (placeId) {
          service.getDetails({ placeId, fields: ['photos'] }, (place, ds) => {
            const src = (ds === google.maps.places.PlacesServiceStatus.OK && place?.photos?.length)
              ? place.photos : (first.photos ?? []);
            if (!src.length) { resolve(null); return; }
            const entries = src.slice(0, 3).map(p => ({
              small: p.getUrl({ maxWidth: 800 }),
              thumb: p.getUrl({ maxWidth: 120 }),
            }));
            resolve({ photos: entries, small: entries[0].small, thumb: entries[0].thumb });
          });
        } else {
          const src = first.photos ?? [];
          if (!src.length) { resolve(null); return; }
          const entries = src.slice(0, 3).map(p => ({
            small: p.getUrl({ maxWidth: 800 }),
            thumb: p.getUrl({ maxWidth: 120 }),
          }));
          resolve({ photos: entries, small: entries[0].small, thumb: entries[0].thumb });
        }
      }
    );
  });
}

export default function usePlaceImages(names) {
  const map        = useMap();
  const serviceRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    if (!serviceRef.current) {
      serviceRef.current = new google.maps.places.PlacesService(map);
    }
    const { placeImages, setPlaceImage } = useAppStore.getState();
    names.forEach(name => {
      if (placeImages[name]) return;
      fetchImage(name, serviceRef.current).then(entry => {
        if (entry) useAppStore.getState().setPlaceImage(name, entry);
      });
    });
  }, [map, names]);
}
