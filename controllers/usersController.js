import { log } from "console";
import prisma from "../db.js";
import bcrypt from "bcryptjs";

// List all users
export const listUsers = async (req, res) => {
  try {
    const currentUser = req.session.user;
    const users = await prisma.user.findMany();
    
    // Format data to match frontend expectations
    
   
    res.render("dashboard/users/index", { users: users, currentUser: currentUser });
    console.log(currentUser);
    
  } catch (error) {
    console.error("Error listing users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
  
};
export const addUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role : role,
            },
        });
        res.redirect("/users");
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ error: "Failed to add user" });
    }
}

export const editUser = async (req, res) => {
  try {
    const { id, name, email, password, role } = req.body;

    // Find the user
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare update data
    const updateData = {
      name,
      email,
      password : password ? await bcrypt.hash(password, 10) : user.password,
      role,
    };

    // Only hash and update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Update user
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error editing user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.body;
        const user = await prisma.user.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
}

export const userData = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

export const postUser = async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });
    console.log('iwas created ');
    
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
};