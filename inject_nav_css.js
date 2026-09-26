const fs = require('fs');
let css = fs.readFileSync('src/app/globals.css', 'utf8');

const navStyles = `
/* Mobile Bottom Navigation */
.mobile-bottom-nav {
  display: none;
}

@media (max-width: 768px) {
  .mobile-bottom-nav {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #ffffff;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    border-top: 1px solid #e2e8f0;
    z-index: 1000;
    justify-content: space-around;
    align-items: center;
    padding: 10px 5px;
    padding-bottom: calc(10px + env(safe-area-inset-bottom));
  }
  
  .bottom-nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    text-decoration: none;
    font-size: 0.7rem;
    font-weight: 500;
    gap: 4px;
    width: 25%;
  }

  .bottom-nav-item .material-symbols-outlined {
    font-size: 24px;
    color: #94a3b8;
    transition: color 0.2s;
  }
  
  .bottom-nav-item:hover, .bottom-nav-item:active {
    color: #0369a1;
  }
  
  .bottom-nav-item:hover .material-symbols-outlined, .bottom-nav-item:active .material-symbols-outlined {
    color: #0369a1;
  }

  /* Add padding to body so content doesn't get hidden behind the nav bar */
  body {
    padding-bottom: 70px !important;
  }
}
`;

css = css + navStyles;
fs.writeFileSync('src/app/globals.css', css);
console.log('Added nav styles');
