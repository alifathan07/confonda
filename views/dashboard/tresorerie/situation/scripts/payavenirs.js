/**
 * jQuery-based filter for payavenirs table
 */
const filterPayavenirs = () => {
    const statut = $('#statutFilterPaiment').val();
    const fournisseur = $('#fournisseurFilterPaiment').val();
    const banque = $('#banqueFilterPaiment').val();
    const toDate = $('#to').val();
  
    $('#payavenirsTable tbody tr').each(function() {
      const row = $(this);
      const rowStatut = row.data('statut');
      const rowFournisseur = row.data('fournisseur');
      const rowBanque = row.data('banque');
      const rowDate = row.find('td').eq(2).text();
  
      let show = true;
      if (statut && rowStatut !== statut) show = false;
      if (fournisseur && rowFournisseur !== fournisseur) show = false;
      if (banque && rowBanque !== banque) show = false;
      if (toDate && new Date(rowDate) > new Date(toDate)) show = false;
  
      row.toggle(show);
    });
  };
  
  export { filterPayavenirs };