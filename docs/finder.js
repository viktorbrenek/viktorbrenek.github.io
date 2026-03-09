(function () {
  const layers = document.querySelectorAll("[data-type='parallax']");
  if (!layers.length) {
    return;
  }

  let ticking = false;

  const updateParallax = () => {
    const topDistance = window.pageYOffset;

    for (let i = 0; i < layers.length; i += 1) {
      const layer = layers[i];
      const depth = Number(layer.getAttribute("data-depth")) || 0;
      const movement = -(topDistance * depth);
      const translate3d = `translate3d(0, ${movement}px, 0)`;

      layer.style.transform = translate3d;
    }

    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
})();
