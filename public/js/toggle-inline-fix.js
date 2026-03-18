// Inline fix - runs immediately
(function() {
  window.toggleSection = function(targetId, btn) {
    // Get all panels and buttons
    var panels = document.querySelectorAll('.section-panel');
    var buttons = document.querySelectorAll('.section-toggle-btn');
    var target = document.getElementById(targetId);
    
    // Check if already active
    var isActive = btn && btn.classList.contains('active');
    
    // Hide all panels
    panels.forEach(function(p) { p.style.display = 'none'; });
    buttons.forEach(function(b) { b.classList.remove('active'); });
    
    // Show clicked section (if not already active)
    if (!isActive && target) {
      target.style.display = 'block';
      if (btn) btn.classList.add('active');
    }
  };
})();
