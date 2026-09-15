import express from "express";

import {
  getCloudinarySignature,
} from "../controllers/upload.controller.js";

import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/cloudinary-signature",
  protect,
  getCloudinarySignature
);

export default router;