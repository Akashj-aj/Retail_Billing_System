const supabase = window.supabaseClient;

async function handleSignUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error('Error signing up:', error.message);
    return { success: false, message: error.message };
  }

  return { success: true, user: data.user };
}

document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // Clear previous error
  document.getElementById('error-message').innerText = '';

  if (!email || !password) {
    document.getElementById('error-message').innerText = 'Please enter both email and password.';
    return;
  }
  if (password.length < 6) {
    document.getElementById('error-message').innerText = 'Password must be at least 6 characters.';
    return;
  }

  const result = await handleSignUp(email, password);

  if (result.success) {
    alert('Signup successful! Please check your email to confirm your account.');
    window.location.href = 'login.html';
  } else {
    let msg = result.message || '';
    if (
      msg.toLowerCase().includes('already registered') ||
      msg.toLowerCase().includes('already exists')
    ) {
      msg = 'This email is already registered. Please log in or use a different email.';
    } else if (msg.toLowerCase().includes('invalid email')) {
      msg = 'Please enter a valid email address.';
    } else if (msg.toLowerCase().includes('password')) {
      msg = 'Password must be at least 6 characters.';
    }
    document.getElementById('error-message').innerText = `Error: ${msg}`;
  }
});

function togglePassword() {
  const pwd = document.getElementById('password');
  const eye = document.querySelector('.toggle-password');
  if (pwd.type === 'password') {
    pwd.type = 'text';
    eye.classList.add('show');
  } else {
    pwd.type = 'password';
    eye.classList.remove('show');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelector('.auth-container')?.classList.add('scale-in');
  }, 200);
});

document.querySelector('.loading-container').classList.remove('show');

// Show spinner immediately
document.getElementById('global-loading').classList.add('show');
// Hide spinner when page is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('global-loading').classList.remove('show');
  }, 400); // Minimum visible time for smoothness
});

// Show spinner on navigation
document.querySelectorAll('a[href]').forEach(link => {
  // Only for internal links
  link.addEventListener('click', function(e) {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http') && !href.startsWith('#') && !link.hasAttribute('download') && !link.target) {
      document.getElementById('global-loading').classList.add('show');
    }
  });
});
