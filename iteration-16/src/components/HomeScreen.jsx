import React from 'react';
import PromptCard from './PromptCard.jsx';
import useAppStore from '../store/useAppStore.js';

const BASE = import.meta.env.BASE_URL;
const TRIPS = [
  { id: 'iceland',    name: 'Ring Road, Iceland',         meta: '12-hour drive • 800 miles', img: `${BASE}trip-iceland.jpg`    },
  { id: 'amalfi',    name: 'Amalfi Coast, Italy',         meta: '3-hour drive • 90 miles',   img: `${BASE}trip-amalfi.jpg`    },
  { id: 'garden',    name: 'Garden Route, South Africa',  meta: '5-hour drive • 200 miles',  img: `${BASE}trip-garden.jpg`    },
  { id: 'oceanroad', name: 'Great Ocean Road, Australia', meta: '8-hour drive • 450 miles',  img: `${BASE}trip-oceanroad.jpg` },
];

export default function HomeScreen() {
  const goToMap = useAppStore(s => s.goToMap);

  return (
    <div className="home-screen">
      <div className="home-content">

        {/* User greeting + prompt card */}
        <div className="home-hero">
          <div className="home-greeting">
            <img src={`${BASE}user-avatar.svg`} alt="User avatar" className="home-avatar-img" />
            <div className="home-heading-wrap">
              <h1 className="home-heading">Hi Rakshit. Where are you headed?</h1>
            </div>
          </div>
          <PromptCard />
        </div>

        {/* Road trip idea cards */}
        <div className="home-trips">
          <p className="home-trips-heading">Road trip ideas</p>
          <div className="home-trips-row">
            {TRIPS.slice(0, 2).map(trip => (
              <TripCard key={trip.id} trip={trip} onClick={goToMap} />
            ))}
          </div>
          <div className="home-trips-row">
            {TRIPS.slice(2).map(trip => (
              <TripCard key={trip.id} trip={trip} onClick={goToMap} />
            ))}
          </div>
        </div>

      </div>
      <p className="home-disclaimer">Gemini can make mistakes</p>
    </div>
  );
}

function TripCard({ trip, onClick }) {
  return (
    <div className="trip-card" onClick={() => onClick()}>
      <div className="trip-card-img-wrap">
        <img className="trip-card-img" src={trip.img} alt={trip.name} />
      </div>
      <div className="trip-card-info">
        <div className="trip-card-text">
          <p className="trip-card-name">{trip.name}</p>
          <p className="trip-card-meta">{trip.meta}</p>
        </div>
        <div className="trip-card-thumbs">
          <div className="trip-card-thumb">
            <img src={`https://picsum.photos/seed/${trip.id}a/26/26`} alt="" />
          </div>
          <div className="trip-card-thumb">
            <img src={`https://picsum.photos/seed/${trip.id}b/26/26`} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
