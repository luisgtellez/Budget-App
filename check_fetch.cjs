async function run() {
  const res = await fetch('https://drive.google.com/uc?export=download&id=1paLbNkb5HtGa_eb15MRg1RBLNYn2_UXG');
  console.log('Status:', res.status);
  console.log('Headers:', Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log('Content start:', text.substring(0, 100));
}
run();
