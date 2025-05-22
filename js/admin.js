// Fetch all products
async function fetchAdminProducts() {
  const { data, error } = await window.supabaseClient.from('products').select('*');
  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }
  return data;
}

// Display product list
function displayAdminProducts(products) {
  const container = document.getElementById('admin-products-container');
  container.innerHTML = '';
  products.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product-item';
    div.innerHTML = `
      <h3>${product.name}</h3>
      <p>${product.description}</p>
      <div class="product-meta">
        <span class="product-price">₹${product.price}</span>
        <span class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
          ${product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
        </span>
      </div>
      <button onclick="editProduct(${product.id})">Edit</button>
      <button onclick="showDeleteConfirm(${product.id})">Delete</button>
    `;
    container.appendChild(div);
  });
}

// Search and filter
async function displayFilteredAdminProducts() {
  const searchTerm = document.getElementById('search-input').value.toLowerCase();
  const categoryId = document.getElementById('category-select').value;

  let query = window.supabaseClient.from('products').select('*');
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error filtering products:', error);
    return;
  }

  let filtered = data;
  if (searchTerm) {
    filtered = data.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  }

  displayAdminProducts(filtered);
}

// Add product
async function addProduct(name, description, price, stock, categoryId) {
  const { error } = await window.supabaseClient.from('products').insert([{ name, description, price, stock, category_id: categoryId }]);
  if (error) {
    console.error("Error adding product:", error);
    return;
  }
  alert("Product added successfully!");
  hideForms();
  const products = await fetchAdminProducts();
  displayAdminProducts(products);
}

// Update product
async function updateProduct(id, name, description, price, stock, categoryId) {
  const { error } = await window.supabaseClient.from('products').update({ name, description, price, stock, category_id: categoryId }).eq('id', id);
  if (error) {
    console.error("Error updating product:", error);
    return;
  }
  alert("Product updated successfully!");
  hideForms();
  const products = await fetchAdminProducts();
  displayAdminProducts(products);
}

// Delete product
async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;
  const { error } = await window.supabaseClient.from('products').delete().eq('id', id);
  if (error) {
    console.error("Error deleting product:", error);
    return;
  }
  alert("Product deleted!");
  const products = await fetchAdminProducts();
  displayAdminProducts(products);
}

// Edit form
async function editProduct(id) {
  hideForms();
  const { data, error } = await window.supabaseClient.from('products').select('*').eq('id', id).single();
  if (error) {
    console.error("Error loading product:", error);
    return;
  }
  document.getElementById('edit-product-id').value = data.id;
  document.getElementById('edit-product-name').value = data.name;
  document.getElementById('edit-product-description').value = data.description;
  document.getElementById('edit-product-price').value = data.price;
  document.getElementById('edit-product-stock').value = data.stock;
  document.getElementById('edit-product-category').value = data.category_id;
  document.getElementById('edit-product-modal').classList.add('show');
}

// Hide forms
function hideForms() {
  // Hide modals
  document.getElementById('add-product-modal').classList.remove('show');
  document.getElementById('edit-product-modal').classList.remove('show');
  // Reset forms if they exist
  if (document.getElementById('add-product-form')) {
    document.getElementById('add-product-form').reset();
  }
  if (document.getElementById('edit-product-form')) {
    document.getElementById('edit-product-form').reset();
  }
}

// Load category filter dropdown
async function loadCategoryFilterDropdown() {
  const { data, error } = await window.supabaseClient.from('categories').select('id, name');
  if (error) {
    console.error("Error loading categories:", error);
    return;
  }

  const dropdown = document.getElementById('category-select');
  dropdown.innerHTML = `<option value="">All Categories</option>`;
  data.forEach(category => {
    const option = new Option(category.name, category.id);
    dropdown.appendChild(option);
  });
}

