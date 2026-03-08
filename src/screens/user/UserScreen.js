// ============================================
// 🔍 ÉCRAN RECHERCHE + PHARMACIES PROCHES (USER)
// src/screens/user/SearchMedicinesScreen.js
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Linking,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import UserService from '../../services/UserService';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';

const TABS = [
  { key: 'nearby',  label: 'Proches de moi', icon: 'location' },
  { key: 'search',  label: 'Recherche',       icon: 'search'   },
];

export default function UserScreen({ navigation }) {
  const { user, logout } = useAuth();

  // ── Tabs ──
  const [activeTab, setActiveTab] = useState('nearby');

  // ── Localisation ──
  const [location,    setLocation]    = useState(null);
  const [locLoading,  setLocLoading]  = useState(false);
  const [locError,    setLocError]    = useState(null);

  // ── Pharmacies proches ──
  const [nearby,        setNearby]        = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [radius,        setRadius]        = useState(5); // km

  // ── Recherche médicaments ──
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchLoad,   setSearchLoad]   = useState(false);
  const [results,      setResults]      = useState([]);

  // ── Carte ──
  const [mapRegion, setMapRegion] = useState({
    latitude:      -4.2634,
    longitude:     15.2429,
    latitudeDelta:  0.1,
    longitudeDelta: 0.1,
  });

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const showToast = (type, title, message) => {
    setToast({ type, title, message, duration: 3000 });
  }

  // ── Localisation au montage ──
  useEffect(() => {
    getLocation();
  }, []);

  const getLocation = async () => {
  try {
    setLocLoading(true);
    setLocError(null);

    // Vérifier d'abord si les services de localisation sont activés
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      setLocError('Activez la localisation sur votre téléphone');
      setLocLoading(false);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocError('Permission de localisation refusée');
      setLocLoading(false);
      return;
    }

    // Timeout de sécurité pour éviter le freeze
    const loc = await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low  // ← Low au lieu de Balanced
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
    ]);

    const coords = {
      latitude:  loc.coords.latitude,
      longitude: loc.coords.longitude
    };

    setLocation(coords);
    setMapRegion({
      ...coords,
      latitudeDelta:  0.05,
      longitudeDelta: 0.05,
    });

    await loadNearbyPharmacies(coords);

  } catch (err) {
    console.error('Erreur localisation:', err);
    setLocError('Impossible d\'obtenir votre position');
    showToast('error', 'Erreur', 'Position indisponible');
  } finally {
    setLocLoading(false);
  }
};

  // ── Charger pharmacies proches ──
  const loadNearbyPharmacies = async (coords, km = radius) => {
    if (!coords) return;
    try {
      setNearbyLoading(true);
      const res = await UserService.getNearbyPharmacies({
        latitude:  coords.latitude,
        longitude: coords.longitude,
        radius:    km
      });
    
      setNearby(res.data?.pharmacies || []);
    } catch (err) {
      console.error('Erreur nearby:', err);
      showToast('error', 'Erreur', err.message || 'Vérifiez votre connexion');
    } finally {
      setNearbyLoading(false);
    }
  };

  // ── Recherche médicaments ──
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showToast('error', 'Erreur', 'Entrez un nom de médicament');
      return;
    }
    try {
      setSearchLoad(true);
      const response = await UserService.searchMedicines({
        query:     searchQuery,
        latitude:  location?.latitude,
        longitude: location?.longitude,
      });
      setResults(response.data?.results || []);

      if ((response.data?.results || []).length === 0) {
        showToast('info', 'Aucun résultat', 'Aucune pharmacie ne vend ce médicament');
      } else {
        const first = response.data?.results[0]?.pharmacies[0]?.pharmacy;
        if (first?.latitude && first?.longitude) {
          setMapRegion({
            latitude:      parseFloat(first.latitude),
            longitude:     parseFloat(first.longitude),
            latitudeDelta:  0.05,
            longitudeDelta: 0.05,
          });
        }
      }
    } catch (err) {
      showToast('error', 'Erreur', err.message || 'Vérifiez votre connexion');
    } finally {
      setSearchLoad(false);
    }
  };

  // ── Actions ──
  const handleOpenMaps = (lat, lng, name) => {
    const url = Platform.OS === 'ios'
      ? `maps:0,0?q=${name}@${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${name})`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)
    );
  };

  const handleCall = (phone) => Linking.openURL(`tel:${phone}`);
  const handleAddToCart = () => {
    showToast('warning', 'Cette version n\'est pas encore disponible', 'Ajout au panier non disponible');
  };

  // ── Markers carte ──
  const getNearbyMarkers = () =>
    nearby
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        id: p.id, name: p.name,
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
        distance: p.distance
      }));

  const getSearchMarkers = () => {
    const markers = [];
    results.forEach(r => {
    if (!r.pharmacies) return;

  r.pharmacies.forEach(item => {
    const p = item.pharmacy;

    if (p?.latitude && p?.longitude) {
      markers.push({
        id: p.id,
        name: p.name,
        latitude: parseFloat(p.latitude),
        longitude: parseFloat(p.longitude),
        price: item.price,
        productName: r.product?.name
      });
    }
  });
    });
    return markers;
  };

  const markers = activeTab === 'nearby' ? getNearbyMarkers() : getSearchMarkers();
  const showMap = activeTab === 'nearby'
    ? (nearby.length > 0 && location)
    : results.length > 0;

  // ─────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ── HEADER ── */}
      <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.header}>
       <View style={styles.headerTop}>
    <Text style={styles.headerTitle}>💊 Patient</Text>
    <View style={styles.headerActions}>
      <TouchableOpacity style={styles.iconBtn} onPress={getLocation}>
        <Ionicons name="locate" size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  </View>

  {/* Ligne 2 : Avatar + Infos utilisateur (en bas) */}
  <View style={styles.userRow}>
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>
        {user?.firstName?.[0]}{user?.lastName?.[0]}
      </Text>
    </View>
    <View>
      <Text style={styles.userName}>{user?.firstName?.charAt(0) || ''} {user?.lastName?.charAt(0) || ''}</Text>
      <Text style={styles.userEmail}>{user?.email || 'Email non fourni'}</Text>
      <Text style={styles.headerSub}>
        {location
          ? '📍 Position détectée'
          : locLoading ? '📍 Localisation...' : '📍 Position inconnue'}
      </Text>
    </View>
  </View>

        {/* ── TABS ── */}
        <View style={styles.tabs}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? '#6366f1' : 'rgba(255,255,255,0.7)'}
              />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SEARCH BAR (tab recherche) ── */}
        {activeTab === 'search' && (
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Ex: Paracétamol, Doliprane..."
                placeholderTextColor={COLORS.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setResults([]); }}>
                  <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searchLoad}>
              {searchLoad
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="search" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>
        )}

        {/* ── RADIUS SELECTOR (tab nearby) ── */}
        {activeTab === 'nearby' && (
          <View style={styles.radiusRow}>
            <Text style={styles.radiusLabel}>Rayon de recherche :</Text>
            <View style={styles.radiusBtns}>
              {[2, 5, 10, 20].map(km => (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusBtn, radius === km && styles.radiusBtnActive]}
                  onPress={() => {
                    setRadius(km);
                    loadNearbyPharmacies(location, km);
                  }}
                >
                  <Text style={[styles.radiusBtnText, radius === km && styles.radiusBtnTextActive]}>
                    {km}km
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </LinearGradient>

      {/* ── CARTE ── */}
      

      {/* ── CONTENU ── */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* ═══════════════ TAB NEARBY ═══════════════ */}
        {activeTab === 'nearby' && (
          <>
            {/* Erreur de localisation */}
            {locError && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning" size={18} color={COLORS.warning} />
                <Text style={styles.errorText}>{locError}</Text>
                <TouchableOpacity onPress={getLocation}>
                  <Text style={styles.errorRetry}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Loading */}
            {(locLoading || nearbyLoading) && (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>
                  {locLoading ? 'Détection de votre position...' : 'Recherche des pharmacies...'}
                </Text>
              </View>
            )}

            {/* Résultats */}
            {!nearbyLoading && nearby.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  🏥 {nearby.length} pharmacie{nearby.length > 1 ? 's' : ''} dans un rayon de {radius} km
                </Text>
                {nearby.map(pharmacy => (
                  <PharmacyCard
                    key={pharmacy.id}
                    pharmacy={pharmacy}
                    onMap={() => handleOpenMaps(pharmacy.latitude, pharmacy.longitude, pharmacy.name)}
                    onCall={() => handleCall(pharmacy.phone)}
                  />
                ))}
              </>
            )}

            {/* Vide */}
            {!locLoading && !nearbyLoading && nearby.length === 0 && !locError && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏥</Text>
                <Text style={styles.emptyTitle}>Aucune pharmacie proche</Text>
                <Text style={styles.emptyText}>
                  Essayez d'augmenter le rayon de recherche
                </Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => loadNearbyPharmacies(location)}>
                  <Text style={styles.retryBtnText}>Actualiser</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* ═══════════════ TAB SEARCH ═══════════════ */}
        {activeTab === 'search' && (
          <>
            {results.length > 0 && (
              <Text style={styles.sectionTitle}>
                🔍 {results.length} médicament{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
              </Text>
            )}

            {results.map(result => (
              <View key={result.product.id} style={styles.resultCard}>
                {/* Produit */}
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{result.product.name}</Text>
                  <Text style={styles.productCategory}>{result.product.category}</Text>
                  {result.product.manufacturer && (
                    <Text style={styles.productMeta}>📦 {result.product.manufacturer}</Text>
                  )}
                  {result.product.requiresPrescription && (
                    <View style={styles.prescriptionBadge}>
                      <Ionicons name="document-text" size={14} color={COLORS.warning} />
                      <Text style={styles.prescriptionText}>Ordonnance requise</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.pharmaciesTitle}>
                  Disponible dans {result.pharmacies.length} pharmacie{result.pharmacies.length > 1 ? 's' : ''}
                </Text>

                {result.pharmacies.map(item => (
                  <View key={item.pharmacyProductId} style={styles.pharmacyCard}>
                    <View style={styles.pharmacyRow}>
                      <View style={styles.pharmacyIconWrap}>
                        <Ionicons name="medkit" size={20} color={COLORS.primary} />
                      </View>
                      <View style={styles.pharmacyInfo}>
                        <Text style={styles.pharmacyName}>{item.pharmacy.name}</Text>
                        <Text style={styles.pharmacyAddress}>
                          📍 {item.pharmacy.address}, {item.pharmacy.city}
                        </Text>
                        {item.distance && (
                          <Text style={styles.distanceBadgeText}>🚶 {item.distance} km</Text>
                        )}
                      </View>
                      <View>
                        <Text style={styles.price}>{item.price?.toLocaleString()} F</Text>
                        {item.originalPrice > item.price && (
                          <Text style={styles.originalPrice}>{item.originalPrice?.toLocaleString()} F</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.pharmacyActions}>
                      {item.pharmacy.latitude && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnMap]}
                          onPress={() => handleOpenMaps(item.pharmacy.latitude, item.pharmacy.longitude, item.pharmacy.name)}
                        >
                          <Ionicons name="navigate" size={15} color="#fff" />
                          <Text style={styles.actionBtnText}>Itinéraire</Text>
                        </TouchableOpacity>
                      )}
                      {item.pharmacy.phone && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.actionBtnCall]}
                          onPress={() => handleCall(item.pharmacy.phone)}
                        >
                          <Ionicons name="call" size={15} color="#fff" />
                          <Text style={styles.actionBtnText}>Appeler</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnOrder]}
                        onPress={() => handleAddToCart()}
                      >
                        <Ionicons name="cart" size={15} color="#fff" />
                        <Text style={styles.actionBtnText}>Commander</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))}

            {results.length === 0 && !searchLoad && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Recherchez un médicament</Text>
                <Text style={styles.emptyText}>
                  Trouvez les pharmacies les plus proches qui vendent le médicament que vous cherchez
                </Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      {/* Toast */}
      {toast && (
        <Toast
          toast={toast}
          onDismiss={() => setToast(null)}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPOSANT CARTE PHARMACIE (tab nearby)
// ─────────────────────────────────────────────
function PharmacyCard({ pharmacy, onMap, onCall }) {
  return (
    <View style={styles.nearbyCard}>
      {/* Top row */}
      <View style={styles.nearbyTop}>
        <View style={styles.nearbyIconWrap}>
          <Ionicons name="medkit" size={22} color={COLORS.primary} />
        </View>
        <View style={styles.pharmacyInfo}>
          <Text style={styles.pharmacyName}>{pharmacy.name}</Text>
          <Text style={styles.pharmacyAddress}>
            📍 {pharmacy.address}, {pharmacy.city}
          </Text>
        </View>
        {pharmacy.distance && (
          <View style={styles.distanceBadge}>
            <Ionicons name="walk" size={14} color={COLORS.primary} />
            <Text style={styles.distanceBadgeText}>{pharmacy.distance} km</Text>
          </View>
        )}
      </View>

      {/* Livraison */}
      {pharmacy.deliveryAvailable && (
        <View style={styles.deliveryBadge}>
          <Ionicons name="bicycle" size={14} color={COLORS.info} />
          <Text style={styles.deliveryText}>
            Livraison disponible
            {pharmacy.deliveryFee ? ` — ${pharmacy.deliveryFee?.toLocaleString()} FCFA` : ''}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.pharmacyActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnMap]} onPress={onMap}>
          <Ionicons name="navigate" size={15} color="#fff" />
          <Text style={styles.actionBtnText}>Itinéraire</Text>
        </TouchableOpacity>
        {pharmacy.phone && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnCall]} onPress={onCall}>
            <Ionicons name="call" size={15} color="#fff" />
            <Text style={styles.actionBtnText}>Appeler</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header:        { paddingTop: 50, paddingBottom: 16 },
headerTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
headerTitle:   { fontSize: FONTS.xl, fontWeight: '800', color: '#fff' },
headerActions: { flexDirection: 'row', gap: 8 },
iconBtn:       { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

// Ligne utilisateur
userRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, marginBottom: 16 },
avatar:        { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
avatarText:    { fontSize: FONTS.md, fontWeight: '800', color: '#fff' },
userName:      { fontSize: FONTS.md, fontWeight: '700', color: '#fff' },
headerSub:     { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  userEmail:     { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Tabs
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, padding: 4, marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: RADIUS.sm - 2 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: FONTS.sm, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: '#6366f1' },

  // Search
  searchContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: RADIUS.md, paddingHorizontal: 12 },
  searchInput: { flex: 1, height: 45, fontSize: FONTS.md, marginLeft: 8 },
  searchBtn: { width: 45, height: 45, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  // Radius
  radiusRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 },
  radiusLabel: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  radiusBtns: { flexDirection: 'row', gap: 6 },
  radiusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)' },
  radiusBtnActive: { backgroundColor: '#fff' },
  radiusBtnText: { fontSize: FONTS.xs, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  radiusBtnTextActive: { color: '#6366f1' },

  // Map
  mapContainer: { height: 220 },
  map: { flex: 1 },

  // Content
  content: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 14 },

  // Error / Loading
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.warningBg, padding: 12, borderRadius: RADIUS.md, marginBottom: 16 },
  errorText: { flex: 1, fontSize: FONTS.sm, color: COLORS.warning, fontWeight: '600' },
  errorRetry: { fontSize: FONTS.sm, fontWeight: '800', color: COLORS.warning, textDecorationLine: 'underline' },
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, justifyContent: 'center' },
  loadingText: { fontSize: FONTS.md, color: COLORS.textSecondary },

  // Nearby card
  nearbyCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  nearbyTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  nearbyIconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryBg || '#eef2ff', alignItems: 'center', justifyContent: 'center' },

  // Pharmacy shared
  pharmacyInfo: { flex: 1 },
  pharmacyName: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  pharmacyAddress: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  distanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  distanceBadgeText: { fontSize: FONTS.xs, fontWeight: '700', color: COLORS.primary },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.infoBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm, marginBottom: 10 },
  deliveryText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.info },

  // Actions
  pharmacyActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: RADIUS.md },
  actionBtnMap: { backgroundColor: COLORS.info },
  actionBtnCall: { backgroundColor: COLORS.success },
  actionBtnOrder: { backgroundColor: COLORS.primary },
  actionBtnText: { color: '#fff', fontSize: FONTS.sm, fontWeight: '700' },

  // Search results
  resultCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  productHeader: { marginBottom: 12 },
  productName: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  productCategory: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600', marginBottom: 4 },
  productMeta: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  prescriptionBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warningBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm, alignSelf: 'flex-start', marginTop: 4 },
  prescriptionText: { fontSize: FONTS.xs, fontWeight: '600', color: COLORS.warning },
  pharmaciesTitle: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 10 },
  pharmacyCard: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 8 },
  pharmacyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  pharmacyIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  price: { fontSize: FONTS.md, fontWeight: '800', color: COLORS.success },
  originalPrice: { fontSize: FONTS.xs, color: COLORS.textSecondary, textDecorationLine: 'line-through' },

  // Empty
  emptyState: { alignItems: 'center', padding: SPACING.xl, marginTop: 30 },
  emptyIcon: { fontSize: 56, marginBottom: 14 },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: FONTS.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: RADIUS.md },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: FONTS.md },
});