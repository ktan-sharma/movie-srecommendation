import { userManager } from './auth.js';

class UserSystem {
    constructor() {
        this.users = new Map();
    }

    createUser(email, password, name) {
        if (this.users.has(email)) {
            return false;
        }
        this.users.set(email, { 
            email,
            password, // In production, use password hashing
            name,
            watchlist: [],
            ratings: {},
            createdAt: new Date().toISOString()
        });
        return true;
    }

    validateUser(email, password) {
        const user = this.users.get(email);
        return user && user.password === password;
    }

    getUser(email) {
        return this.users.get(email);
    }
}

export const userSystem = new UserSystem();