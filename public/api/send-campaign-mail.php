<?php
declare(strict_types=1);

require __DIR__ . '/lib/bootstrap.php';

use PHPMailer\PHPMailer\Exception as MailException;

// ── Route map ─────────────────────────────────────────────────────────────────
// Key         form_id sent by the page's script.
// campaign    label shown in the email subject and badge.
// page        source page slug shown in the email.
// recipients  NAME of the api/.env setting that holds this form's recipients, as a
//             comma-separated list. The addresses themselves live in GitHub secrets,
//             never in the code.
// work_email  true = personal addresses (gmail, yahoo...) are rejected.
// A form_id not listed here is rejected, so leads can never be mis-routed.
// To add a campaign form: add one entry here, plus a RECIPIENTS_... secret.
const ROUTES = [
    'shopify-usa-lead' => [
        'campaign'   => 'Shopify USA',
        'page'       => 'shopify-usa',
        'recipients' => 'RECIPIENTS_SHOPIFY_USA_LEAD',
        'work_email' => true,
    ],
    'vvp-us-retail-lead' => [
        'campaign'   => 'VVP US Retail',
        'page'       => 'vvp-us-retail',
        'recipients' => 'RECIPIENTS_VVP_US_RETAIL_LEAD',
        'work_email' => true,
    ],
    'dealership-lead' => [
        'campaign'   => 'US Dealerships',
        'page'       => 'dealership',
        'recipients' => 'RECIPIENTS_DEALERSHIP_LEAD',
        'work_email' => true,
    ],
];

const MAX_FIELDS = 15;

/** Blocked personal-email domains, from the same JSON the browser uses. */
function blocked_domains(): array
{
    $path = __DIR__ . '/blocked-email-domains.json';
    $json = is_readable($path) ? file_get_contents($path) : false;
    $list = $json !== false ? json_decode($json, true) : null;
    if (!is_array($list)) {
        throw new RuntimeException('blocked-email-domains.json is missing or invalid');
    }
    return array_map('strtolower', $list);
}

require_post();

try {
    $data = read_json_body();

    $formId = clean($data['form_id'] ?? '', 80);
    if (!isset(ROUTES[$formId])) {
        throw new InvalidArgumentException('Unknown form.');
    }
    $route = ROUTES[$formId];

    $name  = clean($data['name']  ?? '', 100);
    $email = clean($data['email'] ?? '', 254);

    if ($name === '') {
        throw new InvalidArgumentException('Name is required.');
    }
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('A valid email is required.');
    }
    if ($route['work_email']) {
        $domain = strtolower((string) substr((string) strrchr($email, '@'), 1));
        if (in_array($domain, blocked_domains(), true)) {
            throw new InvalidArgumentException(
                'Please enter your work email address. Personal email addresses such as Gmail or Yahoo are not accepted.'
            );
        }
    }

    // Generic label/value pairs from the page.
    $rawFields = $data['fields'] ?? null;
    if (!is_array($rawFields) || $rawFields === [] || count($rawFields) > MAX_FIELDS) {
        throw new InvalidArgumentException('Please complete all required fields.');
    }
    $fields = [];
    foreach ($rawFields as $field) {
        if (!is_array($field)) {
            throw new InvalidArgumentException('Please complete all required fields.');
        }
        $label = clean($field['label'] ?? '', 60);
        $value = clean($field['value'] ?? '', 1000);
        if ($label === '') {
            continue;
        }
        if ($value === '') {
            throw new InvalidArgumentException($label . ' is required.');
        }
        $fields[] = ['label' => $label, 'value' => $value];
    }
    if ($fields === []) {
        throw new InvalidArgumentException('Please complete all required fields.');
    }

    $dateTime = (new DateTime('now', new DateTimeZone('Asia/Kolkata')))->format('d M Y, h:i A') . ' IST';
    $headerSafe = fn (string $s): string => trim(preg_replace('/[\r\n]+/', ' ', $s));

    $mail = make_mailer();
    foreach (recipients_for(env_list($route['recipients'])) as $addr) {
        $mail->addAddress($addr);
    }
    $mail->addReplyTo($email, $headerSafe($name));
    $mail->Subject = 'New Lead: ' . $route['campaign'] . ' - ' . $headerSafe($name);
    $mail->isHTML(true);
    $mail->Body    = build_campaign_template($formId, $route['page'], $route['campaign'], $name, $email, $fields, $dateTime);
    $mail->AltBody = campaign_plain_text($formId, $route['campaign'], $name, $email, $fields, $dateTime);
    $mail->send();

    json_response(200, ['success' => true]);

} catch (InvalidArgumentException $e) {
    json_response(400, ['success' => false, 'message' => $e->getMessage()]);
} catch (MailException $e) {
    error_log('[send-campaign-mail] mail error: ' . $e->getMessage());
    json_response(500, ['success' => false, 'message' => 'Mail could not be sent. Please try again.']);
} catch (Throwable $e) {
    error_log('[send-campaign-mail] ' . $e->getMessage());
    json_response(500, ['success' => false, 'message' => 'Server error. Please try again.']);
}

