// Fetch cart items from localStorage and attach product info
async function fetchCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const itemsWithDetails = [];

  for (let item of cart) {
    const { data: product, error } = await window.supabaseClient
      .from("products")
      .select("*")
      .eq("id", item.productId)
      .single();

    if (!error && product) {
      itemsWithDetails.push({
        ...item,
        name: product.name,
        price: product.price,
        description: product.description,
        stock: product.stock
      });
    }
  }

  return itemsWithDetails;
}

// Display cart on screen
async function displayCart(cartItems) {
  const tbody = document.getElementById("cart-table-body");
  tbody.innerHTML = "";
  let total = 0;

  if (cartItems.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Your cart is empty.</td></tr>`;
    document.getElementById("total-price").textContent = "Total: ₹0"; // Always show total
    return;
  }

  cartItems.forEach((item, index) => {
    total += item.price * item.quantity;
    const tr = document.createElement("tr");
    tr.className = "cart-row";
    tr.innerHTML = `
      <td>
        <div class="cart-product-info">
          <span class="cart-product-name">${item.name}</span>
        </div>
      </td>
      <td>₹${item.price}</td>
      <td>
        <input type="number" min="1" max="${item.stock}" value="${item.quantity}" class="cart-qty-input"
          onchange="updateQuantity(${item.productId}, this.value)">
      </td>
      <td>₹${item.price * item.quantity}</td>
      <td>
        <button class="danger" onclick="removeFromCart(${index})">Remove</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("total-price").textContent = `Total: ₹${total}`;
}

function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  fetchCart().then(displayCart);
}


async function updateQuantity(productId, newQty) {
  newQty = parseInt(newQty);
  if (isNaN(newQty) || newQty < 1) return;

  const { data: product, error } = await window.supabaseClient
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (error || !product) {
    alert("Error checking stock.");
    return;
  }

  if (newQty > product.stock) {
    alert(`Only ${product.stock} items in stock.`);
    await displayCart(await fetchCart());
    return;
  }

  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const item = cart.find(i => i.productId === productId);
  if (item) item.quantity = newQty;
  localStorage.setItem("cart", JSON.stringify(cart));
  displayCart(await fetchCart());
}

// Checkout
async function checkout() {
  const { data: userData, error: userError } = await window.supabaseClient.auth.getUser();
  if (userError || !userData.user) {
    alert("You must be logged in to checkout.");
    return;
  }

  const cartItems = await fetchCart();
  if (cartItems.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  const name = document.getElementById("customer-name").value.trim();
  const address = document.getElementById("customer-address").value.trim();
  const phone = document.getElementById("customer-phone").value.trim();

  if (!name || !address || !phone) {
    alert("All fields are required.");
    return;
  }

  let customerId;
  const { data: existingCustomer } = await window.supabaseClient
    .from("customers")
    .select("*")
    .eq("name", name)
    .eq("address", address)
    .eq("phone", phone)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: insertError } = await window.supabaseClient
      .from("customers")
      .insert([{ user_id: userData.user.id, name, address, phone }])
      .select()
      .single();

    if (insertError) {
      alert("Error saving customer details.");
      return;
    }

    customerId = newCustomer.id;
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const { data: purchase, error: purchaseError } = await window.supabaseClient
    .from("purchases")
    .insert([{ customer_id: customerId, total_amount: totalAmount }])
    .select()
    .single();

  if (purchaseError) {
    alert("Error completing purchase.");
    return;
  }

  for (let item of cartItems) {
    const { error: itemError } = await window.supabaseClient
      .from("purchase_items")
      .insert([{
        purchase_id: purchase.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_purchase: item.price
      }]);

    if (itemError) {
      alert("Error saving items.");
      return;
    }

    const newStock = item.stock - item.quantity;
    await window.supabaseClient
      .from("products")
      .update({ stock: newStock })
      .eq("id", item.productId);
  }

  showReceiptModal({
    customer: { name, phone, address },
    items: cartItems,
    total: totalAmount,
    date: new Date().toLocaleString()
  });
}

// Receipt modal display
function showReceiptModal({ customer, items, total, date }) {
  let receiptHtml = `
    <p><strong>Name:</strong> ${customer.name}</p>
    <p><strong>Phone:</strong> ${customer.phone}</p>
    <p><strong>Address:</strong> ${customer.address}</p>
    <p><strong>Date:</strong> ${date}</p>
    <h3>Items:</h3>
    <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
      <tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr>
  `;

  items.forEach(item => {
    const subtotal = item.price * item.quantity;
    receiptHtml += `
      <tr>
        <td>${item.name}</td>
        <td>₹${item.price}</td>
        <td>${item.quantity}</td>
        <td>₹${subtotal}</td>
      </tr>
    `;
  });

  receiptHtml += `</table><h3>Total Paid: ₹${total}</h3>`;

  document.getElementById("receipt-body").innerHTML = receiptHtml;
  document.getElementById("receipt-modal").style.display = "flex";

  localStorage.removeItem("cart");
  fetchCart().then(displayCart);
}

function closeReceiptModal() {
  document.getElementById("receipt-modal").style.display = "none";
  window.location.href = "home.html";
}

document.getElementById("download-pdf-btn").addEventListener("click", () => {
  const element = document.getElementById("receipt-content");

  // Hide buttons temporarily
  const downloadBtn = document.getElementById("download-pdf-btn");
  const closeBtn = element.querySelector("button[onclick='closeReceiptModal()']");
  
  downloadBtn.style.display = "none";
  closeBtn.style.display = "none";

  const opt = {
    margin: 0.5,
    filename: `receipt_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 3 }, // Higher scale for sharper PDF
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    // Show buttons again
    downloadBtn.style.display = "";
    closeBtn.style.display = "";
  });
});

// Page load and button events
document.addEventListener("DOMContentLoaded", async () => {
  const cartItems = await fetchCart();
  displayCart(cartItems);
});

document.getElementById('checkout-btn').addEventListener('click', async () => {
  const cartItems = await fetchCart();
  if (cartItems.length === 0) {
    alert("Your cart is empty.");
    return;
  }
  document.getElementById('customer-form-modal').classList.add('show');
});

document.getElementById('cancel-btn-modal').addEventListener('click', () => {
  closeCustomerForm();
});

document.getElementById("customer-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  await checkout();
  closeCustomerForm();
});

function closeCustomerForm() {
  document.getElementById('customer-form-modal').classList.remove('show');
  document.getElementById('customer-form').reset();
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
