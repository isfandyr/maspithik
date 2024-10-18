import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { FiDollarSign, FiShoppingBag, FiUsers, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminOverview = () => {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalItemsSold, setTotalItemsSold] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [topMenuItems, setTopMenuItems] = useState([]);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [endDate, setEndDate] = useState(new Date());
  const [filterType, setFilterType] = useState('daily');
  const [filteredRevenue, setFilteredRevenue] = useState(0);

  // Mengambil data dari Supabase
  const fetchWithRetry = async (fetcher, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fetcher();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  };

  useEffect(() => {
    fetchOverviewData();
    fetchDailyRevenue();
    fetchTopMenuItems();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const { data: revenueData } = await fetchWithRetry(() => 
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid')
      );
      const revenue = revenueData.reduce((sum, order) => sum + order.total_amount, 0);
      setTotalRevenue(revenue);

      // Mengambil total item yang terjual dari tabel order_items
      const { data: itemsData } = await fetchWithRetry(() => 
        supabase.from('order_items').select('quantity')
      );
      const itemsSold = itemsData.reduce((sum, item) => sum + item.quantity, 0);
      setTotalItemsSold(itemsSold);

      // Menghapus bagian yang mengambil jumlah total pengguna

      const { count: ordersCount } = await fetchWithRetry(() => 
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      );
      setActiveOrders(ordersCount);

    } catch (error) {
      console.error('Error fetching overview data:', error);
      setError('Failed to load overview data. Please try again later.');
      toast.error('Gagal memuat data ikhtisar');
    } finally {
      setLoading(false);
    }
  };

   // Mengambil data pendapatan untuk ditampilkan di grafik
  const fetchDailyRevenue = async () => {
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase
          .from('orders')
          .select('created_at, total_amount')
          .eq('payment_status', 'paid')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: true })
      );

      if (error) throw error;

      // Mengelompokkan pendapatan berdasarkan tanggal atau bulan
      const groupedData = data.reduce((acc, order) => {
        const date = new Date(order.created_at);
        const key = filterType === 'daily' 
          ? date.toLocaleDateString() 
          : `${date.getFullYear()}-${date.getMonth() + 1}`;
        acc[key] = (acc[key] || 0) + order.total_amount;
        return acc;
      }, {});

      setDailyRevenue(Object.entries(groupedData).map(([date, amount]) => ({ date, amount })));
      
      // Menghitung total pendapatan untuk periode yang dipilih
      const totalFilteredRevenue = Object.values(groupedData).reduce((sum, amount) => sum + amount, 0);
      setFilteredRevenue(totalFilteredRevenue);
    } catch (error) {
      console.error('Error fetching daily revenue:', error);
      toast.error('Gagal memuat data pendapatan');
    }
  };

  useEffect(() => {
    fetchDailyRevenue();
  }, [startDate, endDate, filterType]);

  const fetchTopMenuItems = async () => {
    try {
      const { data, error } = await fetchWithRetry(() => 
        supabase.from('order_items').select('menu_items(title), quantity').order('quantity', { ascending: false }).limit(5)
      );

      if (error) throw error;

      const topItems = data.reduce((acc, item) => {
        const title = item.menu_items.title;
        acc[title] = (acc[title] || 0) + item.quantity;
        return acc;
      }, {});

      setTopMenuItems(Object.entries(topItems).map(([title, quantity]) => ({ title, quantity })));
    } catch (error) {
      console.error('Error fetching top menu items:', error);
      toast.error('Gagal memuat data menu terpopuler');
    }
  };

  // Data untuk grafik pendapatan harian
  const revenueChartData = {
    labels: dailyRevenue.map(item => item.date),
    datasets: [
      {
        label: 'Pendapatan',
        data: dailyRevenue.map(item => item.amount),
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderColor: 'rgb(0, 0, 0)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (loading) return <div>Memuat...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-0">
        <div className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Total Pendapatan</p>
              <p className="text-3xl font-bold">Rp {totalRevenue.toLocaleString()}</p>
            </div>
            <FiDollarSign className="text-4xl text-black" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Item Terjual</p>
              <p className="text-3xl font-bold">{totalItemsSold}</p>
            </div>
            <FiShoppingBag className="text-4xl text-black" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Pesanan Aktif</p>
              <p className="text-3xl font-bold">{activeOrders}</p>
            </div>
            <FiActivity className="text-4xl text-black" />
          </div>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">Pendapatan Terakhir</p>
              <p className="text-3xl font-bold">Rp {filteredRevenue.toLocaleString()}</p>
            </div>
            <FiDollarSign className="text-4xl text-black" />
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Grafik Pendapatan</h2>
        <div className="flex space-x-4 mb-4">
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            className="p-2 border rounded"
          />
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            className="p-2 border rounded"
          />
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="daily">Harian</option>
            <option value="monthly">Bulanan</option>
          </select>
        </div>
        <div style={{ height: '300px' }}>
          <Bar data={revenueChartData} options={chartOptions} />
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Menu Terpopuler</h2>
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left">Menu</th>
              <th className="text-right">Jumlah Terjual</th>
            </tr>
          </thead>
          <tbody>
            {topMenuItems.map((item, index) => (
              <tr key={index}>
                <td>{item.title}</td>
                <td className="text-right">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOverview;