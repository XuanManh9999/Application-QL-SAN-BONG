const asyncHandler = require("../../utils/asyncHandler");
const prisma = require("../../config/prisma");
const bcrypt = require("bcryptjs");

const me = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.json({ success: true, data: user });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.json({ success: true, data: users });
});

const createUser = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password, role, isActive } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, message: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      passwordHash,
      role,
      isActive: isActive ?? true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.status(201).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "User not found" });

  if (req.body.email && req.body.email !== existing.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (emailExists) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
  }

  const data = { ...req.body };
  if (req.body.password) {
    data.passwordHash = await bcrypt.hash(req.body.password, 10);
    delete data.password;
  }

  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.json({ success: true, data: updated });
});

const deleteUser = asyncHandler(async (req, res) => {
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ success: false, message: "User not found" });

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { id: req.params.id } });
});

module.exports = {
  me,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
};
