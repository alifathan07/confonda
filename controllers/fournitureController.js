import prisma from "../db.js";

export const createFourniture = async (req, res) => {
    res.render('dashboard/achats/fourniture/create', { user: req.session.user });
}
export const postFourniture = async (req, res) => {
    try {
      console.log("📥 Form body:", req.body);
  
      const { dateEtablissement, chantierId } = req.body;
         // Get last record
        const last = await prisma.demandeFourniture.findFirst({
            orderBy: { id: "desc" },
        });
    
      // Build produits array from parallel arrays
      const produits = (req.body.designation || []).map((_, index) => ({
        codeArticle: req.body.codeArticle[index] || null,
        designation: req.body.designation[index] || null,
        unite: req.body.unite[index] || null,
        qteDemandee: req.body.qteDemandee[index] ? parseInt(req.body.qteDemandee[index]) : null,
        qteStockee: req.body.qteStockee[index] ? parseInt(req.body.qteStockee[index]) : null,
        dateTot: req.body.dateTôt[index] ? new Date(req.body.dateTôt[index]) : null,
        dateTard: req.body.dateTard[index] ? new Date(req.body.dateTard[index]) : null,
        qtePrevue: req.body.qtePrevue[index] ? parseInt(req.body.qtePrevue[index]) : null,
        qteRecue: req.body.qteRecue[index] ? parseInt(req.body.qteRecue[index]) : null,
        lot: req.body.lot[index] || null,
        observation: req.body.observation[index] || null,
        quantite: req.body.qteDemandee[index] ? parseInt(req.body.qteDemandee[index]) : 0 // fallback
      }));
  
      const fourniture = await prisma.demandeFourniture.create({
        data: {
          codeDemande: last ? last.codeDemande + 1 : 1,
          chantierId: req.session.user?.chantierId,
          dateEtablissement: new Date(dateEtablissement),
          requestedById: req.session.user?.id || null,
          produits: {
            create: produits
          }
        },
        include: { produits: true }
      });
  
      console.log("✅ Fourniture créée:", fourniture);
      res.redirect("/achats/fourniture");
    } catch (error) {
      console.error("❌ Erreur création fourniture:", error);
      res.status(500).send("Erreur lors de la création de la demande de fourniture");
    }
  };
  