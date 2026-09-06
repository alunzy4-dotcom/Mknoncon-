<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$configFile = __DIR__ . '/supabase-config.js';
$configText = is_file($configFile) ? file_get_contents($configFile) : '';
preg_match('/url:\s*"([^"]+)"/', $configText, $urlMatch);
preg_match('/anonKey:\s*"([^"]+)"/', $configText, $keyMatch);
$SUPABASE_URL = $urlMatch[1] ?? '';
$SUPABASE_KEY = $keyMatch[1] ?? '';

function respond($code, $data) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function supabase_request($method, $path, $body = null, $accessToken = null) {
  global $SUPABASE_URL, $SUPABASE_KEY;
  if (!$SUPABASE_URL || !$SUPABASE_KEY) return [500, ['message' => 'Supabase config missing']];
  $ch = curl_init($SUPABASE_URL . $path);
  $headers = ['apikey: ' . $SUPABASE_KEY, 'Content-Type: application/json'];
  $headers[] = 'Authorization: Bearer ' . ($accessToken ?: $SUPABASE_KEY);

  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => $method,
    CURLOPT_HTTPHEADER => $headers,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_CONNECTTIMEOUT => 10
  ]);
  if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

  $raw = curl_exec($ch);
  if ($raw === false) {
    $err = curl_error($ch);
    curl_close($ch);
    return [0, ['message' => 'Server connection failed: ' . $err]];
  }
  $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);
  $json = json_decode($raw, true);
  if ($json === null && $raw !== 'null' && $raw !== '') $json = ['raw' => $raw];
  return [$status, $json ?? []];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['message' => 'Method not allowed']);
$input = json_decode(file_get_contents('php://input'), true) ?: [];
$action = $input['action'] ?? '';

if ($action === 'signup') {
  [$status, $data] = supabase_request('POST', '/auth/v1/signup', [
    'email' => trim($input['email'] ?? ''),
    'password' => $input['password'] ?? '',
    'data' => [
      'full_name' => trim($input['full_name'] ?? ''),
      'phone' => trim($input['phone'] ?? ''),
      'referral_code' => (($input['referral_code'] ?? '') !== '' ? $input['referral_code'] : null)
    ]
  ]);
  respond($status ?: 502, $data);
}

if ($action === 'login') {
  [$status, $data] = supabase_request('POST', '/auth/v1/token?grant_type=password', [
    'email' => trim($input['email'] ?? ''),
    'password' => $input['password'] ?? ''
  ]);
  respond($status ?: 502, $data);
}

if ($action === 'profile_upsert') {
  $token = $input['access_token'] ?? '';
  $userId = $input['user_id'] ?? '';
  if (!$token || !$userId) respond(401, ['message' => 'Missing session']);
  [$status, $data] = supabase_request('POST', '/rest/v1/profiles?on_conflict=id', [[
    'id' => $userId,
    'full_name' => trim($input['full_name'] ?? ''),
    'phone' => trim($input['phone'] ?? ''),
    'referral_code' => strtoupper(substr(str_replace('-', '', $userId), 0, 8)),
    'referred_by' => (($input['referral_code'] ?? '') !== '' ? $input['referral_code'] : null)
  ]], $token);
  respond($status ?: 502, $data);
}

if ($action === 'profile') {
  $token = $input['access_token'] ?? '';
  $userId = $input['user_id'] ?? '';
  [$status, $data] = supabase_request('GET',
    '/rest/v1/profiles?id=eq.' . rawurlencode($userId) . '&select=full_name,phone,referral_code',
    null, $token);
  respond($status ?: 502, $data);
}

if ($action === 'requests') {
  $token = $input['access_token'] ?? '';
  [$status, $data] = supabase_request('GET',
    '/rest/v1/requests?select=id,service_type,details,status,created_at&order=created_at.desc',
    null, $token);
  respond($status ?: 502, $data);
}

if ($action === 'create_request') {
  $token = $input['access_token'] ?? '';
  $userId = $input['user_id'] ?? '';
  $serviceType = trim($input['service_type'] ?? '');
  $details = trim($input['details'] ?? '');

  if (!$token || !$userId) respond(401, ['message' => 'Missing session']);
  if ($serviceType === '') respond(400, ['message' => 'اختر نوع الخدمة']);
  if ($details === '') respond(400, ['message' => 'اكتب تفاصيل الطلب']);

  [$status, $data] = supabase_request('POST', '/rest/v1/requests', [[
    'user_id' => $userId,
    'service_type' => $serviceType,
    'details' => $details,
    'status' => 'جديد'
  ]], $token);

  respond($status ?: 502, $data);
}

respond(400, ['message' => 'Unknown action']);
