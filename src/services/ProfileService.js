import { api } from './AuthService';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileService = {
 
    // ── Infos ─────────────────────────────────────────────────────────────────
    updateProfile: async ({ firstName, lastName }) =>
        api.put('/profile/profil', { firstName, lastName }),
 
    // ── Avatar ────────────────────────────────────────────────────────────────
 uploadAvatar: async (uri) => {
    const token = await AsyncStorage.getItem('token');
    const formData = new FormData();

    const filename = uri.split('/').pop() || 'avatar.jpg';
    // On extrait l'extension pour deviner le type MIME (ex: jpg, png)
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    if (Platform.OS === 'web') {
        // 🌐 Version WEB
        const responseBlob = await fetch(uri);
        const originalBlob = await responseBlob.blob();
        
        // 💡 L'ASTUCE : On recrée un Blob en forçant explicitement le type MIME 
        // ou on utilise directement l'objet File (disponible sur le Web)
        const file = new File([originalBlob], filename, { type });
        
        formData.append('avatar', file);
    } else {
        // 📱 Version MOBILE (iOS / Android)
        formData.append('avatar', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: filename,
            type,
        });
    }

    // Requête Fetch (inchangée)
    const response = await fetch('http://localhost:5000/api/v1/profile/avatar', {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Erreur upload avatar');
    }

    return response.json();
},
    // ── Mot de passe ──────────────────────────────────────────────────────────
    updatePassword: async ({ currentPassword, newPassword }) =>
        api.put('/profile/password', { currentPassword, newPassword }),
 
    // ── Historique de connexion ───────────────────────────────────────────────
    getLoginHistory: async () =>
        api.get('/profile/login-history'),
};
 
export default ProfileService;