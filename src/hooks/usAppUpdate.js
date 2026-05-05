import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

const GITHUB_OWNER = 'methy-tec';
const GITHUB_REPO = 'PharmGO';
const CURRENT_VERSION = Constants.expoConfig.version;

export const checkForAppUpdate = async () => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    );
    if (!response.ok) return;

    const release = await response.json();
    const latestVersion = release.tag_name.replace('v', '').trim();
    if (!latestVersion) return;

    if (compareVersions(CURRENT_VERSION, latestVersion) < 0) {
      const apkAsset = release.assets.find(a =>
        a.name.toLowerCase().endsWith('.apk')
      );
      if (!apkAsset) return;

      Alert.alert(
        '🚀 Mise à jour disponible',
        `Version ${latestVersion} est disponible.\n\n${release.body || 'Améliorations et corrections.'}`,
        [
          { text: 'Plus tard', style: 'cancel' },
          {
            text: 'Mettre à jour',
            onPress: () => downloadAndInstallAPK(apkAsset.browser_download_url)
          }
        ]
      );
    }
  } catch (e) {
    console.log('Erreur update check:', e);
  }
};

export const downloadAndInstallAPK = async (url) => {
  if (Platform.OS !== 'android') return;

  const fileUri = FileSystem.documentDirectory + 'update.apk';

  Alert.alert('Téléchargement...', 'La mise à jour est en cours de téléchargement.');

  try {
    const existing = await FileSystem.getInfoAsync(fileUri);
    if (existing.exists) await FileSystem.deleteAsync(fileUri);

    const { uri } = await FileSystem.downloadAsync(url, fileUri);

    Alert.alert(
      '✅ Téléchargement terminé',
      'Appuie sur Installer pour continuer.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Installer',
          onPress: async () => {
            const contentUri = await FileSystem.getContentUriAsync(uri);
            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
              data: contentUri,
              flags: 1,
              type: 'application/vnd.android.package-archive',
            });
          }
        }
      ]
    );
  } catch (e) {
    console.error('Erreur téléchargement APK:', e);
    Alert.alert('❌ Erreur', 'Le téléchargement a échoué. Réessaie plus tard.');
  }
};

const compareVersions = (current, latest) => {
  const a = current.split('.').map(Number);
  const b = latest.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if ((a[i] || 0) < (b[i] || 0)) return -1;
    if ((a[i] || 0) > (b[i] || 0)) return 1;
  }
  return 0;
};