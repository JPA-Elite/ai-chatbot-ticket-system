import nodemailer from 'nodemailer';
import { WEB_APP_BASE_URL } from '../config/api.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html, meta = {} }) => {
  try {
    const toList = Array.isArray(to)
      ? to.filter(Boolean)
      : String(to || "")
          .split(",")
          .map(s => s.trim())
          .filter(Boolean);

    console.log("======================================");
    console.log("📨 EMAIL SEND START");
    console.log("📌 Subject:", subject);
    console.log("📩 To:", toList.length ? toList.join(", ") : "N/A");

    if (meta.ticketId) console.log("🆔 Ticket ID:", String(meta.ticketId));
    if (meta.studentName) console.log("👨‍🎓 Student:", meta.studentName);
    if (meta.studentEmail) console.log("📧 Student Email:", meta.studentEmail);

    console.log("======================================");

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: toList.join(", "),
      subject,
      html,
    });

    console.log("✅ EMAIL SENT");
    console.log("📬 Message ID:", info.messageId);
    console.log("📤 Final TO:", toList.join(", "));
    console.log("======================================");

    return info;
  } catch (error) {
    console.error("❌ EMAIL SEND ERROR");
    console.error("Message:", error.message);
    throw error;
  }
};

export const sendTicketCreatedToStaff = async (ticket, studentName, studentEmail, staffEmailsOverride = []) => {
  const staffEmails = Array.isArray(staffEmailsOverride) && staffEmailsOverride.length
    ? staffEmailsOverride
    : await getStaffEmails();

  if (staffEmails.length === 0) {
    console.log('No staff emails found');
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #3b82f6; color: white; padding: 24px;">
        <h2 style="margin: 0; font-size: 20px;">New Support Ticket Created</h2>
        <p style="margin: 4px 0 0; opacity: 0.85; font-size: 14px;">A student has requested support</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px; width: 120px;">Student</td>
            <td style="padding: 10px 0; font-size: 14px;">${studentName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Email</td>
            <td style="padding: 10px 0; font-size: 14px;">${studentEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Title</td>
            <td style="padding: 10px 0; font-size: 14px;">${ticket.title}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Description</td>
            <td style="padding: 10px 0; font-size: 14px;">${ticket.description}</td>
          </tr>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${WEB_APP_BASE_URL}/admin/tickets/${ticket._id}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View Ticket</a>
        </div>
      </div>
      <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">ITSO IT Desk Support System</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: staffEmails,
    subject: `[New Ticket] ${ticket.title}`,
    html,
    meta: {
      ticketId: ticket._id,
      studentName,
      studentEmail
    }
  });
};

export const sendTicketAcceptedToStudent = async (ticket, studentName, studentEmail, staffName) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #10b981; color: white; padding: 24px;">
        <h2 style="margin: 0; font-size: 20px;">Your Ticket Has Been Accepted</h2>
        <p style="margin: 4px 0 0; opacity: 0.85; font-size: 14px;">A staff member is ready to help you</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px; width: 120px;">Your Name</td>
            <td style="padding: 10px 0; font-size: 14px;">${studentName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Ticket Title</td>
            <td style="padding: 10px 0; font-size: 14px;">${ticket.title}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Accepted By</td>
            <td style="padding: 10px 0; font-size: 14px;">${staffName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Status</td>
            <td style="padding: 10px 0; font-size: 14px; color: #10b981; font-weight: 600;">Accepted</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 14px; color: #4b5563;">You can now communicate with the staff member through the ticket. Please check your ticket for updates.</p>
        <div style="margin-top: 20px; text-align: center;">
          <a href="${WEB_APP_BASE_URL}/tickets/${ticket._id}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View Ticket</a>
        </div>
      </div>
      <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">ITSO IT Desk Support System</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: studentEmail,
    subject: `[Ticket Update] Your ticket "${ticket.title}" has been accepted`,
    html,
  });
};

import { findStaffByFilter } from '../repositories/staffRepository.js';

const getStaffEmails = async () => {
  try {
    const staffUsers = await findStaffByFilter(
      { role: { $in: ['admin', 'staff'] } },
      { select: 'email' }
    );
    return staffUsers.map((user) => user.email);
  } catch (error) {
    console.error('Error fetching staff emails:', error);
    return [];
  }
};

export const sendTicketRejectedToStudent = async (ticket, studentName, studentEmail, staffName, reason) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #ef4444; color: white; padding: 24px;">
        <h2 style="margin: 0; font-size: 20px;">Your Ticket Has Been Rejected</h2>
        <p style="margin: 4px 0 0; opacity: 0.85; font-size: 14px;">A staff member has reviewed your request</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px; width: 120px;">Your Name</td>
            <td style="padding: 10px 0; font-size: 14px;">${studentName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Ticket Title</td>
            <td style="padding: 10px 0; font-size: 14px;">${ticket.title}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Rejected By</td>
            <td style="padding: 10px 0; font-size: 14px;">${staffName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Reason</td>
            <td style="padding: 10px 0; font-size: 14px;">${reason || 'No reason provided'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Status</td>
            <td style="padding: 10px 0; font-size: 14px; color: #ef4444; font-weight: 600;">Rejected</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 14px; color: #4b5563;">If you have questions about this rejection, please create a new ticket or contact support directly.</p>
        <div style="margin-top: 20px; text-align: center;">
          <a href="${WEB_APP_BASE_URL}/tickets/${ticket._id}" style="display: inline-block; background-color: #ef4444; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View Ticket</a>
        </div>
      </div>
      <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">ITSO IT Desk Support System</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: studentEmail,
    subject: `[Ticket Update] Your ticket "${ticket.title}" has been rejected`,
    html,
    meta: {
      ticketId: ticket._id,
      studentName,
      studentEmail
    }
  });
};

export const sendTicketForwardedToStaff = async (ticket, staffName, staffEmail) => {
  const studentName = ticket.userId?.name || 'Unknown Student';
  const studentEmail = ticket.userId?.email || 'N/A';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f59e0b; color: white; padding: 24px;">
        <h2 style="margin: 0; font-size: 20px;">Ticket Forwarded to You</h2>
        <p style="margin: 4px 0 0; opacity: 0.85; font-size: 14px;">A ticket has been forwarded for your attention</p>
      </div>
      <div style="padding: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px; width: 120px;">Student</td>
            <td style="padding: 10px 0; font-size: 14px;">${studentName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Email</td>
            <td style="padding: 10px 0; font-size: 14px;">${studentEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Title</td>
            <td style="padding: 10px 0; font-size: 14px;">${ticket.title}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Description</td>
            <td style="padding: 10px 0; font-size: 14px;">${ticket.description}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 14px; color: #4b5563;">This ticket has been assigned to you. Please review and provide assistance to the student.</p>
        <div style="margin-top: 24px; text-align: center;">
          <a href="${WEB_APP_BASE_URL}/admin/tickets/${ticket._id}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View Ticket</a>
        </div>
      </div>
      <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">ITSO IT Desk Support System</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: staffEmail,
    subject: `[Forwarded Ticket] ${ticket.title}`,
    html,
    meta: {
      ticketId: ticket._id,
      staffName,
      studentName,
      studentEmail
    }
  });
};
