/**
 * Helper functions for formatting and parsing numbers
 */
const formatFrenchNumber = (value) => {
    if (!value || isNaN(value)) return '0,00';
    return value.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const parseFrenchNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.replace(/\s/g, '').replace(',', '.')) || 0;
  };
  
  export { formatFrenchNumber, parseFrenchNumber };