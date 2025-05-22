const supabase = window.supabaseClient;

async function fetchSales(fromDate, toDate) {
  let query = supabase
    .from('purchases')
    .select(`
      id,
      created_at,
      total_amount,
      customers:customer_id (
        name,
        phone,
        address
      ),
      purchase_items (
        quantity,
        price_at_purchase,
        products:product_id (
          name,
          categories (
            name
          )
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (fromDate) {
    query = query.gte('created_at', fromDate + 'T00:00:00');
  }
  if (toDate) {
    query = query.lte('created_at', toDate + 'T23:59:59');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }

  return data;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function renderSalesTable(sales) {
  const tbody = document.getElementById('sales-body');
  tbody.innerHTML = '';

  sales.forEach((sale, index) => {
    const customerName = sale.customers?.name || 'N/A';
    const total = formatINR(sale.total_amount || 0);

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(sale.created_at)}</td>
      <td>${customerName}</td>
      <td>${total}</td>
      <td><button onclick="showDetails(${index})">View Details</button></td>
    `;
    tbody.appendChild(row);
  });

  window.salesData = sales;
}

function showDetails(index) {
  const sale = window.salesData[index];
  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');

  const customer = sale.customers || {};
  const name = customer.name || 'Unknown';
  const phone = customer.phone || 'N/A';
  const address = customer.address || 'N/A';

  const itemsHTML = (sale.purchase_items || []).map(item => {
    const productName = item.products?.name || 'Unnamed Product';
    const qty = item.quantity || 0;
    const price = item.price_at_purchase || 0;
    const total = qty * price;
    return `
      <tr>
        <td>${productName}</td>
        <td>${formatINR(price)}</td>
        <td>${qty}</td>
        <td>${formatINR(total)}</td>
      </tr>
    `;
  }).join('');

  content.innerHTML = `
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Address:</strong> ${address}</p>
    <p><strong>Date:</strong> ${formatDate(sale.created_at)}</p>

    <p><strong>Items:</strong></p>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th style="border: 1px solid #ccc;">Product</th>
          <th style="border: 1px solid #ccc;">Price</th>
          <th style="border: 1px solid #ccc;">Qty</th>
          <th style="border: 1px solid #ccc;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHTML}
      </tbody>
    </table>

    <p style="margin-top: 10px;"><strong>Total Paid:</strong> ${formatINR(sale.total_amount || 0)}</p>
    <button onclick="closeModal()">Close</button>
  `;

  modal.classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

async function applyDateFilter() {
  const fromDate = document.getElementById('from-date').value;
  const toDate = document.getElementById('to-date').value;
  const sales = await fetchSales(fromDate, toDate);
  renderSalesTable(sales);
}

async function resetDateFilter() {
  document.getElementById('from-date').value = '';
  document.getElementById('to-date').value = '';
  const sales = await fetchSales();
  renderSalesTable(sales);
}
// Show spinner immediately
document.getElementById('global-loading').classList.add('show');
// Hide spinner when page is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    document.getElementById('global-loading').classList.remove('show');
  }, 400); // Minimum visible time for smoothness
});


async function init() {
  const sales = await fetchSales();
  renderSalesTable(sales);
}

init();

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


