/**
 * Bank-related operations for the financial dashboard
 */
const deleteBanque = (id) => {
    fetch(`/tresorerie/banques/delete/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(response => {
        if (response.ok) {
          alert('Banque supprimée avec succès');
          location.reload();
        } else {
          alert('Erreur lors de la suppression de la banque');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Erreur lors de la suppression de la banque');
      });
  };
  
  const openBanqueModal = () => {
    $('#banqueModal').modal('show');
  };
  
  export { deleteBanque, openBanqueModal };