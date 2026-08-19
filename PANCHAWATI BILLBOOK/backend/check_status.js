async function main() {
  const res = await fetch('https://backend-nine-phi-tms0hdue3l.vercel.app/api/inventory/products');
  console.log("STATUS:", res.status);
  console.log("TEXT:", await res.text());
}
main();
