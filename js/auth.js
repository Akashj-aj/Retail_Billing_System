// auth.js

// Sign up function
async function signup(email, password) {
    const { user, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Signup error:", error);
        return error.message;
    }

    // Handle user creation, maybe add additional profile info
    alert("Signup successful!");
    return user;
}

// Log in function
async function login(email, password) {
    const { user, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        console.error("Login error:", error);
        return error.message;
    }

    // Redirect to home or dashboard after successful login
    window.location.href = 'home.html';
    return user;
}

// Log out function
async function logout() {
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) {
        console.error("Logout error:", error);
        return error.message;
    }

    // Redirect to login page after logout
    window.location.href = 'login.html';
}
