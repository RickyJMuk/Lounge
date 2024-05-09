window.addEventListener('load', () => {
  let menuContainer = select('.menu-container');
  if (menuContainer) {
    let menuIsotope = new Isotope(menuContainer, {
      itemSelector: '.menu-item',
      layoutMode: 'fitRows'
    });

    let menuFilters = select('#menu-flters li', true);

    on('click', '#menu-flters li', function(e) {
      e.preventDefault();

      // Remove the "slide" class from all menu items
      menuFilters.forEach(function(el) {
        el.classList.remove('filter-active', 'slide');
      });

      // Add the "slide" class to the clicked menu item
      this.classList.add('filter-active', 'slide');

      menuIsotope.arrange({
        filter: this.getAttribute('data-filter')
      });

      menuIsotope.on('arrangeComplete', function() {
        AOS.refresh();
      });
    }, true);
  }
});
