// Direct fix for toggle buttons - adds capturing event listeners
(function() {
  console.log('[toggle-fix-v2] Starting...');
  
  function fixButtons() {
    const btnEnc = document.getElementById('btn-encaissements');
    const btnSol = document.getElementById('btn-soldes');
    const btnReg = document.getElementById('btn-reglements');
    
    console.log('[toggle-fix-v2] Buttons:', {enc: !!btnEnc, sol: !!btnSol, reg: !!btnReg});
    
    function showSection(targetId, btn) {
      console.log('[toggle-fix-v2] Showing section:', targetId);
      
      // Hide all panels
      document.querySelectorAll('.section-panel').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
      });
      
      // Remove active from all buttons
      document.querySelectorAll('.section-toggle-btn').forEach(b => {
        b.classList.remove('active');
      });
      
      // Show target
      const target = document.getElementById(targetId);
      if (target) {
        target.style.display = 'block';
        target.classList.add('active');
        if (btn) btn.classList.add('active');
        console.log('[toggle-fix-v2] Section shown:', targetId);
      } else {
        console.log('[toggle-fix-v2] ERROR: Target not found:', targetId);
      }
    }
    
    if (btnEnc) {
      btnEnc.addEventListener('click', function(e) {
        console.log('[toggle-fix-v2] Encaissements clicked');
        e.preventDefault();
        e.stopPropagation();
        showSection('section-encaissements', btnEnc);
      }, true); // Use capture phase
    }
    
    if (btnSol) {
      btnSol.addEventListener('click', function(e) {
        console.log('[toggle-fix-v2] Soldes clicked');
        e.preventDefault();
        e.stopPropagation();
        showSection('section-soldes', btnSol);
      }, true); // Use capture phase
    }
    
    if (btnReg) {
      btnReg.addEventListener('click', function(e) {
        console.log('[toggle-fix-v2] Reglements clicked');
        e.preventDefault();
        e.stopPropagation();
        showSection('section-reglements', btnReg);
      }, true); // Use capture phase
    }
    
    console.log('[toggle-fix-v2] Event listeners attached');
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(fixButtons, 200);
    });
  } else {
    setTimeout(fixButtons, 200);
  }
})();