// Load form categories
async function loadCategories() {
  const { data, error } = await window.supabaseClient.from('categories').select('id, name');
  if (error) {
    console.error('Error loading categories:', error);
    return;
  }

  const addSelect = document.getElementById('product-category');
  const editSelect = document.getElementById('edit-product-category');
  addSelect.innerHTML = '<option value="">Select Category</option>';
  editSelect.innerHTML = '<option value="">Select Category</option>';

  data.forEach(category => {
    const option = new Option(category.name, category.id);
    addSelect.appendChild(option.cloneNode(true));
    editSelect.appendChild(option.cloneNode(true));
  });

  const addOption = new Option('+ Add New Category', 'add-new');
  addSelect.appendChild(addOption);
  editSelect.appendChild(addOption.cloneNode(true));

  addSelect.addEventListener('change', () => {
    document.getElementById('add-new-category-container').style.display = addSelect.value === 'add-new' ? 'block' : 'none';
  });

  editSelect.addEventListener('change', () => {
    document.getElementById('edit-new-category-container').style.display = editSelect.value === 'add-new' ? 'block' : 'none';
  });
}

// Add category
document.getElementById('submit-new-category').addEventListener('click', async () => {
  const name = document.getElementById('new-category-name').value.trim();
  if (!name) return;
  const { data, error } = await window.supabaseClient.from('categories').insert([{ name }]).select().single();
  if (error) {
    console.error('Error adding category:', error);
    return;
  }
  await loadCategories();
  document.getElementById('product-category').value = data.id;
  document.getElementById('add-new-category-container').style.display = 'none';
});

// Add category (edit form)
document.getElementById('edit-submit-new-category').addEventListener('click', async () => {
  const name = document.getElementById('edit-new-category-name').value.trim();
  if (!name) return;
  const { data, error } = await window.supabaseClient.from('categories').insert([{ name }]).select().single();
  if (error) {
    console.error('Error adding category:', error);
    return;
  }
  await loadCategories();
  document.getElementById('edit-product-category').value = data.id;
  document.getElementById('edit-new-category-container').style.display = 'none';
});

// Add form toggle
document.getElementById('show-add-form').addEventListener('click', () => {
  hideForms();
  document.getElementById('add-product-modal').classList.add('show');
});

// Add form submit
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('product-name').value;
  const description = document.getElementById('product-description').value;
  const price = parseFloat(document.getElementById('product-price').value);
  const stock = parseInt(document.getElementById('product-stock').value);
  const categoryId = parseInt(document.getElementById('product-category').value);
  await addProduct(name, description, price, stock, categoryId);
});

// Edit form submit
document.getElementById('edit-product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = parseInt(document.getElementById('edit-product-id').value);
  const name = document.getElementById('edit-product-name').value;
  const description = document.getElementById('edit-product-description').value;
  const price = parseFloat(document.getElementById('edit-product-price').value);
  const stock = parseInt(document.getElementById('edit-product-stock').value);
  const categoryId = parseInt(document.getElementById('edit-product-category').value);
  await updateProduct(id, name, description, price, stock, categoryId);
});

// Logout
document.getElementById('logout-button-nav')?.addEventListener('click', async function(e) {
  e.preventDefault();
  const { error } = await window.supabaseClient.auth.signOut();
  if (error) {
    alert('Error logging out');
  } else {
    window.location.href = 'login.html';
  }
});

// Initial page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadCategoryFilterDropdown();
  await loadCategories();
  const products = await fetchAdminProducts();
  displayAdminProducts(products);

  // // Optional: Live filtering
  document.getElementById('search-input').addEventListener('input', displayFilteredAdminProducts);
  document.getElementById('category-select').addEventListener('change', displayFilteredAdminProducts);
});

let productIdToDelete = null;

function showDeleteConfirm(id) {
  productIdToDelete = id;
  document.getElementById('delete-confirm-modal').classList.add('show');
}

function hideDeleteConfirm() {
  productIdToDelete = null;
  document.getElementById('delete-confirm-modal').classList.remove('show');
}

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
  if (productIdToDelete !== null) {
    await actuallyDeleteProduct(productIdToDelete);
    hideDeleteConfirm();
  }
});

// Use this instead of deleteProduct directly in your HTML
async function actuallyDeleteProduct(id) {
  const { error } = await window.supabaseClient.from('products').delete().eq('id', id);
  if (error) {
    console.error("Error deleting product:", error);
    return;
  }
  alert("Product deleted!");
  const products = await fetchAdminProducts();
  displayAdminProducts(products);
}

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
