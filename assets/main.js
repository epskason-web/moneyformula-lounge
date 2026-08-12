// 錢途雅座 Money Formula Lounge — shared site script

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.mobile-menu-btn');
  const panel = document.querySelector('.mobile-nav');
  if (btn && panel) {
    btn.addEventListener('click', () => {
      panel.classList.toggle('open');
      btn.textContent = panel.classList.contains('open') ? '✕' : '☰';
    });
  }

  // Toggle-group active state (visual only — wire up to real data later)
  document.querySelectorAll('.toggle-group').forEach(group => {
    group.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      group.querySelectorAll('button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
    });
  });
});
