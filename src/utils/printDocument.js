/**
 * Lance l'impression en isolant le contenu dans `.edu-print-root`.
 * @param {string} bodyClass - ex. 'printing-bulletins'
 * @param {number} delayMs
 */
export function printDocument(bodyClass, delayMs = 350) {
  document.body.classList.add(bodyClass);
  setTimeout(() => {
    window.print();
    const cleanup = () => {
      document.body.classList.remove(bodyClass);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
  }, delayMs);
}
