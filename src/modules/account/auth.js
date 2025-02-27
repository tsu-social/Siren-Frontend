import { initiateLogin } from '@/modules/account/mutations/initiate-login.js';
import { wallet } from '@/plugins/wallet/Wallet.js';
import { notifications } from 'fantom-vue-components/src/plugins/notifications.js';
import { login } from '@/modules/account/mutations/login.js';
// import { getLoggedUser } from '@/modules/account/queries/logged-user.js';
import { getUser, isLoggedUserModerator } from '@/modules/account/queries/user.js';
import { router } from '@/main.js';
import appConfig from '@/app.config.js';
import { checkWallet } from '@/plugins/wallet/utils.js';

function isBearerTokenValid(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return false;
        const expiration = JSON.parse(atob(parts[1])).exp;
        const now = new Date().getTime() / 1000;
        const expirationIn = expiration - now;

        // expiring in less then 2 minutes?
        if (expirationIn < 60 * 2) {
            console.warn('Bearer token expired');
            return false;
        }
        return true;
    } catch (e) {
        console.warn('Parsing JWT Bearer Token failed', e);
        return false;
    }
}

export function getBearerToken() {
    const token = wallet.getBearerToken();
    if (token && !isBearerTokenValid(token)) {
        console.warn('Bearer token invalid - logging out');
        wallet.logout();
        return '';
    }
    return token;
}

export async function signIn() {
    const { account } = wallet;

    if (!wallet.connected || !account) {
        return false;
    }

    const challenge = await initiateLogin();

    try {
        const signature = await wallet.personalSign(challenge, account);
        const bearerToken = await login({ user: account, challenge, signature });

        wallet.setBearerToken(bearerToken);

        await setUser(account, true);

        return true;
    } catch (error) {
        if (error.code === 4001) {
            notifications.add({
                type: 'error',
                text: 'User denied message signature.',
            });
        }

        console.error(error);
    }
}

export async function setUser(account, logged) {
    const user = await getUser(account);

    if (logged) {
        user.logged = true;
        user.isModerator = await isLoggedUserModerator();

        console.log("user.isModerator", user.isModerator)
        console.log("appConfig.flags.moderatorFunctions", appConfig.flags.moderatorFunctions) 

        if (!appConfig.flags.moderatorFunctions) {
            user.isModerator = false;
        }
    }

    wallet.setUser(user);
}

/**
 * Checks if user is logged, if not, try to log him
 *
 * @param {boolean} [redirectToHomepage]
 * @param {boolean} [checkModerator]
 * @return {Promise<boolean>}
 */
export async function checkSignIn(redirectToHomepage = false, checkModerator = false) {
    let redirect = false;
    let ok = await checkWallet();

    if (!getBearerToken()) {
        ok = await signIn();

        if (ok && checkModerator) {
            ok = await isLoggedUserModerator();
        }

        if (!ok) {
            redirect = true;
        }
    } else if (checkModerator && !(await isLoggedUserModerator())) {
        redirect = true;
    }

    if (redirect && redirectToHomepage) {
        router.push('/');
    }

    return ok;
}

/*
export async function setLoggedUser() {
    const user = await getLoggedUser();

    wallet.setLoggedUser(user);
}
*/
