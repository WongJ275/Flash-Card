import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabaseUrl = "https://rsifrrvnumwlncfworkd.supabase.co";
const supabaseKey = "sb_publishable_Pe5cGYFCRiMjAZFAW-Gheg_7WrUYCdv";

export const supabase = createClient(supabaseUrl, supabaseKey);

// insecure (local session)
export async function CheckSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error("Error checking session: " + error.message);
        return null;
    }

    if (!session) {
        return null;
    }

    return session;
}

// authentic (fetched from database)
export async function CheckUser() {

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error("Error checking user: " + error.message);
        return null;
    }

    if (!user) {
        return null;
    }

    return user;
}

export async function SignUp(email, password, shouldInherit) {
    document.querySelector(".errorMsgSignUp").textContent = "";

    const { data, error } = await supabase.auth.signUp({
        email: email, 
        password: password,
        options: {
            emailRedirectTo: 'https://wongj275.github.io/Flash-Card/login.html',
            data: {
                shouldInherit: shouldInherit
            }
        }
    });

    if (error) {
        HandleSignUpError(error);
        return;
    }

    // If Confirm email is enabled, a user is returned but session is null.
    if (data.user && !data.session) {
        window.location.href = 'verifyEmail.html';
    }
}

export async function SignIn(email, password) {
    document.querySelector(".errorMsgSignIn").textContent = "";

    const { data, error} = await supabase.auth.signInWithPassword({
        email: email, 
        password: password
    });

    if (error) {
        HandleSignInError(error);
        return null;
    }

    return data.user;

    //window.location.href = 'index.html';
}

export async function SignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Error logging out: " + error);
    }
}

function HandleSignInError(error) {
    const errorMsgSignIn = document.querySelector(".errorMsgSignIn");

    switch (error.code) {
        case 'invalid_credentials':
            errorMsgSignIn.textContent = "Invalid email or password.";
            break;

        default:
            errorMsgSignIn.textContent = "An unexpected error occurred. Please try again.";
            break;
    }
}

function HandleSignUpError(error) {
    const errorMsgSignUp = document.querySelector(".errorMsgSignUp");

    if (error.status === 429) {
        errorMsgSignUp.textContent = "Rate limit exceeded. Please wait before trying again.";
        return;
    }

    switch (error.code) {
        // When either Confirm email or Confirm phone (even when phone provider is disabled)
        // is disabled, the error message, User already registered is returned.
        case 'user_already_exists':
            errorMsgSignUp.textContent = "User already exists. Please sign in instead.";
            break;

        case 'email_not_confirmed':
            errorMsgSignUp.textContent = "Please check your email to verify your account.";
            break;

        default:
            errorMsgSignUp.textContent = "An unexpected error occurred. Please try again.";
            break;
    }
}