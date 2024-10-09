import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { FiDownload } from 'react-icons/fi';

// Definisikan styles untuk PDF
const styles = StyleSheet.create({
  page: { padding: '5%', fontFamily: 'Helvetica' },
  header: { marginBottom: '2%', alignItems: 'center' },
  logo: { width: '30%', maxWidth: 120, marginBottom: '1%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000000', textAlign: 'center', marginBottom: '1%' },
  subtitle: { fontSize: 22, marginBottom: '2%', color: '#00008B', fontWeight: 'bold', textAlign: 'center' },
  infoContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '2%' },
  infoColumn: { width: '48%', marginBottom: '1%' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: '0.5%', color: '#000000' },
  infoText: { fontSize: 13, marginBottom: '0.5%', color: '#000000', fontWeight: 'bold' },
  infoTextRed: { fontSize: 13, marginBottom: '0.5%', color: '#FF0000', fontWeight: 'bold' },
  table: { display: 'table', width: '100%', borderStyle: 'solid', borderColor: '#000000', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, marginBottom: '2%' },
  tableRow: { margin: 'auto', flexDirection: 'row', borderBottomColor: '#000000', borderBottomWidth: 1 },
  tableHeader: { backgroundColor: '#E0E0E0' },
  tableCol: { width: '25%', borderStyle: 'solid', borderColor: '#000000', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: '0.5%', marginBottom: '0.5%', fontSize: 12, color: '#000000', fontWeight: 'bold' },
  total: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginTop: '1%', color: '#000000' },
  footer: { position: 'absolute', bottom: '2%', left: '5%', right: '5%', textAlign: 'center', color: '#000000', fontSize: 11, fontWeight: 'bold' },
  note: { marginTop: '2%', fontSize: 12, fontStyle: 'italic', color: '#000000' }
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
          <Text style={styles.infoText}>Tanggal: <Text style={styles.infoTextRed}>{new Date(transaction.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</Text></Text>
          <Text style={styles.infoText}>Status Pesanan: <Text style={styles.infoTextRed}>{terjemahkanStatus(transaction.status)}</Text></Text>
        </View>
        <View style={styles.infoColumn}>
          <Text style={styles.infoTitle}>Informasi Pembayaran:</Text>
          <Text style={styles.infoText}>Metode: <Text style={styles.infoTextRed}>{transaction.payment_method}</Text></Text>
          <Text style={styles.infoText}>Status Pembayaran: <Text style={styles.infoTextRed}>{terjemahkanStatus(transaction.payment_status)}</Text></Text>
        </View>
      </View>
      
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Item</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Jumlah</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Harga</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Total</Text></View>
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
      
      <Text style={styles.note}>
        Catatan: Tunjukkan bukti pembayaran ini ke admin Angkringan Mas Pithik.
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
          {loading ? 'Menyiapkan Transaksi....' : (
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