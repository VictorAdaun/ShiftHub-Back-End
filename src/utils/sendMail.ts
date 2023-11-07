import * as pug from "pug";
import nodemailer from "nodemailer";
import config from "../config";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
export async function sendEmail(mailContext: any) {
  const html = pug.renderFile(
    process.cwd() + "/src/utils/" + mailContext.type + ".pug",
    mailContext.data
  );

  const subject = "Welcome to EZScheduler";
  complete(html, mailContext.data.email, subject);
}

export async function sendWelcomeEmail(mailContext: any) {
  const html = pug.renderFile(
    process.cwd() + "/src/utils/welcome.pug",
    mailContext.data
  );

  const subject = "Welcome to EZScheduler";
  complete(html, mailContext.data.email, subject);
}

export async function changePasswordEmail(mailContext: any) {
  const html = pug.renderFile(
    process.cwd() + "/src/utils/resetPassword.pug",
    mailContext.data
  );

  const subject = "Reset password";
  complete(html, mailContext.data.email, subject);
}

export async function complete(html: any, email: string, subject: string) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: config("NODEMAILER_USER"),
        pass: config("NODEMAILER_PASS"),
      },
    });

    const options = {
      from: '"EZSchedule" <ezscheduler@example.com>',
      to: email,
      subject,
      html,
    };

    const response = await transporter.sendMail(options);
    console.log(response);
  } catch (error) {
    console.log(error);
  }
}
