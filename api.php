<?php

define('DB_FILE', getenv('DB_FILE'));
define('MAX_REQUEST', 10);
define('TIME_WINDOW', 60);
define('DATA_STORAGE_TIME', 60 * 60 * 24);

function generateRandomId($length = 16) {
    $bytes = random_bytes($length);
    return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
}

$db = new PDO('sqlite:' . DB_FILE);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("
    CREATE TABLE IF NOT EXISTS secrets (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL
    )
");

$db->exec("
    CREATE TABLE IF NOT EXISTS request_log (
        ip TEXT,
        ts INTEGER
    )
");

$stmt = $db->prepare("DELETE FROM secrets WHERE created_at < :time");
$stmt->execute([':time' => time() - DATA_STORAGE_TIME]);

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$stmt = $db->prepare("DELETE FROM request_log WHERE ts < :threshold");
$stmt->execute([':threshold' => time() - TIME_WINDOW]);

$stmt = $db->prepare("SELECT COUNT(*) as cnt FROM request_log WHERE ip = :ip");
$stmt->execute([':ip' => $ip]);
$count = (int) $stmt->fetch(PDO::FETCH_ASSOC)['cnt'];

if ($count >= MAX_REQUEST) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please try again later.']);
    exit;
}

$stmt = $db->prepare("INSERT INTO request_log (ip, ts) VALUES (:ip, :ts)");
$stmt->execute([':ip' => $ip, ':ts' => time()]);

$maxPayload = 10_000;
if (isset($_POST['encryptedData']) && strlen($_POST['encryptedData']) > $maxPayload) {
    http_response_code(413);
    echo json_encode(['error' => 'Payload is too large.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['encryptedData'])) {

    $data = $_POST['encryptedData'];
    $id = generateRandomId();
    $stmt = $db->prepare("INSERT INTO secrets (id, data, created_at) VALUES (:id, :data, :created_at)");
    $stmt->execute([
        ':id' => $id,
        ':data' => $data,
        ':created_at' => time()
    ]);

    echo json_encode(['id' => $id]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $id = $_GET['id'];
    $stmt = $db->prepare("SELECT data FROM secrets WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $stmt = $db->prepare("DELETE FROM secrets WHERE id = :id");
        $stmt->execute([':id' => $id]);

        echo json_encode(['data' => $row['data']]);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Data does not exist or has already been retrieved.']);
    }
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Invalid request.']);
