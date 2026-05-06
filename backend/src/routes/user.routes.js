import express from "express";
import { getAllUsers, updateUserRole, updateUserStatus } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/", getAllUsers);
router.put("/:userId/role", updateUserRole);
router.put("/:userId/status", updateUserStatus);

export default router;
