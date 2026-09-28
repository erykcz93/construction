<?php
/**
 * Aldervane — contact form handler
 * ---------------------------------------------------------------------------
 * Receives messages from the contact forms (index.html and contact.html),
 * validates and sanitises them, and delivers them by email with PHP mail().
 * No external libraries are required.
 *
 * Security measures
 *   - Same-origin check using the Origin / Referer request headers
 *   - CSRF token stored in the PHP session (requested by form-validation.js)
 *   - Honeypot field and a minimum fill-in time against spam bots
 *   - Simple per-visitor rate limit
 *   - Strict validation, length limits and removal of control characters
 *   - Protection against email header injection: the only visitor value used
 *     in a header is a validated Reply-To address with an encoded name
 *
 * Setup
 *   1. Copy config.example.php to config.php (same folder).
 *   2. Enter your email address in 'recipient_email'.
 *   See documentation/index.html → "Contact Form Configuration".
 *
 * Requirements: PHP 8.0 or newer with a working mail() configuration.
 *
 * Endpoints
 *   GET  contact.php?action=token  → JSON { "token": "…" }
 *   POST contact.php               → JSON (fetch requests) or a simple HTML page
 */

declare(strict_types=1);

const SUCCESS_MESSAGE = 'Thank you! Your message has been sent. We will reply within one business day.';
const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please reload the page and send the form again.';
const SEND_FAILED_MESSAGE = 'Sorry, your message could not be sent right now. Please try again later or contact us by phone or email.';

// ---------------------------------------------------------------------------
// 1. Configuration
// ---------------------------------------------------------------------------
$config = default_config();
$configFile = __DIR__ . '/config.php';

if (!is_file($configFile)) {
    respond(500, false, 'The contact form is not configured yet. Copy php/config.example.php to php/config.php and add your email address.');
}

$userConfig = require $configFile;
$config = array_merge($config, is_array($userConfig) ? $userConfig : []);

// ---------------------------------------------------------------------------
// 2. Routing
// ---------------------------------------------------------------------------
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

if ($method === 'GET' && ($_GET['action'] ?? '') === 'token') {
    start_secure_session();
    respond_json(200, ['token' => get_or_create_token((int) $config['token_lifetime'])]);
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    respond(405, false, 'This address only accepts messages sent from the contact form.');
}

start_secure_session();

// ---------------------------------------------------------------------------
// 3. Request checks: origin, CSRF token, honeypot, timing, rate limit
// ---------------------------------------------------------------------------
if (!is_same_origin($config['allowed_origins'])) {
    respond(403, false, 'This request was blocked for security reasons. Please reload the page and try again.');
}

$sessionToken = (string) ($_SESSION['contact_token'] ?? '');
$tokenIssuedAt = (int) ($_SESSION['contact_token_time'] ?? 0);
$postedToken = is_string($_POST['csrf_token'] ?? null) ? $_POST['csrf_token'] : '';

if ($sessionToken === '' || $postedToken === '' || !hash_equals($sessionToken, $postedToken)) {
    respond(403, false, SESSION_EXPIRED_MESSAGE);
}

if (time() - $tokenIssuedAt > (int) $config['token_lifetime']) {
    unset($_SESSION['contact_token'], $_SESSION['contact_token_time']);
    respond(403, false, SESSION_EXPIRED_MESSAGE);
}

// Honeypot: real visitors never see this field. Pretend success so bots learn nothing.
if (clean_line($_POST['company_website'] ?? '') !== '') {
    respond(200, true, SUCCESS_MESSAGE);
}

if (time() - $tokenIssuedAt < (int) $config['min_submit_seconds']) {
    respond(429, false, 'That was quick! Please take a moment to check your message, then send it again.');
}

$lastSentAt = (int) ($_SESSION['contact_last_sent'] ?? 0);

if ($lastSentAt > 0 && time() - $lastSentAt < (int) $config['rate_limit_seconds']) {
    respond(429, false, 'You have just sent us a message. Please wait a minute before sending another one.');
}

