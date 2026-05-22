import React from 'react';
import GeminiIcon from './GeminiIcon.jsx';
import PromptCard from './PromptCard.jsx';
import useAppStore from '../store/useAppStore.js';

const TRIPS = [
  { seed: 'iceland1', name: 'Iceland Golden Circle', time: 'Just now', avatars: ['11', '22'] },
  { seed: 'iceland2', name: 'Iceland South Coast',   time: 'Just now', avatars: ['33', '44'] },
];

export default function HomeScreen() {
  const goToMap = useAppStore(s => s.goToMap);

  return (
    <main className="home-screen" id="homeScreen">
      <div className="home-content">

        <section className="home-hero">
          <div className="hero-heading-group">
            <div className="gemini-logo-wrap">
              <GeminiIcon size={28} />
            </div>
            <h1 className="home-heading">Hey Rakshit, where are you planning to go on your road trip?</h1>
          </div>
          <PromptCard />
        </section>

        <section className="home-trips">
          <h2 className="planned-trips-heading">Planned roadtrips</h2>
          <div className="trips-grid">
            {TRIPS.map(trip => (
              <div key={trip.seed} className="trip-card" onClick={() => goToMap()}>
                <img className="trip-card-img" src={`https://picsum.photos/seed/${trip.seed}/271/160`} alt={trip.name} />
                <div className="trip-card-footer">
                  <div className="trip-card-text">
                    <div className="trip-card-name">{trip.name}</div>
                    <div className="trip-card-time">{trip.time}</div>
                  </div>
                  <div className="avatar-stack">
                    <img className="avatar avatar--front" src={`https://picsum.photos/seed/${trip.avatars[0]}/26/26`} alt="" />
                    <img className="avatar" src={`https://picsum.photos/seed/${trip.avatars[1]}/26/26`} alt="" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <div className="home-disclaimer">Gemini can make mistakes</div>
    </main>
  );
}
