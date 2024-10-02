import React, { useState, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { supabase } from '../services/supabase';


const Notifications = ({ session, onNotificationClick }) => {
    
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      
      // Mengaktifkan pemantauan perubahan data pada tabel 'notifications' di database untuk mendapatkan notifikasi baru secara real-time.
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handleNewNotification)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  // Mengambil notifikasi dari database untuk pengguna
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('read', false)  
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error);
    } else {
      setNotifications(data);
    }
  };

  // Menangani notifikasi baru yang ditambahkan ke tabel 'notifications'
  const handleNewNotification = (payload) => {
    if (payload.new.user_id === session.user.id) {
      setNotifications(prev => [payload.new, ...prev]);
    }
  };

  
  return (
    <div className="relative">
      <button
        onClick={onNotificationClick}
        className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
      >
        <FiBell size={24} />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {notifications.length}
          </span>
        )}
      </button>
    </div>
  );
};

export default Notifications;