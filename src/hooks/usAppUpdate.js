import { Alert, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

const GITHUB_OWNER = 'methy-tec';
const GITHUB_REPO = 'PharmGO';

const CURRENT_VERSION = Constants.expoConfig?.version || '0.0.0';

export const checkForAppUpdate = async () => {
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

    const response = await fetch(url);

    if (!response.ok) {
      console.warn('❌ GitHub API error:', response.status);
      return;
    }

    const release = await response.json();

    // 🔐 Sécurité données
    if (!release || !release.tag_name) return;

    const latestVersion = sanitizeVersion(release.tag_name);

    if (!latestVersion) return;

    // 🔍 Comparaison versions
    if (compareVersions(CURRENT_VERSION, latestVersion) >= 0) {
      console.log('✅ App à jour');
      return;
    }

    // 📦 Recherche APK
    const apkAsset = release.assets?.find(asset =>
      asset.name.toLowerCase().endsWith('.apk')
    );

    if (!apkAsset) {
      Alert.alert(
        "Mise à jour disponible",
        `Version ${latestVersion} disponible, mais aucun fichier APK trouvé.`
      );
      return;
    }

    // 🎯 Message amélioré
    Alert.alert(
      "🚀 Mise à jour disponible",
      `Version actuelle: ${CURRENT_VERSION}\nNouvelle version: ${latestVersion}\n\n${formatReleaseNotes(release.body)}`,
      [
        {
          text: "Ignorer",
          style: "cancel"
        },
        {
          text: "Mettre à jour",
          onPress: () => openDownload(apkAsset.browser_download_url)
        }
      ],
      { cancelable: true }
    );

  } catch (error) {
    console.error("❌ Erreur update:", error);
  }
};

// 🔧 Nettoyage version
const sanitizeVersion = (version) => {
  return version.replace(/[^\d.]/g, '').trim();
};

// 📄 Format release notes
const formatReleaseNotes = (notes) => {
  if (!notes) return "Améliorations et corrections.";

  // Limiter taille pour Alert
  return notes.length > 200
    ? notes.substring(0, 200) + '...'
    : notes;
};

// 🔗 Ouverture sécurisée
const openDownload = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert("Erreur", "Impossible d’ouvrir le lien.");
      return;
    }

    await Linking.openURL(url);
  } catch (err) {
    console.error("❌ Erreur ouverture lien:", err);
  }
};

// 🔢 Comparaison versions robuste
const compareVersions = (current, latest) => {
  const a = current.split('.').map(n => parseInt(n) || 0);
  const b = latest.split('.').map(n => parseInt(n) || 0);

  const maxLength = Math.max(a.length, b.length);

  for (let i = 0; i < maxLength; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }

  return 0;
};