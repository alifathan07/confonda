import prisma from "../db.js";
import bcrypt from "bcryptjs";

// List all users
export const listUsers = async (req, res) => {
  try {
    const currentUser = req.session.user;
    const users = await prisma.user.findMany({
        include: { chantier: true },
    });
    const chantiers = await prisma.chantier.findMany();
    // Format data to match frontend expectations
   
    res.render("dashboard/users/index", { users: users, chantiers: chantiers, currentUser: currentUser });
    console.log(currentUser);
    
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};
export const addUser = async (req, res) => {
    try {
        const { name, email, password, chantierId } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                chantierId  : parseInt(chantierId),
            },
        });
        res.redirect('/users');
    } catch (error) {
        console.error("Error adding user:", error);
        res.redirect('/users');
    }
}
