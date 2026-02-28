import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /files/:filename
 * Download a file from the uploads directory
 */
router.get("/:filename", authMiddleware, (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    // Validate filename format to prevent direct path traversal payloads
    if (!/^[a-zA-Z0-9.\-_]+$/.test(filename)) {
      return res.status(400).json({
        success: false,
        error: "Invalid filename",
      });
    }

    const uploadsDir = path.resolve(__dirname, "..", "uploads");
    const filePath = path.resolve(uploadsDir, filename);

    // Verify the resolved path strictly starts with the uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden path",
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    return res.sendFile(filePath);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
