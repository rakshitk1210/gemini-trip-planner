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
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="vehicle-chip-icon-svg">
          <path d="M13.0133 4.82L13.02 4.81333L10.54 2.33333L9.83333 3.04L11.24 4.44667C10.6133 4.68667 10.1667 5.28667 10.1667 6C10.1667 6.92 10.9133 7.66667 11.8333 7.66667C12.0733 7.66667 12.2933 7.61333 12.5 7.52667V12.3333C12.5 12.7 12.2 13 11.8333 13C11.4667 13 11.1667 12.7 11.1667 12.3333V9.33333C11.1667 8.6 10.5667 8 9.83333 8H9.16667V3.33333C9.16667 2.6 8.56667 2 7.83333 2H3.83333C3.1 2 2.5 2.6 2.5 3.33333V14H9.16667V9H10.1667V12.3333C10.1667 13.2533 10.9133 14 11.8333 14C12.7533 14 13.5 13.2533 13.5 12.3333V6C13.5 5.54 13.3133 5.12 13.0133 4.82ZM7.83333 12.6667H3.83333V8H7.83333V12.6667ZM7.83333 6.66667H3.83333V3.33333H7.83333V6.66667ZM11.8333 6.66667C11.4667 6.66667 11.1667 6.36667 11.1667 6C11.1667 5.63333 11.4667 5.33333 11.8333 5.33333C12.2 5.33333 12.5 5.63333 12.5 6C12.5 6.36667 12.2 6.66667 11.8333 6.66667Z" fill="#5F6368"/>
        </svg>
        <span className="vehicle-chip-label">{opt.label}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="vehicle-chip-chevron-svg" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M10.5818 5.99969L7.9951 8.58635L5.40844 5.99969C5.14844 5.73969 4.72844 5.73969 4.46844 5.99969C4.20844 6.25969 4.20844 6.67969 4.46844 6.93969L7.52844 9.99969C7.78844 10.2597 8.20844 10.2597 8.46844 9.99969L11.5284 6.93969C11.7884 6.67969 11.7884 6.25969 11.5284 5.99969C11.2684 5.74635 10.8418 5.73969 10.5818 5.99969Z" fill="#202124"/>
        </svg>
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
