// Override the broken toggleSection function
console.log('[toggle-fix] Loading fix script...');

window.toggleSection = function(targetId, btn) {
  console.log('[toggle-fix] toggleSection called for:', targetId);
  
  const panels = document.querySelectorAll('.section-panel');
  const toggleBtns = document.querySelectorAll('.section-toggle-btn');
  const targetPanel = document.getElementById(targetId);
  const isActive = btn && btn.classList && btn.classList.contains('active');

  console.log('[toggle-fix] isActive:', isActive, 'targetPanel found:', !!targetPanel);

  // If clicking the same active button, just close it
  if (isActive) {
    panels.forEach(p => p.style.display = 'none');
    toggleBtns.forEach(b => b.classList.remove('active'));
    return;
  }

  // Hide all panels and remove active class from all buttons
  panels.forEach(p => p.style.display = 'none');
  toggleBtns.forEach(b => b.classList.remove('active'));

  // Show the clicked section and activate its button
  if (targetPanel) {
    targetPanel.style.display = 'block';
    console.log('[toggle-fix] Setting display:block for:', targetId);
    if (btn && btn.classList) {
      btn.classList.add('active');
    }
  }
};

// Re-bind the buttons with the fixed function
function fixToggleButtons() {
  console.log('[toggle-fix] Running fixToggleButtons...');
  
  const btnReg = document.getElementById('btn-reglements');
  const btnEnc = document.getElementById('btn-encaissements');
  const btnSol = document.getElementById('btn-soldes');

  console.log('[toggle-fix] Buttons found:', {
    reglements: !!btnReg,
    encaissements: !!btnEnc,
    soldes: !!btnSol
  });

  if (btnEnc) {
    btnEnc.onclick = function(e) {
      e.preventDefault();
      console.log('[toggle-fix] Encaissements button clicked');
      toggleSection('section-encaissements', btnEnc);
    };
    console.log('[toggle-fix] Encaissements button rebound');
  }
  
  if (btnSol) {
    btnSol.onclick = function(e) {
      e.preventDefault();
      console.log('[toggle-fix] Soldes button clicked');
      toggleSection('section-soldes', btnSol);
    };
    console.log('[toggle-fix] Soldes button rebound');
  }
  
  if (btnReg) {
    btnReg.onclick = function(e) {
      e.preventDefault();
      console.log('[toggle-fix] Reglements button clicked');
      toggleSection('section-reglements', btnReg);
    };
    console.log('[toggle-fix] Reglements button rebound');
  }
  
  console.log('[toggle-fix] Buttons rebound successfully');
}

// Run the fix when DOM is ready
function runFix() {
  console.log('[toggle-fix] Running fix...');
  fixToggleButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(runFix, 100); // Small delay to ensure original script ran
  });
} else {
  setTimeout(runFix, 100); // Small delay to ensure original script ran
}
