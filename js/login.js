const supabase = window.supabaseClient;

async function handleLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Error logging in:', error.message);
    return { success: false, message: error.message };
  }

  const user = data.user;

  // Fetch the user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError.message);
    return { success: false, message: 'Failed to fetch user profile.' };
  }

  return { success: true, user, role: profile.role };
}

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

// Event listener for the login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  // Show loading spinner
  document.querySelector('.loading-container').classList.add('show');

  // Clear previous error
  document.getElementById('error-message').innerText = '';

  if (!email || !password) {
    document.getElementById('error-message').innerText = 'Please enter both email and password.';
    document.querySelector('.loading-container').classList.remove('show');
    return;
  }

  const result = await handleLogin(email, password);
  if (result.success) {
    // Redirect based on role
    if (result.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'home.html';
    }
  } else {
    let msg = result.message || '';
    if (
      msg.toLowerCase().includes('invalid login credentials') ||
      msg.toLowerCase().includes('invalid email or password')
    ) {
      msg = 'Invalid email or password.';
    } else if (msg.toLowerCase().includes('user not found')) {
      msg = 'No account found with this email.';
    }
    document.getElementById('error-message').innerText = `Error: ${msg}`;
    document.querySelector('.loading-container').classList.remove('show');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.querySelector('.auth-container')?.classList.add('scale-in');
  }, 200);
});

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
