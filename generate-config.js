const fs = require('fs');

const configContent = `
window.SUPABASE_URL = "${process.env.SUPABASE_URL}";
window.SUPABASE_KEY = "${process.env.SUPABASE_KEY}";
`;

fs.writeFileSync('js/config.js', configContent);