# Gmail App Password Setup Guide

## Why You Need an App Password

Gmail requires an **App Password** (not your regular password) for third-party applications like your backend to send emails. This is a security feature.

## Step-by-Step Instructions

### Step 1: Enable 2-Step Verification

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** (left sidebar)
3. Under "Signing in to Google", find **2-Step Verification**
4. Click **Get Started** and follow the prompts to enable 2-Step Verification
   - You'll need to verify your phone number
   - You'll receive a verification code via SMS

### Step 2: Generate App Password

1. Go back to **Security** page: https://myaccount.google.com/security
2. Under "Signing in to Google", find **2-Step Verification**
3. Scroll down and click on **App passwords**
   - If you don't see "App passwords", make sure 2-Step Verification is enabled first
4. You may be asked to sign in again
5. Select **Mail** as the app type
6. Select **Other (Custom name)** as the device
7. Enter a name like "Musshk Backend" or "Node.js App"
8. Click **Generate**
9. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
   - ⚠️ **Important**: You can only see this password once! Copy it immediately.

### Step 3: Add to Your .env File

Add these to your `.env` file in the backend directory:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=Musshk <your-email@gmail.com>
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `abcd efgh ijkl mnop` with the 16-character App Password you just generated
- Remove spaces from the App Password (or keep them, both work)
- The `SMTP_FROM` should match your Gmail address

### Example .env Entry:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=musshk09@gmail.com
SMTP_PASS=abcdefghijklmnop
SMTP_FROM=Musshk <musshk09@gmail.com>
```

## Quick Reference

**App Password Location:**
- Direct link: https://myaccount.google.com/apppasswords
- Or: Google Account → Security → 2-Step Verification → App passwords

**App Password Format:**
- 16 characters
- May have spaces (you can remove them)
- Example: `abcd efgh ijkl mnop` or `abcdefghijklmnop`

## Troubleshooting

### Error: "Username and Password not accepted"

**Possible causes:**
1. ❌ Using your regular Gmail password instead of App Password
   - ✅ **Fix**: Generate and use an App Password

2. ❌ 2-Step Verification not enabled
   - ✅ **Fix**: Enable 2-Step Verification first

3. ❌ App Password copied incorrectly
   - ✅ **Fix**: Copy the 16-character password exactly (spaces don't matter)

4. ❌ Wrong email address
   - ✅ **Fix**: Make sure `SMTP_USER` matches the Gmail account you generated the App Password for

### Error: "Less secure app access"

**Note:** Google no longer supports "Less secure app access". You **must** use App Passwords with 2-Step Verification enabled.

### Still Not Working?

1. **Verify your .env file:**
   ```bash
   # Check if variables are loaded
   node -e "require('dotenv').config(); console.log(process.env.SMTP_USER)"
   ```

2. **Test email configuration:**
   ```javascript
   // Create a test file: test-email.js
   const nodemailer = require('nodemailer');
   require('dotenv').config();

   const transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     secure: false,
     auth: {
       user: process.env.SMTP_USER,
       pass: process.env.SMTP_PASS,
     },
   });

   transporter.verify((error, success) => {
     if (error) {
       console.error('Email config error:', error);
     } else {
       console.log('✅ Email server is ready!');
     }
   });
   ```

3. **Run the test:**
   ```bash
   node test-email.js
   ```

## Alternative Email Services

If Gmail doesn't work for you, consider these alternatives:

### SendGrid (Recommended for Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-access-key
SMTP_PASS=your-aws-secret-key
```

## Security Best Practices

1. ✅ **Never commit .env file to git**
2. ✅ **Use App Passwords, not regular passwords**
3. ✅ **Rotate App Passwords regularly**
4. ✅ **Use environment variables, not hardcoded credentials**
5. ✅ **For production, use professional email services (SendGrid, Mailgun, AWS SES)**

## Need Help?

If you're still having issues:
1. Check the error message in your terminal
2. Verify all environment variables are set correctly
3. Make sure you restarted your server after updating .env
4. Test with the test-email.js script above
