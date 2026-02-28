import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const prisma = new PrismaClient();

const recordSchema = z.object({
  patientName: z.string().min(1),
  diagnosis: z.string().min(1),
  notes: z.string().optional(),
});

/**
 * GET /records
 * List all medical records
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const records = await prisma.record.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

/**
 * GET /records/search
 * Search records by patient name
 * Using raw query for case-insensitive search
 */
router.get("/search", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        error: "Search parameter 'name' is required and must be a string",
      });
    }

    // Fix SQL Injection by using Prisma ORM safe query
    const results = await prisma.record.findMany({
      where: {
        patientName: {
          contains: name,
          mode: "insensitive"
        }
      }
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

/**
 * GET /records/:id
 * Get a specific record by ID
 */
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const record = await prisma.record.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

/**
 * POST /records
 * Create a new medical record
 */
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validatedData = recordSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed"
      });
    }

    const { patientName, diagnosis, notes } = validatedData.data;

    const record = await prisma.record.create({
      data: {
        patientName,
        diagnosis,
        notes,
        createdById: req.user!.id,
      },
    });

    return res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
