import * as pug from "pug";
import nodemailer from "nodemailer";
import config from "../config";
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
    // const OAuth2 = google.auth.OAuth2
    // const OAuth2Client = new OAuth2(
    //   config('GOOGLE_CLIENT_ID'),
    //   config('GOOGLE_CLIENT_SECRET'),
    //   config('REDIRECT_URI')
    // )
    // console.log(config('REFRESH_TOKEN'))
    // OAuth2Client.setCredentials({ refresh_token: config('REFRESH_TOKEN') })
    // const ACCESS_TOKEN: string = await new Promise((resolve, reject) => {
    //   OAuth2Client.getAccessToken((err, token) => {
    //     if (err) {
    //       console.log({ err })
    //       reject('Failed to create access token')
    //     }
    //     resolve(token as string)
    //   })
    // })
    // const configuration: Options = {
    //   service: 'gmail',
    //   auth: {
    //     type: 'OAuth2',
    //     user: config('NODEMAILER_USER'),
    //     clientId: config('GOOGLE_CLIENT_ID'),
    //     clientSecret: config('GOOGLE_CLIENT_SECRET'),
    //     refreshToken: config('REFRESH_TOKEN'),
    //     accessToken: ACCESS_TOKEN,
    //   },
    //   port: 25,
    //   secure: false,
    //   tls: {
    //     rejectUnauthorized: true,
    //   },
    // }
    // const transporter = nodemailer.createTransport(configuration)

    const transporter = nodemailer.createTransport({
      host: config("NODEMAILER_ACCOUNT"),
      port: 465,
      secure: true,
      auth: {
        // TODO: replace `user` and `pass` values from <https://forwardemail.net>
        user: config("NODEMAILER_USER"),
        pass: config("NODEMAILER_PASS"),
      },
    });
    const mailOptions = {
      from: config("NODEMAILER_ACCOUNT"),
      to: email,
      subject,
      html,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return console.log(error);
      }
      console.log("Message sent: %s", info.messageId);
    });
  } catch (error) {
    console.log(error);
  }
}
