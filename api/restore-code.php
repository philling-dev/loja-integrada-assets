<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$logPath = '/var/www/admin.widgetvpn.xyz/restore.log';
$debugInfo = date('[Y-m-d H:i:s] ') . "API Restore - Method: " . $_SERVER['REQUEST_METHOD'] . " - Raw Input: " . $rawInput . " - Decoded: " . json_encode($input) . "\n";
file_put_contents($logPath, $debugInfo, FILE_APPEND);

if (!$input || !isset($input['codeId'])) {
    http_response_code(400);
    $errorResponse = [
        'error' => 'Missing codeId field',
        'received' => $input,
        'rawInput' => $rawInput
    ];
    file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "ERROR: Missing codeId - " . json_encode($errorResponse) . "\n", FILE_APPEND);
    echo json_encode($errorResponse);
    exit;
}

$codeId = $input['codeId'];
$repoPath = '/var/www/admin.widgetvpn.xyz';
$indexPath = $repoPath . '/assets/index.json';
$trashPath = $repoPath . '/assets/trash.json';

try {
    if (!file_exists($trashPath)) {
        throw new Exception('Trash file not found');
    }

    $trash = json_decode(file_get_contents($trashPath), true) ?: [];

    if (!isset($trash[$codeId])) {
        throw new Exception('Code not found in trash');
    }

    $codeData = $trash[$codeId];
    $codeName = $codeData['name'];
    $filename = $codeData['filename'];

    // Remove metadados de deleção
    unset($codeData['deletedAt']);
    unset($codeData['deletedBy']);

    // Load index
    $index = [];
    if (file_exists($indexPath)) {
        $index = json_decode(file_get_contents($indexPath), true) ?: [];
    }

    // Restaurar para index.json
    $index[$codeId] = $codeData;
    if (file_put_contents($indexPath, json_encode($index, JSON_PRETTY_PRINT)) === false) {
        throw new Exception('Failed to update index.json');
    }
    file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "Restored to index: {$codeId}\n", FILE_APPEND);

    // Remover do trash.json
    unset($trash[$codeId]);
    if (file_put_contents($trashPath, json_encode($trash, JSON_PRETTY_PRINT)) === false) {
        throw new Exception('Failed to update trash.json');
    }
    file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "Removed from trash: {$codeId}\n", FILE_APPEND);

    // Git commit e push
    $commands = [
        "cd {$repoPath}",
        "git add assets/index.json assets/trash.json",
        "git commit -m \"Restore: Restore {$codeName} from trash\" || echo 'Nothing to commit'",
        "git push origin main 2>&1"
    ];

    $fullCommand = implode(' && ', $commands);
    $gitOutput = shell_exec($fullCommand);

    file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "Git restore output: {$gitOutput}\n", FILE_APPEND);

    $pushSuccess = (strpos($gitOutput, 'main -> main') !== false) ||
                   (strpos($gitOutput, 'Everything up-to-date') !== false);

    $response = [
        'success' => true,
        'codeId' => $codeId,
        'codeName' => $codeName,
        'filename' => $filename,
        'message' => "Código '{$codeName}' restaurado com sucesso!",
        'gitOutput' => $gitOutput,
        'pushSuccess' => $pushSuccess
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    $errorMsg = 'Restore failed: ' . $e->getMessage();
    file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "ERROR: {$errorMsg}\n", FILE_APPEND);

    echo json_encode([
        'success' => false,
        'error' => $errorMsg
    ]);
}
?>
