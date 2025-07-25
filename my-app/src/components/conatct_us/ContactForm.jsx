import React, { useState } from 'react';
import axios from 'axios';
import Navbar from '../layout/Navbar';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    screenshot: null,
  });

  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    data.append('message', formData.message);
    data.append('screenshot', formData.screenshot);

    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/contact/send-email`, data);
      setAlert({ show: true, message: '🎉 Sent successfully!', type: 'success' });
    } catch (error) {
      console.error(error);
      setAlert({ show: true, message: '❌ Failed to send email.', type: 'error' });
    }

    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 4000); // hide after 4s
  };

  return (
    <>
    <Navbar/>
    <div style={{ backgroundImage: 'url(/CTA_banner.jpg)' }} className="bg-cover bg-center h-80">
    
    </div>
    <div className="p-4 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 space-y-4">
        <h2 className="text-3xl font-bold text-gray-800">Contact Us</h2>

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="email"
          name="email"
          placeholder="Your Email"
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          name="message"
          placeholder="Your Message"
          onChange={handleChange}
          required
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="file"
          name="screenshot"
          accept="image/*"
          onChange={handleChange}
          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
        >
          📤 Submit
        </button>
      </form>

      {/* Alert */}
      {alert.show && (
        <div
          className={`mt-6 transition-all duration-300 ease-in-out p-4 rounded-lg text-white font-semibold ${
            alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'
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
