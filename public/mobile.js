/**
 * Gestion de l'interface mobile - Accordéons
 * Remplace les tabs par des accordéons sur petit écran
 */

// Détection mobile
function isMobileView() {
  return window.innerWidth <= 768;
}

// Créer les accordéons à partir des tabs
function createAccordions() {
  // Vérifier si on est en vue détail
  const detailView = document.querySelector('.detail-view');
  if (!detailView) return;

  // Vérifier si les accordéons existent déjà
  let accordionContainer = detailView.querySelector('.accordion-container');
  
  if (isMobileView()) {
    // Mode mobile : créer les accordéons si nécessaire
    if (!accordionContainer) {
      accordionContainer = document.createElement('div');
      accordionContainer.className = 'accordion-container';
      
      // Insérer après les tabs
      const tabs = detailView.querySelector('.tabs');
      if (tabs) {
        tabs.parentNode.insertBefore(accordionContainer, tabs.nextSibling);
      }
    }

    // Vider le container
    accordionContainer.innerHTML = '';

    // Définir les sections
    const sections = [
      {
        id: 'general',
        icon: '📋',
        title: 'Général',
        content: document.getElementById('tab-general')
      },
      {
        id: 'resultats',
        icon: '🎯',
        title: 'Résultats attendus',
        content: document.getElementById('tab-resultats')
      },
      {
        id: 'indicateurs',
        icon: '📊',
        title: 'Indicateurs',
        content: document.getElementById('tab-indicateurs')
      },
      {
        id: 'budget',
        icon: '📈',
        title: 'Budget',
        content: document.getElementById('tab-budget')
      },
      {
        id: 'historique',
        icon: '📜',
        title: 'Historique',
        content: document.getElementById('tab-historique')
      }
    ];

    // Créer les items d'accordéon
    sections.forEach((section, index) => {
      if (!section.content) return;

      const accordionItem = document.createElement('div');
      accordionItem.className = 'accordion-item';
      if (index === 0) accordionItem.classList.add('active'); // Premier ouvert par défaut

      const accordionHeader = document.createElement('div');
      accordionHeader.className = 'accordion-header';
      accordionHeader.innerHTML = `
        <h3>${section.icon} ${section.title}</h3>
        <span class="accordion-icon">▼</span>
      `;

      const accordionContent = document.createElement('div');
      accordionContent.className = 'accordion-content';
      
      const accordionBody = document.createElement('div');
      accordionBody.className = 'accordion-body';
      
      // Cloner le contenu de la tab correspondante
      accordionBody.appendChild(section.content.cloneNode(true));

      accordionContent.appendChild(accordionBody);
      accordionItem.appendChild(accordionHeader);
      accordionItem.appendChild(accordionContent);
      accordionContainer.appendChild(accordionItem);

      // Event listener pour toggle
      accordionHeader.addEventListener('click', () => {
        toggleAccordion(accordionItem);
      });
    });

    // Afficher le container d'accordéons
    accordionContainer.style.display = 'block';
  } else {
    // Mode desktop : masquer les accordéons
    if (accordionContainer) {
      accordionContainer.style.display = 'none';
    }
  }
}

// Toggle accordéon
function toggleAccordion(item) {
  const isActive = item.classList.contains('active');
  
  // Option 1 : Fermer les autres (mode exclusif)
  // const allItems = item.parentElement.querySelectorAll('.accordion-item');
  // allItems.forEach(i => i.classList.remove('active'));
  
  // Option 2 : Permettre plusieurs accordéons ouverts
  if (isActive) {
    item.classList.remove('active');
  } else {
    item.classList.add('active');
  }
}

// Initialiser les accordéons
function initMobileAccordions() {
  createAccordions();
  
  // Recréer les accordéons lors du redimensionnement
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      createAccordions();
    }, 250);
  });
}

// Observer les changements de vue pour recréer les accordéons
function observeViewChanges() {
  // Observer quand la vue détail est chargée
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        const detailView = document.querySelector('.detail-view');
        if (detailView && isMobileView()) {
          createAccordions();
        }
      }
    });
  });

  // Observer le container principal
  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    observer.observe(mainContent, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }
}

// Améliorer le retour tactile
function enhanceTouchFeedback() {
  if (!isMobileView()) return;

  // Ajouter des effets tactiles aux éléments cliquables
  document.addEventListener('touchstart', (e) => {
    const target = e.target.closest('button, .action-card, .programme-card');
    if (target) {
      target.style.transform = 'scale(0.98)';
      target.style.transition = 'transform 0.1s ease';
    }
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const target = e.target.closest('button, .action-card, .programme-card');
    if (target) {
      setTimeout(() => {
        target.style.transform = '';
      }, 100);
    }
  }, { passive: true });
}

// Gérer le scroll sur mobile
function handleMobileScroll() {
  if (!isMobileView()) return;

  // Sauvegarder la position de scroll
  let scrollPosition = 0;

  // Avant d'ouvrir un modal
  document.addEventListener('modalOpen', () => {
    scrollPosition = window.pageYOffset;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
  });

  // Après fermeture du modal
  document.addEventListener('modalClose', () => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollPosition);
  });
}

