<?php
declare(strict_types=1);
// Never print PHP warnings to the visitor (they can reveal file paths).
ini_set('display_errors', '0');

// Shared setup for every endpoint in /api: env loading, JSON responses, mailer.

use PHPMailer\PHPMailer\PHPMailer;

require __DIR__ . '/../PHPMailer/src/Exception.php';
require __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../PHPMailer/src/SMTP.php';

/**
 * Load KEY=VALUE pairs from api/.env into an array.
 * The file is written by the deploy pipeline and is never committed.
 */
function load_env(): array
{
    static $env = null;
    if ($env !== null) {
        return $env;
    }
    $env = [];
    $path = __DIR__ . '/../.env';
    if (!is_readable($path)) {
        return $env;
    }
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $env[trim($key)] = trim($value, " \t\"'");
    }
    return $env;
}

function env(string $key, ?string $default = null): ?string
{
    $env = load_env();
    return $env[$key] ?? $default;
}

/** Send a JSON response and stop. */
function json_response(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store');
    echo json_encode($body);
    exit;
}

/** Only POST is accepted. Same-origin only, so no CORS headers on purpose. */
function require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        header('Allow: POST');
        json_response(405, ['success' => false, 'message' => 'Method not allowed']);
    }
}

/** Parse the JSON body, with a size limit. */
function read_json_body(int $maxBytes = 20000): array
{
    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($raw === false || $raw === '' || strlen($raw) > $maxBytes) {
        throw new InvalidArgumentException('Invalid request.');
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new InvalidArgumentException('Invalid request.');
    }
    return $data;
}

/** Trimmed string with a maximum length. */
function clean(mixed $value, int $max): string
{
    $value = is_string($value) ? trim($value) : '';
    return mb_substr($value, 0, $max);
}

function h(?string $s): string
{
    return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8');
}

/** A PHPMailer instance configured from .env. */
function make_mailer(): PHPMailer
{
    foreach (['SMTP_HOST', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 'SMTP_FROM'] as $required) {
        if (env($required) === null || env($required) === '') {
            throw new RuntimeException("Missing $required in api/.env");
        }
    }
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = (string) env('SMTP_HOST');
    $mail->SMTPAuth   = true;
    $mail->Username   = (string) env('SMTP_USERNAME');
    $mail->Password   = (string) env('SMTP_PASSWORD');
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = (int) env('SMTP_PORT');
    $mail->CharSet    = 'UTF-8';
    $mail->setFrom((string) env('SMTP_FROM'), (string) env('SMTP_FROM_NAME', 'Flipick'));
    return $mail;
}

/**
 * A comma-separated list of email addresses from api/.env, e.g.
 * RECIPIENTS_CONTACT=a@example.com,b@example.com. Invalid entries are skipped.
 * Recipient addresses live in GitHub secrets, not in the code.
 */
function env_list(string $key): array
{
    $list = [];
    foreach (explode(',', env($key) ?? '') as $addr) {
        $addr = trim($addr);
        if ($addr !== '' && filter_var($addr, FILTER_VALIDATE_EMAIL)) {
            $list[] = $addr;
        }
    }
    return $list;
}

/**
 * The final list of recipients. Staging safety: if MAIL_OVERRIDE_TO is set in
 * api/.env, every email goes to that one address instead of the real recipients.
 * Throws if nobody would receive the mail, so a lead is never silently lost.
 */
function recipients_for(array $recipients): array
{
    $override = env('MAIL_OVERRIDE_TO');
    $final = ($override !== null && $override !== '') ? [$override] : $recipients;
    if ($final === []) {
        throw new RuntimeException('No mail recipients are configured in api/.env');
    }
    return $final;
}