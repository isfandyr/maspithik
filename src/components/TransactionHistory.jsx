import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEye } from 'react-icons/fi';
import { supabase } from '../services/supabase';
import toast from 'react-hot-toast';
import InvoiceDownload from './InvoiceDownload';
import { Tooltip } from 'react-tooltip';

const TransactionHistory = ({ isOpen, onClose, session }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    if (session && isOpen) {
      fetchTransactions();
    }
  }, [session, isOpen]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            menu_item_id,
            quantity,
            price,
            menu_items (title)
          ),
          users (name)
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat riwayat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-yellow-500';
      case 'processing':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'dibayar':
        return 'text-green-500';
      case 'unpaid':
      case 'belum dibayar':
        return 'text-red-500';
      case 'pending':
      case 'menunggu':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getIndonesianStatus = (status) => {
    const statusMap = {
      'pending': 'Menunggu',
      'processing': 'Diproses',
      'completed': 'Selesai',
      'cancelled': 'Dibatalkan',
      'paid': 'Dibayar',
      'unpaid': 'Belum Dibayar',
      'failed': 'Gagal'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
  };

  const closeTransactionModal = () => {
    setSelectedTransaction(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-primary">Riwayat Transaksi</h2>
              <button 
                onClick={onClose} 
                className="text-muted-foreground hover:text-primary"
                data-tooltip-id="close-tooltip"
                data-tooltip-content="Tutup riwayat transaksi"
              >
                <FiX size={24} />
              </button>
              <Tooltip id="close-tooltip" />
            </div>
            {loading ? (
              <p className="text-center text-muted-foreground">Memuat transaksi...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground">Tidak ada transaksi ditemukan.</p>
            ) : (
              <div className="space-y-6">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Pesanan #{transaction.id}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Nama Pemesan:</span>{' '}
                      <span className="font-bold">{transaction.users?.name || 'Tidak diketahui'}</span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Status:</span>{' '}
                      <span className={`font-bold ${getStatusColor(transaction.status)}`}>
                        {getIndonesianStatus(transaction.status)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Metode Pembayaran:</span> {transaction.payment_method}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Status Pembayaran:</span>{' '}
                      <span className={`font-bold ${getPaymentStatusColor(transaction.payment_status)}`}>
                        {getIndonesianStatus(transaction.payment_status)}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Item:</span>
                      <ul className="list-disc list-inside">
                        {transaction.order_items.map((item, index) => (
                          <li key={index}>
                            {item.menu_items.title} x{item.quantity} - Rp {item.price.toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <div className="font-semibold">
                        Total: Rp {transaction.total_amount.toLocaleString()}
                      </div>
                      <div className="flex space-x-2">
                        {transaction.status.toLowerCase() === 'completed' && (
                          <>
                            <button
                              onClick={() => openTransactionModal(transaction)}
                              className="text-primary hover:text-primary-dark"
                              data-tooltip-id="view-detail-tooltip"
                              data-tooltip-content="Lihat detail transaksi"
                            >
                              <FiEye size={20} />
                            </button>
                            <Tooltip id="view-detail-tooltip" />
                            <InvoiceDownload 
                              transaction={transaction} 
                              tooltipId={`download-invoice-tooltip-${transaction.id}`}
                              tooltipContent="Unduh invoice transaksi"
                            />
                            <Tooltip id={`download-invoice-tooltip-${transaction.id}`} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Modal untuk menampilkan detail transaksi */}
      <AnimatePresence>
        {selectedTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={closeTransactionModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-primary mb-2">ID Pesanan</h3>
                  <p className="text-9xl font-bold">{selectedTransaction.id}</p>
                </div>
                
                <div className="border-t border-b border-gray-200 py-4">
                  <p className="font-semibold mb-2">Nama Pemesan:</p>
                  <p className="text-lg">{selectedTransaction.users?.name || 'Tidak diketahui'}</p>
                </div>
                
                <div className="border-t border-b border-gray-200 py-4">
                  <p className="font-semibold mb-2">Metode Pembayaran:</p>
                  <p className="text-lg">{selectedTransaction.payment_method}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Item Pesanan:</h4>
                  <div className="space-y-2">
                    {selectedTransaction.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{item.menu_items.title} x{item.quantity}</span>
                        <span>Rp {item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span>Rp {selectedTransaction.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={closeTransactionModal}
                  className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary-dark transition duration-300"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};

export default TransactionHistory;