// ---------------------------------------------------------------------------
// 4. Validation and sanitisation
// ---------------------------------------------------------------------------
$fields = [
    'name'        => clean_line($_POST['name'] ?? ''),
    'email'       => clean_line($_POST['email'] ?? ''),
    'phone'       => clean_line($_POST['phone'] ?? ''),
    'company'     => clean_line($_POST['company'] ?? ''),
    'service'     => clean_line($_POST['service'] ?? ''),
    'budget'      => clean_line($_POST['budget'] ?? ''),
    'message'     => clean_text($_POST['message'] ?? ''),
    'form_source' => clean_line($_POST['form_source'] ?? ''),
];
$consent = ($_POST['consent'] ?? '') === 'yes';

$maxLengths = [
    'name' => 100, 'email' => 254, 'phone' => 40, 'company' => 120,
    'service' => 100, 'budget' => 100, 'message' => 2000, 'form_source' => 50,
];

$errors = [];

foreach ($maxLengths as $field => $max) {
    if (text_length($fields[$field]) > $max) {
        $errors[$field] = 'This entry is too long.';
    }
}

if (!isset($errors['name']) && text_length($fields['name']) < 2) {
    $errors['name'] = 'Please enter your full name (at least 2 characters).';
}

if (!isset($errors['email']) && !is_valid_email($fields['email'])) {
    $errors['email'] = 'Please enter a valid email address.';
}

if (!isset($errors['phone']) && $fields['phone'] !== '' && preg_match('/^[0-9+().\-\s]{6,40}$/', $fields['phone']) !== 1) {
    $errors['phone'] = 'Please enter a valid phone number.';
}

if (!isset($errors['service']) && $fields['service'] === '') {
    $errors['service'] = 'Please choose a project type.';
}

if (!isset($errors['message']) && text_length($fields['message']) < 20) {
    $errors['message'] = 'Please describe your project in at least 20 characters.';
}

if (!$consent) {
    $errors['consent'] = 'Please confirm that we may use your details to reply to you.';
}

if ($errors !== []) {
    respond(422, false, 'Please correct the highlighted fields and try again.', ['errors' => $errors]);
}

// ---------------------------------------------------------------------------
// 5. Compose and send the email
// ---------------------------------------------------------------------------
$recipient = trim((string) $config['recipient_email']);

if (!is_valid_email($recipient) || (!$config['test_mode'] && is_placeholder_email($recipient))) {
    error_log('Contact form: set a valid recipient_email in php/config.php.');
    respond(500, false, SEND_FAILED_MESSAGE);
}

$fromEmail = trim((string) $config['from_email']);

if (!is_valid_email($fromEmail)) {
    $fromEmail = 'no-reply@' . site_domain();
}

if (!is_valid_email($fromEmail)) {
    $fromEmail = $recipient; // e.g. when the site is opened through an IP address
}

if ($config['timezone'] !== '' && in_array($config['timezone'], timezone_identifiers_list(), true)) {
    date_default_timezone_set($config['timezone']);
}

$subjectParts = [trim((string) $config['subject_prefix']), $fields['service'], '-', $fields['name']];
$subject = encode_header(trim(implode(' ', array_filter($subjectParts, 'strlen'))));

$headers = [
    'From'                      => format_address($fromEmail, (string) $config['from_name']),
    'Reply-To'                  => format_address($fields['email'], $fields['name']),
    'MIME-Version'              => '1.0',
    'Content-Type'              => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => 'quoted-printable',
];

$body = quoted_printable_encode(build_message_body($fields, (bool) $config['include_ip_address']));
$to = format_address($recipient, (string) $config['recipient_name']);

$envelope = '';

if ($config['use_envelope_sender'] && preg_match('/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+$/', $fromEmail) === 1) {
    $envelope = '-f' . $fromEmail;
}

if ($config['test_mode']) {
    error_log('Contact form (test mode): message from ' . $fields['email'] . ' accepted, no email sent.');
    $sent = true;
} else {
    $sent = mail($to, $subject, $body, $headers, $envelope);
}

if (!$sent) {
    error_log('Contact form: mail() returned false. Check the mail configuration of your server.');
    respond(500, false, SEND_FAILED_MESSAGE);
}

