import React, { useState } from 'react';
import Navbar from '../layout/Navbar';

const ContactForm = () => {
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [iframeLoadCount, setIframeLoadCount] = useState(0);

  const handleIframeLoad = () => {
    setIframeLoadCount((count) => {
      const next = count + 1;
      if (next >= 2) {
        setAlert({ show: true, message: '🎉 Submitted successfully!', type: 'success' });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 4000);
      }
      return next;
    });
  };

  return (
    <>
      <Navbar />
      <div style={{ backgroundImage: 'url(/CTA_banner.png)' }} className="bg-cover bg-center h-80">

      </div>
      <div className="p-4 max-w-xl mx-auto">


        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLScHrLwnLzDbdEYpl0Mp8IebiwMQWWhTLOtJGPU1KBqJX8XYEQ/viewform?embedded=true"
          width="640"
          height="883"
          frameBorder="0"
          marginHeight="0"
          marginWidth="0"
          onLoad={handleIframeLoad}
        >
          Loading…
        </iframe>

        {/* Alert */}
        {alert.show && (
          <div
            className={`mt-6 transition-all duration-300 ease-in-out p-4 rounded-lg text-white font-semibold ${alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
          >
            {alert.message}
          </div>
        )}
      </div>
    </>
  );
};

export default ContactForm;
