const input = document.querySelector('input');
const content = document.getElementById('content');

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    content.innerHTML = `<p>Searching for: <strong>${input.value}</strong></p>`;
  }
});