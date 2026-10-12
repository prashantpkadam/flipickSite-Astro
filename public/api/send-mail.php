<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

use PHPMailer\PHPMailer\Exception as MailException;

// Recipients of contact-form enquiries come from api/.env (RECIPIENTS_CONTACT,
// comma-separated), which the deploy writes from the GitHub secret of the same name.

// Must match the options in the /company contact form.
const TOPICS = [
    'Booking a demo',
    'Sales & pricing',
    'Support',
    'Partnerships',
    'Careers',
    'Something else',
];

require_post();

try {
    $data = read_json_body();

    $name    = clean($data['name']    ?? '', 100);
    $email   = clean($data['email']   ?? '', 254);
    $company = clean($data['company'] ?? '', 150);
    $topic   = clean($data['topic']   ?? '', 60);
    $message = clean($data['message'] ?? '', 5000);

    if ($name === '')    throw new InvalidArgumentException('Name is required.');
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL))
                         throw new InvalidArgumentException('A valid email is required.');
    if ($company === '') throw new InvalidArgumentException('Company is required.');
    if (!in_array($topic, TOPICS, true))
                         throw new InvalidArgumentException('Please select a topic.');
    if ($message === '') throw new InvalidArgumentException('Message is required.');

    $dateTime = (new DateTime('now', new DateTimeZone('Asia/Kolkata')))->format('d M Y, h:i A') . ' IST';

    // Strip line breaks from anything that goes into a header.
    $headerSafe = fn (string $s): string => trim(preg_replace('/[\r\n]+/', ' ', $s));

    $mail = make_mailer();
    foreach (recipients_for(env_list('RECIPIENTS_CONTACT')) as $addr) {
        $mail->addAddress($addr);
    }
    $mail->addReplyTo($email, $headerSafe($name));
    $mail->Subject = 'New Enquiry: ' . $headerSafe($topic) . ' - ' . $headerSafe($name);
    $mail->isHTML(true);
    $mail->Body    = build_contact_template($name, $email, $company, $topic, $message, $dateTime);
    $mail->AltBody = "New enquiry\nName: $name\nEmail: $email\nCompany: $company\nTopic: $topic\n\n$message\n\n$dateTime";
    $mail->send();

    json_response(200, ['success' => true]);

} catch (InvalidArgumentException $e) {
    json_response(400, ['success' => false, 'message' => $e->getMessage()]);
} catch (MailException $e) {
    error_log('[send-mail] mail error: ' . $e->getMessage());
    json_response(500, ['success' => false, 'message' => 'Mail could not be sent. Please try again.']);
} catch (Throwable $e) {
    error_log('[send-mail] ' . $e->getMessage());
    json_response(500, ['success' => false, 'message' => 'Server error. Please try again.']);
}

// ── HTML email ────────────────────────────────────────────────────────────────
function contact_row(string $label, string $htmlValue): string
{
    return '<tr><td style="padding:14px 0;border-bottom:1px solid #EBEBF0;">'
         . '<p style="margin:0 0 5px;font-size:11px;font-weight:700;letter-spacing:.08em;'
         . 'text-transform:uppercase;color:#9999BB;">' . $label . '</p>'
         . '<p style="margin:0;font-size:14px;color:#1A1A2E;">' . $htmlValue . '</p>'
         . '</td></tr>';
}

function build_contact_template(string $name, string $email, string $company, string $topic, string $message, string $dateTime): string
{
    return '<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>New Enquiry — Flipick</title></head>
<body style="margin:0;padding:0;background:#F4F5F9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:40px 16px;">
  <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
    <tr><td style="background:#11122B;padding:28px 40px;">
      <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7B7FBB;">Flipick</p>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">New Contact Form Submission</h1>
    </td></tr>
    <tr><td style="background:#F0F1FF;padding:14px 40px;">
      <span style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#444CEC;background:#DDE0FF;padding:5px 12px;border-radius:999px;">' . h($topic) . '</span>
    </td></tr>
    <tr><td style="padding:32px 40px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">'
        . contact_row('Name', h($name))
        . contact_row('Email', '<a href="mailto:' . h($email) . '" style="color:#444CEC;text-decoration:none;">' . h($email) . '</a>')
        . contact_row('Company', h($company))
        . contact_row('Topic', h($topic))
        . '<tr><td style="padding:14px 0;border-bottom:1px solid #EBEBF0;">
             <p style="margin:0 0 5px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9999BB;">Message</p>
             <p style="margin:0;font-size:14px;color:#1A1A2E;line-height:1.65;white-space:pre-wrap;">' . h($message) . '</p>
           </td></tr>'
        . contact_row('Date &amp; Time', h($dateTime)) . '
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="background:#F0F1FF;border-left:4px solid #444CEC;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#444CEC;"><strong>Reply-To</strong> is set to <a href="mailto:' . h($email) . '" style="color:#444CEC;">' . h($email) . '</a> — just hit <strong>Reply</strong> to respond to ' . h($name) . ' directly.</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#F4F5F9;padding:18px 40px;border-top:1px solid #E8E9F0;">
      <p style="margin:0;font-size:11px;color:#AAAACC;text-align:center;">Sent via the contact form on <a href="https://flipick.com" style="color:#AAAACC;">flipick.com</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>';
}