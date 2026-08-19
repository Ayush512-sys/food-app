async function main() {
  try {
    const loginRes = await fetch('https://backend-nine-phi-tms0hdue3l.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    const res = await fetch('https://backend-nine-phi-tms0hdue3l.vercel.app/api/inventory/products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const products = await res.text();
    console.log("RESPONSE:", products.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
}
main();
