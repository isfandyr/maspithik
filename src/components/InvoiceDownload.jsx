import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { FiDownload } from 'react-icons/fi';

// Definisikan styles untuk PDF
const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 10 },
  subtitle: { fontSize: 18, marginBottom: 10 },
  text: { fontSize: 12, marginBottom: 5 },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: 5, fontSize: 10 }
});

// Komponen PDF
const InvoicePDF = ({ transaction }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Invoice</Text>
      <Text style={styles.subtitle}>Pesanan #{transaction.id}</Text>
      <View style={styles.text}>
        <Text>Tanggal: {new Date(transaction.created_at).toLocaleDateString()}</Text>
        <Text>Status: {transaction.status}</Text>
        <Text>Metode Pembayaran: {transaction.payment_method}</Text>
        <Text>Status Pembayaran: {transaction.payment_status}</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Item</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Quantity</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Harga</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Total</Text></View>
        </View>
        {transaction.order_items.map((item, index) => (
          <View style={styles.tableRow} key={index}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.menu_items.title}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{item.quantity}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Rp {item.price.toLocaleString()}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Rp {(item.quantity * item.price).toLocaleString()}</Text></View>
          </View>
        ))}
      </View>
      <Text style={[styles.text, { marginTop: 10, textAlign: 'right' }]}>
        Total: Rp {transaction.total_amount.toLocaleString()}
      </Text>
    </Page>
  </Document>
);

const InvoiceDownload = ({ transaction }) => {
  return (
    <PDFDownloadLink
      document={<InvoicePDF transaction={transaction} />}
      fileName={`invoice_transaction_${transaction.id}.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <button
          disabled={loading}
          className="bg-black hover:bg-gray-800 text-white font-bold py-2 px-4 rounded inline-flex items-center"
        >
          {loading ? 'Menyiapkan Invoice...' : (
            <>
              Unduh Invoice
              <FiDownload className="ml-2" />
            </>
          )}
        </button>
      )}
    </PDFDownloadLink>
  );
};

export default InvoiceDownload;