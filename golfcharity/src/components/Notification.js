import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Notification() {
  const { notification } = useApp();
  if (!notification) return null;

  const icons = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
  };

  return (
    <div className={`notification notification-${notification.type || 'success'}`}>
      {icons[notification.type || 'success']}
      {notification.message}
    </div>
  );
}
