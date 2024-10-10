import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { FiDownload } from 'react-icons/fi';
import { Tooltip } from 'react-tooltip';

// Definisikan styles untuk PDF
const styles = StyleSheet.create({
  page: { padding: '5%', fontFamily: 'Helvetica', backgroundColor: '#F8F8F8' },
  header: { marginBottom: '5%', alignItems: 'center', borderBottom: '2 solid #000000', paddingBottom: '3%' },
  logo: { width: '30%', maxWidth: 120, marginBottom: '2%', alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center', marginBottom: '1%' },
  subtitle: { fontSize: 22, marginBottom: '3%', color: '#3D3D3D', fontWeight: 'bold', textAlign: 'center' },
  infoContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '5%', backgroundColor: '#FFFFFF', padding: '3%', borderRadius: 8 },
  infoColumn: { width: '48%', marginBottom: '2%' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: '2%', color: '#1A1A1A', borderBottom: '1 solid #CCCCCC', paddingBottom: '2%' },
  infoText: { fontSize: 13, marginBottom: '1%', color: '#3D3D3D' },
  infoTextHighlight: { fontSize: 13, marginBottom: '1%', color: '#0066CC', fontWeight: 'bold' },
  table: { display: 'table', width: '100%', borderStyle: 'solid', borderColor: '#CCCCCC', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, marginBottom: '5%' },
  tableRow: { margin: 'auto', flexDirection: 'row', borderBottomColor: '#CCCCCC', borderBottomWidth: 1 },
  tableHeader: { backgroundColor: '#E6E6E6' },
  tableCol: { width: '25%', borderStyle: 'solid', borderColor: '#CCCCCC', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: '2%', marginBottom: '2%', fontSize: 12, color: '#3D3D3D' },
  total: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginTop: '3%', color: '#1A1A1A', backgroundColor: '#E6E6E6', padding: '2%', borderRadius: 4 },
  footer: { position: 'absolute', bottom: '5%', left: '5%', right: '5%', textAlign: 'center', color: '#666666', fontSize: 11, borderTop: '1 solid #CCCCCC', paddingTop: '2%' },
  note: { marginTop: '5%', fontSize: 12, fontStyle: 'italic', color: '#666666', backgroundColor: '#FFFFFF', padding: '2%', borderRadius: 4 }
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
        <Text style={styles.title}>Angkringan Mas Pithik</Text>
        <Text style={styles.subtitle}>Invoice Pesanan #{transaction.id}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoColumn}>
          <Text style={styles.infoTitle}>Informasi Pesanan</Text>
          <Text style={styles.infoText}>Tanggal: <Text style={styles.infoTextHighlight}>{new Date(transaction.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</Text></Text>
          <Text style={styles.infoText}>Status: <Text style={styles.infoTextHighlight}>{terjemahkanStatus(transaction.status)}</Text></Text>
          <Text style={styles.infoText}>Nama Pemesan: <Text style={styles.infoTextHighlight}>{transaction.users?.name || 'Tidak diketahui'}</Text></Text>
        </View>
        <View style={styles.infoColumn}>
          <Text style={styles.infoTitle}>Informasi Pembayaran</Text>
          <Text style={styles.infoText}>Metode: <Text style={styles.infoTextHighlight}>{transaction.payment_method}</Text></Text>
          <Text style={styles.infoText}>Status: <Text style={styles.infoTextHighlight}>{terjemahkanStatus(transaction.payment_status)}</Text></Text>
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
      
      <Text style={styles.note}>
        Catatan: Tunjukkan bukti pembayaran ini ke admin Angkringan Mas Pithik.
      </Text>
      
      <Text style={styles.footer}>
        Terima kasih telah mampir di Angkringan Mas Pithik. Kami menantikan kunjungan Anda kembali!
      </Text>
    </Page>
  </Document>
);

const InvoiceDownload = ({ transaction, tooltipId, tooltipContent }) => {
  return (
    <>
      <PDFDownloadLink
        document={<InvoicePDF transaction={transaction} />}
        fileName={`transaksi_angkringan_mas_pithik_${transaction.id}.pdf`}
      >
        {({ blob, url, loading, error }) => (
          <button
            disabled={loading}
            className="text-black font-bold py-2 px-4 rounded inline-flex items-center transition duration-300 text-sm sm:text-base"
            data-tooltip-id={tooltipId}
            data-tooltip-content={tooltipContent}
          >
            {loading ? 'Menyiapkan Transaksi....' : (
              <>
                <FiDownload className="ml-2" />
              </>
            )}
          </button>
        )}
      </PDFDownloadLink>
      <Tooltip id={tooltipId} />
    </>
  );
};

export default InvoiceDownload;