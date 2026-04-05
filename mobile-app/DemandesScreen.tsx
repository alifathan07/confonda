import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: '#2563a8',
  background: '#f2f4f7',
  card: '#ffffff',
  text: '#1a1a2e',
  textSecondary: '#6b7280',
  accent: '#f59e0b',
  success: '#16a34a',
  warning: '#eab308',
  destructive: '#dc2626',
};

const API_URL = 'http://192.168.11.100:3000'; // Change to your backend IP

// Check if running on web
const isWeb = Platform.OS === 'web';

// Types corresponding to the API models
interface DemandeFourniture {
  id: number | string;
  numero?: string;
  createdAt?: string;        // fallback if date isn't exactly dateDemande
  dateDemande?: string;
  status?: string;
  etat?: string;
  user?: {
    name: string;
  };
  chantier?: {
    nom?: string;
    name?: string;
  };
}

// Map distinct statuses to specific styling
const getStatusStyle = (status = '') => {
  const s = status.toLowerCase();
  if (s.includes('attente')) return { bg: '#fefce8', color: '#854d0e', icon: 'time-outline' };
  if (s.includes('rejet')) return { bg: '#fef2f2', color: '#991b1b', icon: 'close-circle-outline' };
  if (s.includes('approuv') || s.includes('valid')) return { bg: '#f0fdf4', color: '#166534', icon: 'checkmark-circle-outline' };
  return { bg: '#f1f5f9', color: '#475569', icon: 'information-circle-outline' };
};

