import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import axios from 'axios';

const WhatsAppButton = () => {
  const [phoneNumber, setPhoneNumber] = useState('254700000000');
  
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/system/settings');
      if (response.data.success) {
        const whatsapp = response.data.data.support_whatsapp;
        if (whatsapp) {
          // Clean the number (remove spaces, +, etc.)
          const cleanNumber = whatsapp.replace(/[^0-9]/g, '');
          setPhoneNumber(cleanNumber);
        }
      }
    } catch (error) {
      console.error('Failed to load WhatsApp settings:', error);
    }
  };
  
  const handleClick = () => {
    const message = encodeURIComponent('Hello, I need support with AgriCertify system.');
    const url = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 
                 text-white rounded-full shadow-lg flex items-center justify-center
                 transition-all hover:scale-110 focus:outline-none focus:ring-2 
                 focus:ring-green-500 focus:ring-offset-2"
      title="Chat on WhatsApp"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
      {/* Badge for unread messages (optional) */}
      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs 
                       flex items-center justify-center animate-pulse">
        1
      </span>
    </button>
  );
};

export default WhatsAppButton;
