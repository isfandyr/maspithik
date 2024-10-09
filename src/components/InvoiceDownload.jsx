import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { FiDownload } from 'react-icons/fi';

// Definisikan styles untuk PDF
const styles = StyleSheet.create({
  page: { padding: '5%', fontFamily: 'Helvetica' },
  header: { marginBottom: '3%', alignItems: 'center' },
  logo: { width: '30%', maxWidth: 120, marginBottom: '2%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1a365d', textAlign: 'center', marginBottom: '2%' },
  subtitle: { fontSize: 22, marginBottom: '3%', color: '#2c5282', fontWeight: 'bold', textAlign: 'center' },
  infoContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '3%' },
  infoColumn: { width: '48%', marginBottom: '2%' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: '1%', color: '#2d3748' },
  infoText: { fontSize: 13, marginBottom: '1%', color: '#4a5568' },
  table: { display: 'table', width: '100%', borderStyle: 'solid', borderColor: '#e2e8f0', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, marginBottom: '3%' },
  tableRow: { margin: 'auto', flexDirection: 'row', borderBottomColor: '#e2e8f0', borderBottomWidth: 1 },
  tableHeader: { backgroundColor: '#edf2f7' },
  tableCol: { width: '25%', borderStyle: 'solid', borderColor: '#e2e8f0', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: '1%', marginBottom: '1%', fontSize: 12, color: '#4a5568' },
  total: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginTop: '2%', color: '#2d3748' },
  footer: { position: 'absolute', bottom: '3%', left: '5%', right: '5%', textAlign: 'center', color: '#718096', fontSize: 11 }
});

// Fungsi untuk menerjemahkan status
const terjemahkanStatus = (status) => {
  const terjemahan = {
    'pending': 'Menunggu',
    'processing': 'Diproses',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
    'paid': 'Dibayar',
    'unpaid': 'Belum Dibayar'
  };
  return terjemahan[status.toLowerCase()] || status;
};

// Komponen PDF
const InvoicePDF = ({ transaction }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Image style={styles.logo} src="/path/to/your/logo.png" />
        <Text style={styles.title}>Transaksi Angkringan Mas Pithik</Text>
      </View>
      
      <Text style={styles.subtitle}>Pesanan #{transaction.id}</Text>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoTitle}>Informasi Pesanan:</Text>
          <Text style={styles.infoText}>Tanggal: {new Date(transaction.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          <Text style={styles.infoText}>Status Pesanan: {terjemahkanStatus(transaction.status)}</Text>
        </View>
        <View style={styles.infoColumn}>
          <Text style={styles.infoTitle}>Informasi Pembayaran:</Text>
          <Text style={styles.infoText}>Metode: {transaction.payment_method}</Text>
          <Text style={styles.infoText}>Status Pembayaran: {terjemahkanStatus(transaction.payment_status)}</Text>
        </View>
      </View>
      
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableCol}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Item</Text></View>
          <View style={styles.tableCol}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Jumlah</Text></View>
          <View style={styles.tableCol}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Harga</Text></View>
          <View style={styles.tableCol}><Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Total</Text></View>
        </View>
        {transaction.order_items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.menu_items.title}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.quantity}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Rp {item.price.toLocaleString('id-ID')}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Rp {(item.quantity * item.price).toLocaleString('id-ID')}</Text></View>
          </View>
        ))}
      </View>
      
      <Text style={styles.total}>
        Total: Rp {transaction.total_amount.toLocaleString('id-ID')}
      </Text>
      
      <Text style={styles.footer}>
        Terima kasih telah mampir di Angkringan Mas Pithik.
      </Text>
    </Page>
  </Document>
);

const InvoiceDownload = ({ transaction }) => {
  return (
    <PDFDownloadLink
      document={<InvoicePDF transaction={transaction} />}
      fileName={`transaksi_angkringan_mas_pithik_${transaction.id}.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <button
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-flex items-center transition duration-300 text-sm sm:text-base"
        >
          {loading ? 'Menyiapkan Transaksi...' : (
            <>
              Unduh Transaksi
              <FiDownload className="ml-2" />
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
};

export default InvoiceDownload;