import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';

const getReceiptHTML = (saleData) => {
  const { cart, customerData, customerMode, guestName, guestPhone, paymentMethod, notes, total } = saleData;

  const itemsRows = cart.map(item => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${item.price.toLocaleString()} FCFA</td>
      <td style="text-align:right">${(item.price * item.quantity).toLocaleString()} FCFA</td>
    </tr>
  `).join('');

  const customerName = customerMode === 'with' && customerData
    ? `${customerData.firstName} ${customerData.lastName}`
    : guestName || 'Client sans compte';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 300px; }
        .header { text-align: center; margin-bottom: 16px; border-bottom: 2px dashed #000; padding-bottom: 12px; }
        .logo { font-size: 22px; font-weight: bold; color: #00b368; }
        .subtitle { font-size: 11px; color: #555; margin-top: 4px; }
        .date { font-size: 11px; color: #555; margin-top: 8px; }
        .section { margin: 12px 0; }
        .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #555; margin-bottom: 6px; }
        .customer-info { font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        th { font-size: 10px; text-transform: uppercase; color: #555; padding: 4px 0; border-bottom: 1px solid #000; text-align: left; }
        td { padding: 5px 0; font-size: 11px; border-bottom: 1px dashed #ddd; vertical-align: top; }
        .total-section { border-top: 2px solid #000; margin-top: 8px; padding-top: 8px; }
        .total-row { display: flex; justify-content: space-between; margin: 4px 0; font-size: 12px; }
        .total-final { font-weight: bold; font-size: 15px; color: #00b368; }
        .payment { margin-top: 8px; font-size: 11px; }
        .notes { margin-top: 8px; font-size: 11px; color: #555; font-style: italic; }
        .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 2px dashed #000; font-size: 11px; color: #555; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">💊 PharmaGO</div>
        <div class="subtitle">Votre pharmacie en ligne</div>
        <div class="date">${new Date().toLocaleString('fr-FR')}</div>
      </div>

      <div class="section">
        <div class="section-title">Client</div>
        <div class="customer-info">${customerName}</div>
        ${guestPhone ? `<div class="customer-info">📞 ${guestPhone}</div>` : ''}
        ${customerData?.email ? `<div class="customer-info">✉ ${customerData.email}</div>` : ''}
      </div>

      <div class="section">
        <div class="section-title">Produits</div>
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th style="text-align:center">Qté</th>
              <th style="text-align:right">P.U</th>
              <th style="text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
      </div>

      <div class="total-section">
        <div class="total-row total-final">
          <span>TOTAL</span>
          <span>${total.toLocaleString()} FCFA</span>
        </div>
        <div class="payment">
          💳 Paiement: ${paymentMethod === 'cash' ? 'Espèces' : paymentMethod}
        </div>
        ${notes ? `<div class="notes">📝 ${notes}</div>` : ''}
      </div>

      <div class="footer">
        <p>Merci pour votre confiance !</p>
        <p>🇨🇩 Congo - Kinshasa</p>
      </div>
    </body>
    </html>
  `;
};

export default function PrintReceiptModal({ visible, onClose, saleData }) {
  const [printing, setPrinting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const handlePrint = async () => {
    try {
      setPrinting(true);
      await Print.printAsync({
        html: getReceiptHTML(saleData),
        // Sur iOS : dialogue imprimante AirPrint automatique
        // Sur Android : dialogue d'impression système automatique
      });
    } catch (error) {
      // L'utilisateur a annulé ou pas d'imprimante
      console.log('Impression annulée ou erreur:', error);
    } finally {
      setPrinting(false);
    }
  };

  const handleSharePDF = async () => {
    try {
      setSharing(true);
      const { uri } = await Print.printToFileAsync({
        html: getReceiptHTML(saleData),
        base64: false,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Partager le reçu',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.log('Partage annulé ou erreur:', error);
    } finally {
      setSharing(false);
    }
  };

  if (!saleData) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>

          {/* Icône succès */}
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#00b368" />
          </View>

          <Text style={styles.title}>Vente enregistrée !</Text>
          <Text style={styles.amount}>
            {saleData.total?.toLocaleString()} FCFA
          </Text>
          <Text style={styles.subtitle}>Voulez-vous imprimer le reçu ?</Text>

          {/* Bouton imprimer */}
          <TouchableOpacity
            style={styles.printBtn}
            onPress={handlePrint}
            disabled={printing}
          >
            {printing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="print-outline" size={22} color="#fff" />
                <Text style={styles.printBtnText}>Imprimer le reçu</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Bouton partager PDF */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleSharePDF}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator color={COLORS.info} />
            ) : (
              <>
                <Ionicons name="share-outline" size={22} color={COLORS.info} />
                <Text style={styles.shareBtnText}>Partager en PDF</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Bouton passer */}
          <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
            <Text style={styles.skipBtnText}>Passer</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#00b368',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#00b368',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 12,
  },
  printBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.info,
  },
  shareBtnText: {
    color: COLORS.info,
    fontSize: 16,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 12,
  },
  skipBtnText: {
    color: '#999',
    fontSize: 15,
    fontWeight: '600',
  },
});