<?php
/**
 * Contact form configuration
 * ---------------------------------------------------------------------------
 * 1. Make a copy of this file in the same folder and name it "config.php".
 * 2. In config.php, replace 'you@your-domain.example' with the email address
 *    that should receive messages from the website.
 * 3. Upload the website to a server with PHP 8.0+ and a working mail() setup.
 *
 * That is all that is required. The other options are optional.
 * No passwords or API keys are needed, so never put secrets in this file.
 */

return [
    // REQUIRED — the address that receives messages from the contact forms.
    'recipient_email' => 'you@your-domain.example',

    // Optional — name shown next to the recipient address.
    'recipient_name' => 'Aldervane Construction',

    // Sender address used in the "From" header. Use an address on YOUR website
    // domain (for example no-reply@yourdomain.com) so emails are less likely
    // to be marked as spam. Leave empty to use no-reply@<your domain> automatically.
    // The visitor's address is always added as "Reply-To".
    'from_email' => '',
    'from_name' => 'Website contact form',

    // Text added at the beginning of every email subject.
    'subject_prefix' => '[Website enquiry]',

    // Other web addresses allowed to send the form, if your site is available
    // on more than one domain, e.g. ['https://example.com', 'https://www.example.com'].
    // The domain the form is loaded from is always allowed automatically.
    'allowed_origins' => [],

    // Anti-spam: minimum seconds between starting to fill in the form and
    // sending it, and minimum seconds between two messages from one visitor.
    'min_submit_seconds' => 3,
    'rate_limit_seconds' => 60,

    // How long a form security token stays valid, in seconds (2 hours).
    'token_lifetime' => 7200,

    // Add the sender's IP address to the email. Mention this in your privacy policy.
    'include_ip_address' => false,

    // Pass the "From" address to the mail server with the -f option.
    // Some hosting providers require this; leave false if unsure.
    'use_envelope_sender' => false,

    // Time zone used for the date in the email, e.g. 'Europe/London' or
    // 'America/New_York'. Leave empty to use the server setting.
    'timezone' => '',

    // Test mode: the form behaves normally but NO email is sent.
    // Handy on your own computer. Never enable it on a live website.
    'test_mode' => false,

    // Link shown on the confirmation page for visitors without JavaScript.
    'return_url' => '../contact.html',
];