// Prévenir le zoom sur les inputs iOS
function preventIOSZoom() {
  if (!isMobileView()) return;

  // Détecter iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (isIOS) {
    // S'assurer que tous les inputs ont une taille de police >= 16px
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const fontSize = window.getComputedStyle(input).fontSize;
      if (parseFloat(fontSize) < 16) {
        input.style.fontSize = '16px';
      }
    });
  }
}

// Gérer le header collapsible sur mobile
function initCompactHeader() {
  if (!isMobileView()) return;

  const header = document.querySelector('.app-header');
  if (!header) return;

  // Vérifier si déjà initialisé
  if (header.classList.contains('mobile-header-init')) return;
  header.classList.add('mobile-header-init');

  // Ajouter la classe compact par défaut
  header.classList.add('compact');

  // Créer le bouton toggle si pas déjà présent
  let toggleBtn = header.querySelector('.header-toggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.className = 'header-toggle';
    toggleBtn.innerHTML = '<span class="header-toggle-icon">▼</span>';
    toggleBtn.setAttribute('aria-label', 'Toggle header');
    toggleBtn.setAttribute('type', 'button');

    // Restructurer le header
    const headerTitle = header.querySelector('h1');
    const userInfo = header.querySelector('.header-user') || header.querySelector('.user-info');

    // Créer la structure
    const headerTop = document.createElement('div');
    headerTop.className = 'app-header-top';

    const headerDetails = document.createElement('div');
    headerDetails.className = 'app-header-details';

    const headerDetailsContent = document.createElement('div');
    headerDetailsContent.className = 'app-header-details-content';

    // Clone des infos utilisateur pour les détails
    if (userInfo) {
      const userInfoFull = document.createElement('div');
      userInfoFull.className = 'user-info-full';

      const userName = document.getElementById('userName');
      const userRole = document.getElementById('userRole');

      if (userName && userRole) {
        userInfoFull.innerHTML = `
          <div class="user-info-row">
            <span class="user-label">Utilisateur</span>
            <span class="user-value">${userName.textContent}</span>
          </div>
          <div class="user-info-row">
            <span class="user-label">Rôle</span>
            <span class="user-role-badge">${userRole.textContent}</span>
          </div>
        `;

        // Boutons d'action
        const usersBtn = document.getElementById('usersManagementBtn');
        const logoutBtn = document.querySelector('[onclick*="logout"]');

        if (usersBtn || logoutBtn) {
          const headerActions = document.createElement('div');
          headerActions.className = 'header-actions';

          if (usersBtn && usersBtn.style.display !== 'none') {
            const usersBtnClone = usersBtn.cloneNode(true);
            usersBtnClone.textContent = '👥 Utilisateurs';
            headerActions.appendChild(usersBtnClone);
          }

          if (logoutBtn) {
            const logoutBtnClone = document.createElement('button');
            logoutBtnClone.className = 'btn btn-secondary';
            logoutBtnClone.textContent = '🚪 Déconnexion';
            logoutBtnClone.onclick = () => API.logout();
            headerActions.appendChild(logoutBtnClone);
          }

          userInfoFull.appendChild(headerActions);
        }

        headerDetailsContent.appendChild(userInfoFull);
      }
    }

    headerDetails.appendChild(headerDetailsContent);

    // Assembler le header
    if (headerTitle) {
      headerTop.appendChild(headerTitle.cloneNode(true));
      headerTitle.replaceWith(headerTop);
    }

    headerTop.appendChild(toggleBtn);

    if (userInfo) {
      // Garder une version minimaliste visible
      const userIcon = document.createElement('div');
      userIcon.className = 'user-icon-mini';
      userIcon.innerHTML = '👤';
      userIcon.style.cssText = 'font-size: 1.2rem; cursor: pointer;';
      userIcon.onclick = () => toggleBtn.click();
      headerTop.appendChild(userIcon);
    }

    header.appendChild(headerDetails);

    // Event listener pour le toggle
    toggleBtn.addEventListener('click', () => {
      toggleHeader();
    });

    // Event listener pour cacher en scrollant (optionnel)
    let lastScroll = 0;
    let scrollTimeout;

    window.addEventListener('scroll', () => {
      if (!isMobileView()) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > lastScroll && currentScroll > 50) {
          // Scroll vers le bas : compacter le header
          header.classList.add('compact');
          if (header.classList.contains('expanded')) {
            toggleHeader();
          }
        }

        lastScroll = currentScroll;
      }, 100);
    }, { passive: true });
  }
}

// Toggle du header
function toggleHeader() {
  const header = document.querySelector('.app-header');
  if (!header) return;

  header.classList.toggle('expanded');
  header.classList.toggle('compact');
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
  // Attendre un peu pour s'assurer que le DOM est prêt
  setTimeout(() => {
    initMobileAccordions();
    observeViewChanges();
    enhanceTouchFeedback();
    handleMobileScroll();
    preventIOSZoom();
    initCompactHeader();
  }, 100);
});

// Réinitialiser les accordéons quand on charge une nouvelle action
window.addEventListener('actionLoaded', () => {
  if (isMobileView()) {
    setTimeout(() => {
      createAccordions();
    }, 100);
  }
});

// Réinitialiser sur changement d'orientation
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    initCompactHeader();
    createAccordions();
  }, 300);
});

// Export pour utilisation externe
window.MobileUI = {
  isMobileView,
  createAccordions,
  toggleAccordion,
  toggleHeader,
  refresh: initMobileAccordions,
  refreshHeader: initCompactHeader
};

