import nodemailer from 'nodemailer';
import { createError } from '../middleware/errorHandler';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service configuration error:', error);
      } else {
        console.log('Email service is ready to send messages');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"${process.env.FROM_NAME || 'VPS Seller Portal'}" <${process.env.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw createError('Failed to send email', 500);
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">VPS Seller Portal</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Welcome to our platform!</p>
        </div>

        <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>

          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            Thank you for registering with VPS Seller Portal! To complete your registration and activate your account,
            please click the button below to verify your email address.
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white; padding: 15px 30px; text-decoration: none;
                      border-radius: 50px; font-weight: bold; display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Verify Email Address
            </a>
          </div>

          <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #667eea;">${verificationUrl}</span>
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">

          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            This link will expire in 24 hours. If you didn't create an account with VPS Seller Portal,
            you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - VPS Seller Portal',
      html,
      text: `Please verify your email address by visiting: ${verificationUrl}`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">VPS Seller Portal</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset Request</p>
        </div>

        <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>

          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            We received a request to reset the password for your account. Click the button below
            to set a new password. This link is valid for 1 hour.
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white; padding: 15px 30px; text-decoration: none;
                      border-radius: 50px; font-weight: bold; display: inline-block;
                      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
              Reset Password
            </a>
          </div>

          <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Or copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #667eea;">${resetUrl}</span>
          </p>

          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">

          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            If you didn't request a password reset, you can safely ignore this email.
            Your password will remain unchanged.
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password - VPS Seller Portal',
      html,
      text: `Reset your password by visiting: ${resetUrl}`,
    });
  }

  async sendOrderConfirmationEmail(email: string, orderDetails: any): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">VPS Seller Portal</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Order Confirmation</p>
        </div>

        <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Thank You for Your Order!</h2>

          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            Your VPS order has been received and is now being processed. You will receive another email
            once your VPS has been approved and provisioned.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #333; margin-top: 0;">Order Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Order ID:</td>
                <td style="padding: 8px 0; color: #333;">${orderDetails.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">CPU Cores:</td>
                <td style="padding: 8px 0; color: #333;">${orderDetails.cpuCores}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">RAM:</td>
                <td style="padding: 8px 0; color: #333;">${orderDetails.ramGb} GB</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Storage:</td>
                <td style="padding: 8px 0; color: #333;">${orderDetails.storageGb} GB</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Operating System:</td>
                <td style="padding: 8px 0; color: #333;">${orderDetails.operatingSystem}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Monthly Price:</td>
                <td style="padding: 8px 0; color: #333; font-weight: bold;">$${orderDetails.monthlyPrice}</td>
              </tr>
            </table>
          </div>

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
            <p style="color: #1976d2; margin: 0; font-size: 14px;">
              <strong>Next Steps:</strong> Your order is currently awaiting admin approval.
              You will receive an email once your VPS has been provisioned.
            </p>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Order Confirmation - VPS #${orderDetails.id}`,
      html,
    });
  }

  async sendVPSProvisionedEmail(email: string, vpsDetails: any): Promise<void> {
    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">VPS Seller Portal</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your VPS is Ready!</p>
        </div>

        <div style="background: #f9f9f9; padding: 40px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">VPS Provisioning Complete</h2>

          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
            Great news! Your VPS has been successfully provisioned and is now ready to use.
            Below are your access details:
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #333; margin-top: 0;">VPS Access Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">IP Address:</td>
                <td style="padding: 8px 0; color: #333; font-family: monospace;">${vpsDetails.ipAddress}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Username:</td>
                <td style="padding: 8px 0; color: #333;">root</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Password:</td>
                <td style="padding: 8px 0; color: #333; font-family: monospace;">${vpsDetails.rootPassword}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666; font-weight: bold;">Operating System:</td>
                <td style="padding: 8px 0; color: #333;">${vpsDetails.operatingSystem}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 30px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> Please change your root password immediately after first login and
              set up SSH key authentication for better security.
            </p>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard"
               style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
                      color: white; padding: 15px 30px; text-decoration: none;
                      border-radius: 50px; font-weight: bold; display: inline-block;">
              Manage Your VPS
            </a>
          </div>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Your VPS is Ready! - ${vpsDetails.ipAddress}`,
      html,
    });
  }
}

export const emailService = new EmailService();