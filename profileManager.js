import { userManager } from './auth.js';

class ProfileManager {
    async updateProfilePicture(file) {
        if (!userManager.isLoggedIn() || !file) return false;
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const user = userManager.getCurrentUser();
                    user.profilePicture = e.target.result;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
        });
    }
}

export const profileManager = new ProfileManager();