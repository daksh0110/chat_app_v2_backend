import { Request, Response } from "express";
import { SupportTicketModel } from "../models/support_ticket.model";
import { emailService } from "../services/email.service";

export const createSupportTicket = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "name, email, subject, and message are all required",
      });
    }

    const userId = (req as any).user?.userId || (req as any).user?.id || undefined;

    const ticket = await SupportTicketModel.create({
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      user_id: userId,
      status: "OPEN",
    });

    // Send email notification to admin asynchronously
    emailService
      .sendSupportEmail({
        name: ticket.name,
        email: ticket.email,
        subject: ticket.subject,
        message: ticket.message,
      })
      .catch((err) => {
        console.error("Failed to trigger support email:", err);
      });

    return res.status(201).json({
      success: true,
      message: "Support query submitted successfully",
      data: ticket,
    });
  } catch (error: any) {
    console.error("Create support ticket error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit support query",
    });
  }
};

export const getSupportTickets = async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;

    const filter: any = {};
    if (status && typeof status === "string") {
      filter.status = status.toUpperCase();
    }

    const pageSize = Math.min(Number(limit) || 50, 100);
    const skip = ((Number(page) || 1) - 1) * pageSize;

    const [tickets, total] = await Promise.all([
      SupportTicketModel.find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      SupportTicketModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page) || 1,
      pageSize,
      data: tickets,
    });
  } catch (error: any) {
    console.error("Get support tickets error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch support queries",
    });
  }
};

