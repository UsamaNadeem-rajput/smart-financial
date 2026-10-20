import React from 'react';

const PageLoader = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F2F5EE',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Instrument Sans', system-ui, -apple-system, sans-serif",
        color: '#0E1A14',
        padding: '24px',
        boxSizing: 'border-box',
      }}
      aria-label="Loading page content"
      role="status"
    >
      <style>{`
        @keyframes sf-loader-slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(20%); }
          100% { transform: translateX(200%); }
        }
        .sf-loader-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 50%;
          background: #C8F135;
          animation: sf-loader-slide 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
      <div
        style={{
          background: '#FFFFFF',
          border: '2px solid #0E1A14',
          borderRadius: '8px',
          padding: '28px 36px',
          boxShadow: '4px 4px 0px #0E1A14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '300px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <img
          src="/final.png"
          alt="Smart Financial"
          style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
        />
        <div
          style={{
            width: '100%',
            height: '6px',
            background: '#F2F5EE',
            border: '1.5px solid #0E1A14',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div className="sf-loader-bar" />
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#44544B',
          }}
        >
          Loading workspace...
        </span>
      </div>
    </div>
  );
};

export default PageLoader;
