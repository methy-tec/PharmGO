import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * StatCard — carte individuelle d'une métrique
 *
 * Props:
 *  - icon       {string}  nom d'icône Ionicons (ex: 'people', 'medkit')
 *  - label      {string}  libellé affiché sous la valeur
 *  - value      {number}  valeur numérique à afficher
 *  - color      {string}  couleur d'accent (bordure + icône)
 */
export function StatCard({ icon, label, value, color = '#007aff' }) {
    return (
        <View style={[styles.statCard, { borderLeftColor: color }]}>
            <Ionicons name={icon} size={24} color={color} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

/**
 * StatsTab — grille de statistiques génériques
 *
 * Props:
 *  - stats      {object | null}  objet de statistiques venant de l'API
 *  - title      {string}         titre de la section  (défaut : '📊 Vue d\'ensemble')
 *  - cards      {Array}          tableau de définitions de cartes. Si absent,
 *                                 la config par défaut (stats SuperAdmin) est utilisée.
 *
 * Format d'un élément cards[] :
 * {
 *   icon   : string,   // nom Ionicons
 *   label  : string,   // libellé
 *   value  : number,   // valeur à afficher
 *   color  : string,   // couleur accent
 * }
 *
 * ─── Utilisation minimale (écran SuperAdmin) ────────────────────────────────
 *
 * import StatsTab from '../../components/stats/StatsTab';
 *
 * <StatsTab stats={stats} />
 *
 * ─── Utilisation personnalisée ───────────────────────────────────────────────
 *
 * import StatsTab, { StatCard } from '../../components/stats/StatsTab';
 *
 * const myCards = [
 *   { icon: 'cart',   label: 'Commandes',  value: stats?.orders  || 0, color: '#007aff' },
 *   { icon: 'cash',   label: 'Revenus',    value: stats?.revenue || 0, color: '#00b368' },
 * ];
 *
 * <StatsTab
 *   stats={stats}
 *   title="📦 Mes statistiques"
 *   cards={myCards}
 * />
 *
 * ─── Utilisation avec carte personnalisée seule ──────────────────────────────
 *
 * <StatCard icon="people" label="Utilisateurs" value={42} color="#007aff" />
 */
export default function StatsTab({ stats, title = "📊 Vue d'ensemble", cards }) {
    // Config par défaut calée sur le format de l'API SuperAdmin
    const defaultCards = [
        {
            icon:  'people',
            label: 'Utilisateurs',
            value: stats?.users?.total        || 0,
            color: '#007aff',
        },
        {
            icon:  'medkit',
            label: 'Pharmacies',
            value: stats?.pharmacies?.total   || 0,
            color: '#ff9500',
        },
        {
            icon:  'alert-circle',
            label: 'En attente',
            value: stats?.pharmacies?.pending || 0,
            color: '#ff3b30',
        },
        {
            icon:  'person-add',
            label: 'Nouveaux',
            value: stats?.users?.recent       || 0,
            color: '#00b368',
        },
    ];

    const displayCards = cards || defaultCards;

    if (!stats && !cards) {
        return (
            <View style={styles.tabContent}>
                <Text style={styles.emptyText}>Pas de stats disponibles</Text>
            </View>
        );
    }

    return (
        <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.statsGrid}>
                {displayCards.map((card, index) => (
                    <StatCard
                        key={index}
                        icon={card.icon}
                        label={card.label}
                        value={card.value}
                        color={card.color}
                    />
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tabContent: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#333',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statCard: {
        width: '47%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        // Ombre légère
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#333',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
});