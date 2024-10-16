import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FiEye, FiCheck, FiX, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PaymentManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showProofOfPayment, setShowProofOfPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const getImageUrl = (imageUrl) => {
    if (imageUrl && imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl) {
      return supabase.storage.from('buktibyr').getPublicUrl(imageUrl).data.publicUrl;
    }
    return null;
  };

  // Fungsi untuk mengambil data pesanan dari database
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error, count } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            quantity,
            price,
            menu_items (id, title)
          ),
          users (id, email, name),
          proof_of_payment_url
        `, { count: 'exact' })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const processedData = data.map(order => ({
          ...order,
          proof_of_payment_url: getImageUrl(order.proof_of_payment_url)
        }));
        setOrders(processedData);
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const getIndonesianStatus = (status) => {
    const statusMap = {
      'pending': 'Menunggu',
      'processing': 'Diproses',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan',
      'paid': 'Dibayar',
      'failed': 'Gagal'
    };
    return statusMap[status] || status;
  };

   // mengupdate status pembayaran
  const handleUpdatePaymentStatus = async (orderId, newStatus, userId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ payment_status: newStatus })
        .eq('id', orderId)
        .single();
      if (error) throw error;
      setOrders(orders.map(order => order.id === orderId ? { ...order, payment_status: newStatus } : order));
      toast.success(`Status pembayaran diperbarui menjadi ${getIndonesianStatus(newStatus)}`);
      
      await sendNotification(userId, `Status pembayaran untuk pesanan #${orderId} diperbarui menjadi ${getIndonesianStatus(newStatus)}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Gagal memperbarui status pembayaran');
    }
  };

   // mengupdate status pesanan
  const handleUpdateOrderStatus = async (orderId, newStatus, userId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
            quantity
          )
        `)
        .single();

      if (error) throw error;

      // Jika status baru adalah 'processing' atau 'completed', kurangi stok
      if (newStatus === 'processing' || newStatus === 'completed') {
        await reduceStock(data.order_items);
      }

      setOrders(orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
      toast.success(`Status pesanan diperbarui menjadi ${getIndonesianStatus(newStatus)}`);
      
      // Kirim notifikasi kepada user
      await sendNotification(userId, `Status pesanan untuk pesanan #${orderId} diperbarui menjadi ${getIndonesianStatus(newStatus)}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Gagal memperbarui status pesanan');
    }
  };

  // mengirim notifikasi
  const sendNotification = async (userId, message) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({ user_id: userId, message, read: false });
      if (error) throw error;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Fungsi untuk mengurangi stok
  const reduceStock = async (orderItems) => {
    for (const item of orderItems) {
      const { data, error } = await supabase
        .from('menu_items')
        .select('stock')
        .eq('id', item.menu_item_id)
        .single();

      if (error) {
        console.error('Error fetching menu item:', error);
        continue;
      }

      const newStock = Math.max(0, data.stock - item.quantity);
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ stock: newStock })
        .eq('id', item.menu_item_id);

      if (updateError) {
        console.error('Error updating stock:', updateError);
      }
    }
  };

  const renderOrderDetails = (order) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4">Detail Pesanan</h3>
        <p><strong>ID Pesanan:</strong> {order.id}</p>
        <p><strong>Tanggal:</strong> {new Date(order.created_at).toLocaleString()}</p>
        <p><strong>Nama Pelanggan:</strong> {order.users?.name || 'Tidak diketahui'}</p>
        <p><strong>Email Pelanggan:</strong> {order.users?.email || 'Tidak diketahui'}</p>
        <p><strong>Status:</strong> {getIndonesianStatus(order.status)}</p>
        <p><strong>Status Pembayaran:</strong> {getIndonesianStatus(order.payment_status)}</p>
        <p><strong>Metode Pembayaran:</strong> {order.payment_method}</p>
        <h4 className="font-bold mt-4 mb-2">Item:</h4>
        {order.order_items && order.order_items.length > 0 ? (
          <ul className="list-disc list-inside">
            {order.order_items.map((item, index) => (
              <li key={index}>
                {item.menu_items.title} x{item.quantity} - Rp {item.price.toLocaleString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>Tidak ada item dalam pesanan ini.</p>
        )}
        <p className="font-bold mt-4">Total: Rp {order.total_amount.toLocaleString()}</p>
        
        <div className="mt-6 flex justify-end">
          <button onClick={() => setSelectedOrder(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Tutup</button>
        </div>
      </div>
    </div>
  );

  const renderProofOfPayment = (order) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold mb-4">Bukti Pembayaran</h3>
        <p><strong>ID Pesanan:</strong> {order.id}</p>
        <p><strong>Metode Pembayaran:</strong> {order.payment_method}</p>
        
        {order.payment_method !== 'Bayar di Tempat' && order.proof_of_payment_url ? (
          <div className="mt-4">
            <img 
              src={order.proof_of_payment_url} 
              alt="Bukti Pembayaran" 
              className="max-w-full h-auto" 
            />
          </div>
        ) : order.payment_method === 'Bayar di Tempat' ? (
          <p className="mt-4"><em>Bayar di tempat - Tidak perlu bukti pembayaran</em></p>
        ) : (
          <p className="mt-4"><em>Belum ada bukti pembayaran yang diunggah</em></p>
        )}
        
        <div className="mt-6 flex justify-end">
          <button onClick={() => setShowProofOfPayment(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md">Tutup</button>
        </div>
      </div>
    </div>
  );

  const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === i ? 'bg-primary text-white' : 'bg-gray-200'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
        >
          <FiChevronLeft />
        </button>
        {pageNumbers}
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50"
        >
          <FiChevronRight />
        </button>
      </div>
    );
  };

  if (loading) {
    return <div>Memuat...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Pembayaran</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">ID Pesanan</th>
              <th className="p-2 text-left">Tanggal</th>
              <th className="p-2 text-left">Total</th>
              <th className="p-2 text-left">Status Order</th>
              <th className="p-2 text-left">Status Pembayaran</th>
              <th className="p-2 text-left">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b">
                <td className="p-2">{order.id}</td>
                <td className="p-2">{new Date(order.created_at).toLocaleString()}</td>
                <td className="p-2">Rp {order.total_amount.toLocaleString()}</td>
                <td className="p-2">
                  <select
                    value={order.status}
                    onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value, order.user_id)}
                    className="border rounded p-1"
                  >
                    <option value="pending">Menunggu</option>
                    <option value="processing">Diproses</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </td>
                <td className="p-2">
                  <select
                    value={order.payment_status}
                    onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value, order.user_id)}
                    className="border rounded p-1"
                  >
                    <option value="pending">Menunggu</option>
                    <option value="paid">Dibayar</option>
                    <option value="failed">Gagal</option>
                  </select>
                </td>
                <td className="p-2 flex">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-blue-500 hover:text-blue-700 mr-2"
                    title="Lihat Detail Pesanan"
                  >
                    <FiEye />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowProofOfPayment(true);
                    }}
                    className="text-green-500 hover:text-green-700 mr-2"
                    title="Lihat Bukti Pembayaran"
                  >
                    <FiFileText />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPagination()}
      {selectedOrder && !showProofOfPayment && renderOrderDetails(selectedOrder)}
      {selectedOrder && showProofOfPayment && renderProofOfPayment(selectedOrder)}
    </div>
  );
};

export default PaymentManagement;