// A new token is required for the next message.
$_SESSION['contact_last_sent'] = time();
unset($_SESSION['contact_token'], $_SESSION['contact_token_time']);

respond(200, true, SUCCESS_MESSAGE . ($config['test_mode'] ? ' (Test mode: no email was sent.)' : ''));

// ===========================================================================
// Helper functions
// ===========================================================================

/** Default settings, overridden by php/config.php. */
function default_config(): array
{
    return [
        'recipient_email'     => '',
        'recipient_name'      => '',
        'from_email'          => '',
        'from_name'           => 'Website contact form',
        'subject_prefix'      => '[Website enquiry]',
        'allowed_origins'     => [],
        'min_submit_seconds'  => 3,
        'rate_limit_seconds'  => 60,
        'token_lifetime'      => 7200,
        'include_ip_address'  => false,
        'use_envelope_sender' => false,
        'test_mode'           => false,
        'timezone'            => '',
        'return_url'          => '../contact.html',
    ];
}

/** Starts a session with a hardened, strictly necessary cookie. */
function start_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');

    session_name('contact_form_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

/** Returns the current CSRF token, creating a new one when needed. */
function get_or_create_token(int $lifetime): string
{
    $token = (string) ($_SESSION['contact_token'] ?? '');
    $issuedAt = (int) ($_SESSION['contact_token_time'] ?? 0);

    if ($token === '' || time() - $issuedAt > $lifetime) {
        $token = bin2hex(random_bytes(32));
        $_SESSION['contact_token'] = $token;
        $_SESSION['contact_token_time'] = time();
    }

    return $token;
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443;
}

/** Host name of this website, safe to use in an email address. */
function site_domain(): string
{
    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? $_SERVER['SERVER_NAME'] ?? 'localhost'));
    $host = preg_replace('/:\d+$/', '', $host) ?? '';
    $host = preg_replace('/^www\./', '', $host) ?? '';

    return preg_match('/^[a-z0-9.-]+$/', $host) === 1 ? $host : 'localhost';
}

/** "host" or "host:port" part of a URL, in lower case. */
function url_authority(string $url): string
{
    $parts = parse_url($url);

    if (!is_array($parts) || empty($parts['host'])) {
        return '';
    }

    return strtolower($parts['host']) . (isset($parts['port']) ? ':' . $parts['port'] : '');
}

/** Accepts only requests sent from this website (or an allowed origin). */
function is_same_origin(array $allowedOrigins): bool
{
    $allowed = [strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''))];

    foreach ($allowedOrigins as $origin) {
        $allowed[] = url_authority((string) $origin);
    }

    $allowed = array_filter($allowed);
    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');

    if ($origin !== '' && $origin !== 'null') {
        return in_array(url_authority($origin), $allowed, true);
    }

    $referer = (string) ($_SERVER['HTTP_REFERER'] ?? '');

    return $referer !== '' && in_array(url_authority($referer), $allowed, true);
}

function is_valid_utf8(string $value): bool
{
    return function_exists('mb_check_encoding')
        ? mb_check_encoding($value, 'UTF-8')
        : preg_match('//u', $value) === 1;
}

function text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : (int) preg_match_all('/./us', $value);
}

/** Single-line value: no tags, no line breaks, no control characters. */
function clean_line(mixed $value): string
{
    if (!is_string($value) || !is_valid_utf8($value)) {
        return '';
    }

    $value = strip_tags($value);
    $value = preg_replace('/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]+/u', ' ', $value) ?? '';
    $value = preg_replace('/\s+/u', ' ', $value) ?? '';

    return trim($value);
}

/** Multi-line value: keeps line breaks, removes tags and control characters. */
function clean_text(mixed $value): string
{
    if (!is_string($value) || !is_valid_utf8($value)) {
        return '';
    }

    $value = strip_tags($value);
    $value = str_replace(["\r\n", "\r"], "\n", $value);
    $value = preg_replace('/[^\P{Cc}\n\t]+/u', '', $value) ?? '';
    $value = preg_replace("/\n{3,}/", "\n\n", $value) ?? '';

    return trim($value);
}

