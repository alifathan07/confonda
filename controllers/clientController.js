import prisma from "../db.js";

export const indexClient = async(req, res) => {
      const clients = await prisma.client.findMany({
        orderBy: { id: 'desc' },
        include: {
          chantier: true 
        }
      });
      res.render('dashboard/ventes/client/index', { clients })
}
export const createUi = (req, res) => {
    res.render('dashboard/ventes/client/create')
}
export const postClient = async (req, res) => { 
  const {name , ice , identifFiscal , email , contact , telContact , telClient , address} = req.body
  const client = await prisma.client.create({
    data: {
      name : name,
      ice : ice ? ice : Math.floor(Math.random() * 1000000).toString(), 
      identifFiscal : identifFiscal ? identifFiscal : Math.floor(Math.random() * 1000000).toString(),
      email : email ? email : "",
      contact : contact ? contact : "",
      telContact : telContact ? telContact : "",
      telClient : telClient ? telClient : "",
      address : address ? address : "",
    },
  });
  res.redirect("/ventes/clients");
};



export const updateClient = async (req, res) => {
  const clientId = parseInt(req.params.id);
  const { name, ice, identifFiscal, email, contact, telContact, telClient, address } = req.body;

  try {
    // Update the client
   const update =  await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        ice,
        identifFiscal,
        email,
        contact,
        telContact,
        telClient,
        address
      }
    });
    if (update) {
      console.log("Client updated successfully");
      
    }else{
      console.log("Client not updated");
      
    }

    // Redirect back to client list or detail page
    res.redirect('/ventes/clients');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la mise à jour du client');
  }
};

export const updateUiClient = async(req, res) => {
  const clients = await prisma.client.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  res.render('dashboard/ventes/client/update', { clients })
}
export const showClient = async (req, res) => {
  const clients = await prisma.client.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      chantier: true,
      recavenir: true,
    },
  });
  res.render('dashboard/ventes/client/clientboard/index', { clients })
}


export const destroyClient = async(req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    await prisma.client.delete({
      where: {
        id: clientId
      }
    })
    res.status(200).send("deleted");
  } catch (error) {
    console.log('Error : ' , error)
    res.status(500).send('Erreur lors de la suppression du client');
  }
}



 