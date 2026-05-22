import React, { useState, useEffect, useRef } from 'react';

const OPTIONS = [
  { label: 'Gas',      icon: 'local_gas_station' },
  { label: 'Electric', icon: 'power'             },
];

export default function VehicleSelector() {
  const [open,     setOpen]     = useState(false);
  const [selected, setSelected] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const opt = OPTIONS[selected];

  return (
    <div className="vehicle-selector-wrap" ref={ref}>
      <button className="vehicle-chip" onClick={e => { e.stopPropagation(); setOpen(o => !o); }}>
        <span className="material-symbols-rounded vehicle-chip-icon">{opt.icon}</span>
        <span className="vehicle-chip-label">{opt.label}</span>
        <span className="material-symbols-rounded vehicle-chip-chevron">
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open && (
        <div className="vehicle-dropdown is-open">
          {OPTIONS.map((o, i) => (
            <React.Fragment key={o.label}>
              {i > 0 && <div className="vehicle-option-divider" />}
              <button className="vehicle-option" onClick={() => { setSelected(i); setOpen(false); }}>
                <div className={`vehicle-radio${i === selected ? ' vehicle-radio--selected' : ''}`} />
                <span className="vehicle-option-label">{o.label}</span>
                <span className="material-symbols-rounded vehicle-option-icon">{o.icon}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