// ── Email ─────────────────────────────────────────────────────────────────────
function campaign_row(string $label, string $htmlValue): string
{
    return '<tr><td style="padding:14px 0;border-bottom:1px solid #EBEBF0;">'
         . '<p style="margin:0 0 5px;font-size:11px;font-weight:700;letter-spacing:.08em;'
         . 'text-transform:uppercase;color:#9999BB;">' . $label . '</p>'
         . '<p style="margin:0;font-size:14px;color:#1A1A2E;">' . $htmlValue . '</p>'
         . '</td></tr>';
}

function campaign_plain_text(string $formId, string $campaign, string $name, string $email, array $fields, string $dateTime): string
{
    $lines = ["New lead: $campaign", "Form: $formId", "Name: $name", "Email: $email"];
    foreach ($fields as $f) {
        $lines[] = $f['label'] . ': ' . $f['value'];
    }
    $lines[] = $dateTime;
    return implode("\n", $lines);
}

function build_campaign_template(string $formId, string $page, string $campaign, string $name, string $email, array $fields, string $dateTime): string
{
    // Source metadata first, then the visitor's details, then every field generically.
    $fieldRows = '';
    foreach ($fields as $f) {
        $fieldRows .= campaign_row(h($f['label']), h($f['value']));
    }

    return '<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>New Lead - Flipick</title></head>
<body style="margin:0;padding:0;background:#F4F5F9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center" style="padding:40px 16px;">
  <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
    <tr><td style="background:#11122B;padding:28px 40px;">
      <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7B7FBB;">Flipick</p>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">New Campaign Lead</h1>
    </td></tr>
    <tr><td style="background:#F0F1FF;padding:14px 40px;">
      <span style="display:inline-block;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#444CEC;background:#DDE0FF;padding:5px 12px;border-radius:999px;">' . h($campaign) . '</span>
    </td></tr>
    <tr><td style="padding:32px 40px 8px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">'
        . campaign_row('Form', h($formId))
        . campaign_row('Page', h($page))
        . campaign_row('Campaign', h($campaign))
        . '<tr><td style="padding:6px 0;"><hr style="border:none;border-top:2px solid #F0F1FF;margin:0;"></td></tr>'
        . campaign_row('Name', h($name))
        . campaign_row('Email', '<a href="mailto:' . h($email) . '" style="color:#444CEC;text-decoration:none;">' . h($email) . '</a>')
        . $fieldRows
        . campaign_row('Date &amp; Time', h($dateTime)) . '
      </table>
    </td></tr>
    <tr><td style="padding:24px 40px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td style="background:#F0F1FF;border-left:4px solid #444CEC;border-radius:0 8px 8px 0;padding:14px 18px;">
          <p style="margin:0;font-size:13px;color:#444CEC;"><strong>Reply-To</strong> is set to <a href="mailto:' . h($email) . '" style="color:#444CEC;">' . h($email) . '</a> - just hit <strong>Reply</strong> to respond to ' . h($name) . ' directly.</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#F4F5F9;padding:18px 40px;border-top:1px solid #E8E9F0;">
      <p style="margin:0;font-size:11px;color:#AAAACC;text-align:center;">Sent via a campaign form on <a href="https://flipick.com" style="color:#AAAACC;">flipick.com</a></p>
    </td></tr>
  </table>
</td></tr></table>
</body></html>';
}