function is_valid_email(string $email): bool
{
    return $email !== ''
        && strlen($email) <= 254
        && preg_match('/[\r\n,;<>"]/', $email) !== 1
        && filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/** True for the demo addresses used in config.example.php. */
function is_placeholder_email(string $email): bool
{
    return preg_match('/@(your-domain\.example|example\.(com|org|net))$/i', $email) === 1;
}

/** RFC 2047 encoding for non-ASCII header text (subject, names). */
function encode_header(string $text): string
{
    if (preg_match('/^[\x20-\x7E]*$/', $text) === 1) {
        return $text;
    }

    if (function_exists('mb_encode_mimeheader')) {
        return mb_encode_mimeheader($text, 'UTF-8', 'B', "\r\n");
    }

    return '=?UTF-8?B?' . base64_encode($text) . '?=';
}

/** "Name <email>" with a safely encoded display name. */
function format_address(string $email, string $name): string
{
    $name = clean_line($name);

    if ($name === '') {
        return $email;
    }

    return '=?UTF-8?B?' . base64_encode($name) . '?= <' . $email . '>';
}

/** Plain-text email body. */
function build_message_body(array $fields, bool $includeIp): string
{
    $rows = [
        'Name'         => $fields['name'],
        'Email'        => $fields['email'],
        'Phone'        => $fields['phone'],
        'Company'      => $fields['company'],
        'Project type' => $fields['service'],
        'Budget'       => $fields['budget'],
        'Sent from'    => $fields['form_source'],
        'Date'         => date('Y-m-d H:i T'),
    ];

    if ($includeIp) {
        $rows['IP address'] = clean_line($_SERVER['REMOTE_ADDR'] ?? '');
    }

    $lines = ['New enquiry from the website contact form', ''];

    foreach ($rows as $label => $value) {
        $lines[] = str_pad($label . ':', 14) . ($value !== '' ? $value : '-');
    }

    $lines[] = '';
    $lines[] = 'Message:';
    $lines[] = $fields['message'];
    $lines[] = '';
    $lines[] = '--';
    $lines[] = 'Reply directly to this email to answer the sender.';

    return implode("\r\n", str_replace("\n", "\r\n", $lines));
}

function wants_json(): bool
{
    return stripos((string) ($_SERVER['HTTP_ACCEPT'] ?? ''), 'application/json') !== false;
}

/** Sends a JSON (fetch) or HTML (no JavaScript) response and stops. */
function respond(int $status, bool $success, string $message, array $extra = []): void
{
    if (wants_json()) {
        respond_json($status, array_merge(['success' => $success, 'message' => $message], $extra));
    }

    respond_html($status, $success, $message);
}

function send_common_headers(int $status): void
{
    http_response_code($status);
    header('Cache-Control: no-store, max-age=0');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: same-origin');
}

function respond_json(int $status, array $payload): void
{
    send_common_headers($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function respond_html(int $status, bool $success, string $message): void
{
    $returnUrl = (string) ($GLOBALS['config']['return_url'] ?? '../contact.html');
    $title = $success ? 'Thank you' : 'Message not sent';
    $statusClass = $success ? 'form-status--success' : 'form-status--error';
    $e = static fn (string $text): string => htmlspecialchars($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');

    send_common_headers($status);
    header('Content-Type: text/html; charset=utf-8');

    echo '<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>' . $e($title) . '</title>
    <link rel="stylesheet" href="../assets/css/reset.css">
    <link rel="stylesheet" href="../assets/css/variables.css">
    <link rel="stylesheet" href="../assets/css/base.css">
    <link rel="stylesheet" href="../assets/css/layout.css">
    <link rel="stylesheet" href="../assets/css/components.css">
    <link rel="stylesheet" href="../assets/css/utilities.css">
</head>
<body>
    <main class="section">
        <div class="container container--narrow">
            <div class="form-panel">
                <h1 class="form-panel__title">' . $e($title) . '</h1>
                <p class="form-status ' . $statusClass . ' mt-lg" role="status">' . $e($message) . '</p>
                <a class="btn btn--primary mt-xl" href="' . $e($returnUrl) . '">Back to the website</a>
            </div>
        </div>
    </main>
</body>
</html>';
    exit;
}
