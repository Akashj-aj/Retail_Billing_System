const supabase = window.supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
  loadCategories();       // Load categories into dropdown
  setupFilters();         // Set up live search and filter
  displayProducts();      // Initial product display
});

// Load categories into the category dropdown
async function loadCategories() {
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name');

  if (error) {
    console.error('Error fetching categories:', error);
    return;
  }

  const categorySelect = document.getElementById('category-select');
  categorySelect.innerHTML = '<option value="">All Categories</option>';

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });
}

// Set up live search and category filtering
function setupFilters() {
  document.getElementById('search-input').addEventListener('input', displayProducts);
  document.getElementById('category-select').addEventListener('change', displayProducts);
}

// Fetch products with filters applied
async function fetchProducts() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const category = document.getElementById('category-select').value;

  let query = supabase.from('products').select('*');

  if (category) {
    query = query.eq('category_id', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  if (searchTerm) {
    return data.filter(p =>
      p.name.toLowerCase().includes(searchTerm) ||
      (p.description && p.description.toLowerCase().includes(searchTerm))
    );
  }

  return data;
}

// Display products on the page
async function displayProducts() {
  const products = await fetchProducts();
  const productsContainer = document.getElementById('products-container');
  productsContainer.innerHTML = '';

  if (products.length === 0) {
    productsContainer.innerHTML = '<p>No products found.</p>';
    return;
  }

  products.forEach(product => {
    const div = document.createElement('div');
    div.classList.add('product-item');
    div.innerHTML = `
      <h3>${product.name}</h3>
      <p class="product-desc">${product.description || ''}</p>
      <div class="product-meta">
        <span class="product-price">₹${product.price}</span>
        <span class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
          ${product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
        </span>
      </div>
      <button onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled style="opacity:0.6;cursor:not-allowed;"' : ''}>Add to Cart</button>
    `;
    productsContainer.appendChild(div);
  });
}

// Add product to cart
async function addToCart(productId) {
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error || !product) {
    console.error("Error fetching product:", error);
    showMessage("Could not add product to cart.");
    return;
  }

  if (product.stock === 0) {
    showMessage("Sorry, this product is out of stock.");
    return;
  }

  let cart = JSON.parse(localStorage.getItem('cart')) || [];

  const existing = cart.find(item => item.productId === productId);
  if (existing) {
    if (existing.quantity < product.stock) {
      existing.quantity += 1;
    } else {
      showMessage("No more stock available for this product.");
      return;
    }
  } else {
    cart.push({
      productId: product.id,
      quantity: 1,
      name: product.name,
      price: product.price,
      description: product.description,
      stock: product.stock
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  showMessage('Product added to cart!');
}

// Temporary confirmation message
function showMessage(msg) {
  const messageBox = document.createElement('div');
  messageBox.textContent = msg;
  messageBox.classList.add('message');
  document.body.appendChild(messageBox);
  setTimeout(() => {
    messageBox.remove();
  }, 2000);
}

// Logout functionality
document.getElementById('logout-button-nav')?.addEventListener('click', async function(e) {
  e.preventDefault();
  const { error } = await window.supabaseClient.auth.signOut();
  if (error) {
    alert('Error logging out');
  } else {
    window.location.href = 'login.html';
  }
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
