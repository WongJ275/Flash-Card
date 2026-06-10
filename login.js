import { SignUp, SignIn, SignOut } from "./supabaseClient.js";
import { supabase, CheckUser, CheckSession } from "./supabaseClient.js";
import { InheritLocalStorageData } from "./data.js";
import { ShowLoadingScreen, HideLoadingScreen } from "./utils.js";

supabase.auth.onAuthStateChange((event, session) => {
    setTimeout(async () => {
        if (event === 'SIGNED_IN' && session) {
            UpdateAuthUI(session.user);

            const metadata = session.user.user_metadata;
            const shouldInherit = metadata ? metadata.shouldInherit : false;

            //console.log("Inherit data:", shouldInherit);

            if (shouldInherit === true) {
                try {
                    ShowLoadingScreen();
                    await InheritLocalStorageData();
                } catch (error) {
                    console.error("Data inherit failed:", error);
                } finally {
                    HideLoadingScreen();
                }
            }
        }
        else if (event === "SIGNED_OUT") {
            window.location.reload();
        }
    }, 0);
});

CheckUser().then(user => {
    UpdateAuthUI(user);
});

function UpdateAuthUI(user) {
    if (user) {
        authDiv.classList.add("hidden");
        profileDiv.classList.remove("hidden");
        userEmail.textContent = user.email;
        title.textContent = "Logged In As";
    }
    else {
        authDiv.classList.remove("hidden");
        profileDiv.classList.add("hidden");
        loginDiv.classList.remove("hidden");
        signUpDiv.classList.add("hidden");
        title.textContent = "Sign In";
    }
}

const title = document.querySelector(".title");
const loginDiv = document.querySelector(".loginDiv");
const signUpDiv = document.querySelector(".signUpDiv");

const authDiv = document.querySelector(".authDiv");
const profileDiv = document.querySelector(".profileDiv");

const errorMsgSignIn = document.querySelector(".errorMsgSignIn");
const errorMsgSignUp = document.querySelector(".errorMsgSignUp");

const userEmail = document.querySelector(".userEmail");

const withoutAccountBtn = document.querySelector(".withoutAccount");
withoutAccountBtn.addEventListener('click', function() {
    localStorage.setItem('hasVisitedBefore', '1');
    window.location.href = 'index.html';
});

const switchToSignUp = document.querySelector(".switchToSignUp");
switchToSignUp.addEventListener('click', function() {
    loginDiv.classList.add("hidden");
    signUpDiv.classList.remove("hidden");
    title.textContent = "Sign Up";
});

const switchToSignIn = document.querySelector(".switchToSignIn");
switchToSignIn.addEventListener('click', function() {
    loginDiv.classList.remove("hidden");
    signUpDiv.classList.add("hidden");
    title.textContent = "Sign In";
});

const loginForm = document.querySelector(".loginForm");
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    ShowLoadingScreen();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const signedInUser = await SignIn(email, password);

    HideLoadingScreen();
    UpdateAuthUI(signedInUser);
});

const signUpForm = document.querySelector(".signUpForm");
signUpForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    ShowLoadingScreen();

    const email = document.getElementById('signUpEmail').value;
    const password = document.getElementById('signUpPassword').value;
    const confirm = document.getElementById('confirmPassword').value;

    let inheritData = document.getElementById('inheritData').checked;

    const decksRaw = localStorage.getItem("decks");
    if (!decksRaw || decksRaw === "[]") {
        inheritData = false;
    }

    if (password !== confirm) {
        errorMsgSignUp.textContent = "Passwords do not match";
        return;
    }
    else if (password.length < 6) {
        errorMsgSignUp.textContent = "Password must be at least 6 characters";
        return;
    }
    else {
        errorMsgSignUp.textContent = "";
    }

    await SignUp(email, password, inheritData);

    HideLoadingScreen();
});

const signOutBtn = document.querySelector(".signOutBtn");
signOutBtn.addEventListener("click", async function() {
    ShowLoadingScreen();
    await SignOut();
    HideLoadingScreen();
    UpdateAuthUI(null);
});

const viewCardsBtn = document.querySelector(".viewCardsBtn");
viewCardsBtn.addEventListener("click", function() {
    window.location.href = "index.html";
})