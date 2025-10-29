<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// Fallback para $_POST se php://input estiver vazio
if (empty($input) && !empty($_POST)) {
    $input = $_POST;
    $rawInput = json_encode($_POST);
}

$logPath = '/var/www/admin.widgetvpn.xyz/delete.log';
$debugInfo = date('[Y-m-d H:i:s] ') . "API Delete - Method: " . $_SERVER['REQUEST_METHOD'] . " - Raw Input: " . $rawInput . " - Decoded: " . json_encode($input) . "\n";
file_put_contents($logPath, $debugInfo, FILE_APPEND);

if (!$input || !isset($input['codeId'])) {
    http_response_code(400);
    $errorResponse = [
        'error' => 'Missing codeId field',
        'received' => $input,
        'rawInput' => $rawInput,
        'contentType' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
    ];
    file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "ERROR: Missing codeId - " . json_encode($errorResponse) . "\n", FILE_APPEND);
    echo json_encode($errorResponse);
    exit;
}

$codeId = $input['codeId'];
$permanentDelete = $input['permanent'] ?? false;
$repoPath = '/var/www/admin.widgetvpn.xyz';
$indexPath = $repoPath . '/assets/index.json';
$trashPath = $repoPath . '/assets/trash.json';

try {
    if (!file_exists($indexPath)) {
        throw new Exception('Index file not found');
    }

    $index = json_decode(file_get_contents($indexPath), true) ?: [];

    if (!isset($index[$codeId])) {
        throw new Exception('Code not found in index');
    }

    $codeData = $index[$codeId];
    $filename = $codeData['filename'];
    $codeName = $codeData['name'];
    $filePath = $repoPath . '/assets/' . $filename;

    $deletedFiles = [];
    $warnings = [];

    // Load trash
    $trash = [];
    if (file_exists($trashPath)) {
        $trash = json_decode(file_get_contents($trashPath), true) ?: [];
    }

    if ($permanentDelete) {
        // DELEÇÃO PERMANENTE
        // 1. Deletar arquivo físico do repositório
        if (file_exists($filePath)) {
            if (unlink($filePath)) {
                $deletedFiles[] = "File: {$filename}";
                file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "PERMANENT DELETE: Deleted file: {$filePath}\n", FILE_APPEND);
            } else {
                throw new Exception("Failed to delete file: {$filename}");
            }
        } else {
            $warnings[] = "File already deleted: {$filename}";
            file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "WARNING: File not found (already deleted): {$filePath}\n", FILE_APPEND);
        }

        // 2. Remover do index.json
        unset($index[$codeId]);
        if (file_put_contents($indexPath, json_encode($index, JSON_PRETTY_PRINT)) !== false) {
            $deletedFiles[] = "Index entry: {$codeId}";
            file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "PERMANENT DELETE: Removed from index: {$codeId}\n", FILE_APPEND);
        } else {
            throw new Exception("Failed to update index.json");
        }
    } else {
        // MOVER PARA LIXEIRA
        // 1. Adicionar metadados de deleção
        $codeData['deletedAt'] = date('c');
        $codeData['deletedBy'] = 'admin';

        // 2. Mover para trash.json
        $trash[$codeId] = $codeData;
        if (file_put_contents($trashPath, json_encode($trash, JSON_PRETTY_PRINT)) !== false) {
            $deletedFiles[] = "Moved to trash: {$codeId}";
            file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "Moved to trash: {$codeId}\n", FILE_APPEND);
        } else {
            throw new Exception("Failed to update trash.json");
        }

        // 3. Remover do index.json
        unset($index[$codeId]);
        if (file_put_contents($indexPath, json_encode($index, JSON_PRETTY_PRINT)) !== false) {
            $deletedFiles[] = "Removed from index: {$codeId}";
            file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "Removed from index (moved to trash): {$codeId}\n", FILE_APPEND);
        } else {
            throw new Exception("Failed to update index.json");
        }

        // 4. Deletar arquivo físico do repositório
        if (file_exists($filePath)) {
            if (unlink($filePath)) {
                $deletedFiles[] = "Deleted file: {$filename}";
                file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "TRASH DELETE: Deleted file from repository: {$filePath}\n", FILE_APPEND);
            } else {
                $warnings[] = "Failed to delete file: {$filename}";
            }
        } else {
            $warnings[] = "File already deleted: {$filename}";
        }
    }

    // 4. Git commit e push
    if ($permanentDelete) {
        $commands = [
            "cd {$repoPath}",
            "git rm -f assets/{$filename} 2>&1 || echo 'File already deleted'",
            "git add assets/index.json assets/trash.json",
            "git commit -m \"Delete: Permanent removal of {$codeName} ({$filename})\" || echo 'Nothing to commit'",
            "git push origin main 2>&1"
        ];
    } else {
        $commands = [
            "cd {$repoPath}",
            "git rm -f assets/{$filename} 2>&1 || echo 'File already deleted'",
            "git add assets/index.json assets/trash.json",
            "git commit -m \"Trash: Move {$codeName} to trash (recoverable)\" || echo 'Nothing to commit'",
            "git push origin main 2>&1"
        ];
    }

    $fullCommand = implode(' && ', $commands);
    $gitOutput = shell_exec($fullCommand);

    file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "Git delete output: {$gitOutput}\n", FILE_APPEND);

    // Verificar se o push foi bem-sucedido
    $pushSuccess = (strpos($gitOutput, 'main -> main') !== false) ||
                   (strpos($gitOutput, 'Everything up-to-date') !== false);

    // Sucesso se pelo menos o index.json foi atualizado
    $success = in_array("Index entry: {$codeId}", $deletedFiles) ||
               in_array("Removed from index: {$codeId}", $deletedFiles);

    if ($permanentDelete) {
        $message = "Código '{$codeName}' deletado permanentemente!";
    } else {
        $message = "Código '{$codeName}' movido para lixeira! Pode ser restaurado.";
    }

    if (count($warnings) > 0) {
        $message .= " (Avisos: " . implode(', ', $warnings) . ")";
    }

    $response = [
        'success' => $success,
        'codeId' => $codeId,
        'codeName' => $codeName,
        'filename' => $filename,
        'deleted' => $deletedFiles,
        'warnings' => $warnings,
        'gitOutput' => $gitOutput,
        'pushSuccess' => $pushSuccess,
        'message' => $message
    ];

    http_response_code(200);
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    $errorMsg = 'Delete failed: ' . $e->getMessage();
    file_put_contents($logPath, date('[Y-m-d H:i:s] ') . "ERROR: {$errorMsg}\n", FILE_APPEND);

    echo json_encode([
        'success' => false,
        'error' => $errorMsg
    ]);
}
?>
