import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'itso.itdesk.ph@gmail.com',
    pass: 'ivkh czre etqp zbop',
  },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: '"ITSO IT Desk" <itso.itdesk.ph@gmail.com>',
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendTicketCreatedToStaff = async (ticket, studentName, studentEmail) => {
  const staffEmails = await getStaffEmails();
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
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Category</td>
            <td style="padding: 10px 0; font-size: 14px; text-transform: capitalize;">${ticket.category}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Priority</td>
            <td style="padding: 10px 0; font-size: 14px; text-transform: capitalize;">${ticket.priority}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #6b7280; font-size: 13px;">Description</td>
            <td style="padding: 10px 0; font-size: 14px;">${ticket.description}</td>
          </tr>
        </table>
        <div style="margin-top: 24px; text-align: center;">
          <a href="http://localhost:5173/admin/tickets/${ticket._id}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View Ticket</a>
        </div>
      </div>
      <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">ITSO IT Desk Support System</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: staffEmails.join(', '),
    subject: `[New Ticket] ${ticket.title} - ${ticket.priority.toUpperCase()}`,
    html,
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
          <a href="http://localhost:5173/tickets/${ticket._id}" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">View Ticket</a>
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

import User from '../models/User.js';

const getStaffEmails = async () => {
  try {
    const staffUsers = await User.find({ role: { $in: ['admin', 'staff'] } }).select('email');
    return staffUsers.map((user) => user.email);
  } catch (error) {
    console.error('Error fetching staff emails:', error);
    return [];
  }
};