export default function DemandesScreen() {
  const router = useRouter();
  const [demandes, setDemandes] = useState<DemandeFourniture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDemandes = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) {
          Alert.alert('Non autorisé', 'Token manquant, veuillez vous reconnecter.');
          router.replace('/');
          return;
        }

        const response = await axios.get(`${API_URL}/api/fournitures`, {
          headers: {
            Authorization: `Bearer ${token}` 
          }
        });

        // API structurally returns: { success: true, data: [...], pagination: {...} }
        if (response.data && response.data.success) {
          setDemandes(response.data.data || []);
        } else {
          // Fallback just in case
          setDemandes(Array.isArray(response.data) ? response.data : []);
        }

      } catch (error: any) {
        console.error('Error fetching demandes:', error);
        if (error.response?.status === 403) {
          Alert.alert('Accès refusé', 'Vous n\'avez pas les permissions nécessaires.');
        } else {
          Alert.alert('Erreur', 'Impossible de charger les demandes de fourniture');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDemandes();
  }, []);

  const handleDelete = (id: string | number, numero: string) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous vraiment supprimer la demande ${numero} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            // Future delete logic goes here
            console.log('Simulating delete demande ID:', id);
          }
        }
      ]
    );
  };

  const handleDownloadPDF = async (id: string | number, numero: any) => {
    console.log('--- START DOWNLOAD PDF ---', { id, numero, isWeb });
    try {
      const token = await SecureStore.getItemAsync('userToken');
      console.log('1. Got token', !!token);
      if (!token) {
        Alert.alert('Non autorisé', 'Veuillez vous reconnecter.');
        return;
      }

      const url = `${API_URL}/api/fournitures/${id}/pdf`;

      // WEB: Open in new tab or download via browser
      if (isWeb) {
        console.log('2. Web detected - opening PDF in new tab');
        // Fetch with auth header, then open blob
        const response = await fetch(url, {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: 'application/pdf'
          }
        });
        
        if (!response.ok) {
          Alert.alert('Erreur', `Impossible de générer le PDF. (Status: ${response.status})`);
          return;
        }

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `Demande_${numero || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        
        Alert.alert('Succès', 'PDF téléchargé');
        return;
      }

      // NATIVE: Use FileSystem
      const numStr = numero ? String(numero) : String(id);
      const safeName = numStr.replace(/[^a-z0-9]/gi, '_');
      
      console.log('2. checking directory', FileSystem.documentDirectory);
      if (!FileSystem.documentDirectory) {
        Alert.alert('Erreur', 'Système de fichiers non disponible');
        return;
      }

      const fileUri = `${FileSystem.documentDirectory}Demande_${safeName}.pdf`;

      console.log('3. downloading from', url, 'to', fileUri);

      const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf'
        }
      });

      console.log('4. download finished, status:', downloadRes.status);

      if (downloadRes.status !== 200) {
        Alert.alert('Erreur API', `Impossible de générer le PDF. (Status: ${downloadRes.status})`);
        return;
      }

      console.log('5. checking if sharing is available');
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        console.log('6. sharing file:', downloadRes.uri);
        await Sharing.shareAsync(downloadRes.uri, { 
          mimeType: 'application/pdf',
          dialogTitle: `Partager Demande ${numero || id}`
        });
      } else {
        console.log('6. sharing NOT available');
        Alert.alert('Succès', `PDF enregistré sous :\n${fileUri}`);
      }
    } catch (error: any) {
      console.log('!!! ERREUR CRITIQUE PDF !!!', error);
      Alert.alert('Erreur de téléchargement', error?.message || 'Une erreur inattendue est survenue.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Navbar */}
      <SafeAreaView style={styles.navbar} edges={['top']}>
        <View style={styles.navContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Demandes Fourniture</Text>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.listTitle}>Toutes les demandes</Text>
          <Text style={styles.listSubtitle}>{demandes.length} demande(s) récupérées</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => router.push('/creer-demande')}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Créer</Text>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <ScrollView style={styles.tableScroll} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Chargement en cours...</Text>
            </View>
          ) : (
            <View style={styles.tableWrapper}>
              {/* Table Header */}
              <View style={[styles.tableRow, styles.tableHeader]}>
                {['Numéro', 'Date', 'Demandeur', 'Chantier', 'Statut', 'Etat', 'Actions'].map((col) => (
                  <Text
                    key={col}
                    style={[
                      styles.tableCell,
                      styles.tableHeaderCell,
                      col === 'Actions' && styles.actionsCell,
                      col === 'Numéro' && { width: 90 }
                    ]}
                  >
                    {col}
                  </Text>
                ))}
              </View>

              {/* Table Rows */}
              {demandes.map((item, index) => {
                // Safeguard data extraction if names differ
                const demandeurName = item.user?.name || 'Inconnu';
                const chantierName = item.chantier?.nom || item.chantier?.name || 'Inconnu';
                const dateAffichee = item.dateDemande || item.createdAt || 'N/A';
                const currentStatus = item.status || 'En attente';
                const statutStyle = getStatusStyle(currentStatus);

                return (
                  <View
                    key={item.id}
                    style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
                  >
                    <Text style={[styles.tableCell, styles.numeroCell, { width: 90 }]}>
                      {item.numero || `#${item.id}`}
                    </Text>

                    <Text style={styles.tableCell}>
                      {dateAffichee.includes('T') ? dateAffichee.split('T')[0] : dateAffichee}
                    </Text>

                    <Text style={styles.tableCell}>{demandeurName}</Text>

                    <Text style={styles.tableCell}>{chantierName}</Text>

                    {/* Statut Badge */}
                    <View style={styles.tableCell}>
                      <View style={[styles.badge, { backgroundColor: statutStyle.bg }]}>
                        <Ionicons name={statutStyle.icon as any} size={12} color={statutStyle.color} />
                        <Text style={[styles.badgeText, { color: statutStyle.color }]}>
                          {currentStatus}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.tableCell}>{item.etat || 'N/A'}</Text>

                    {/* Actions */}
                    <View style={[styles.tableCell, styles.actionsCell, styles.actionsRow]}>

                      {/* VIEW */}
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#eff6ff' }]}
                        onPress={() => Alert.alert('Aperçu', `Détail de ${item.numero || item.id}`)}
                      >
                        <Ionicons name="eye-outline" size={14} color={COLORS.primary} />
                        <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Voir</Text>
                      </TouchableOpacity>

                      {/* PARTAGER PDF */}
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#f3f4f6' }]}
                        onPress={() => handleDownloadPDF(item.id, item.numero || 'N_A')}
                      >
                        <Ionicons name="share-outline" size={14} color={COLORS.textSecondary} />
                        <Text style={[styles.actionBtnText, { color: COLORS.textSecondary }]}>Partager</Text>
                      </TouchableOpacity>

                      {/* DELETE */}
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: '#fef2f2' }]}
                        onPress={() => handleDelete(item.id, item.numero || 'N/A')}
                      >
                        <Ionicons name="trash-outline" size={14} color={COLORS.destructive} />
                      </TouchableOpacity>

                    </View>
                  </View>
                );
              })}

              {demandes.length === 0 && (
                <View style={styles.emptyRow}>
                  <Ionicons name="file-tray-outline" size={36} color={COLORS.textSecondary} />
                  <Text style={styles.emptyText}>Aucune demande de fourniture trouvée</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    width: 600,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  navbar: {
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  listSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    flexShrink: 0,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  tableScroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  tableWrapper: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  rowEven: {
    backgroundColor: '#ffffff',
  },
  rowOdd: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    width: 140,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.text,
    justifyContent: 'center',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  numeroCell: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionsCell: {
    width: 220,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 2,
    textTransform: 'capitalize'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyRow: {
    paddingVertical: 48,
    alignItems: 'center',
    width: 600,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
