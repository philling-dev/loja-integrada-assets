<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// Debug log com erro JSON
$logPath = '/var/www/admin.widgetvpn.xyz/deploy.log';
$jsonError = json_last_error_msg();
$debugInfo = date('[Y-m-d H:i:s] ') . "API Deploy - Raw Input: " . $rawInput . " - Decoded: " . json_encode($input) . " - JSON Error: " . $jsonError . "\n";
file_put_contents($logPath, $debugInfo, FILE_APPEND);

if (!$input || !isset($input['filename']) || !isset($input['content'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields', 'received' => $input]);
    exit;
}

$filename = $input['filename'];
$content = $input['content'];
$type = $input['type'] ?? 'js';
$codeId = $input['codeId'] ?? '';
$codeName = $input['codeName'] ?? '';

// Minificar conteúdo e converter HTML misto para JavaScript
function minifyCode($content, $type) {
    // Detectar código HTML misto (CSS + JS) e converter para JavaScript puro
    if ($type === 'js' && (strpos($content, '<style>') !== false || strpos($content, '<script>') !== false)) {
        return convertHtmlToJs($content);
    }

    if ($type === 'css') {
        // Se é CSS mas tem tags <style>, extrair apenas o CSS interno
        if (strpos($content, '<style') !== false) {
            if (preg_match('/<style[^>]*>(.*?)<\/style>/s', $content, $matches)) {
                $content = trim($matches[1]);
            }
        }

        // CORREÇÃO CRÍTICA: CSS mínimo (sem alterações estruturais)
        $content = trim($content);

        // Remove apenas comentários /* */ vazios
        $content = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $content);

        // Remove apenas espaços múltiplos, preserva estrutura
        $content = preg_replace('/\s+/', ' ', $content);

        // Preserva quebras de linha importantes
        $content = str_replace(' { ', " {\n", $content);
        $content = str_replace('; ', ";\n", $content);
        $content = str_replace(' }', "\n}", $content);

        return trim($content);
    } else {
        return preg_replace([
            '/\/\/(?!.*important).*$/m', // Remove comentários // (mantém important)
            '/\/\*(?!.*important).*?\*\//s', // Remove comentários /* */ (mantém important)
            '/\s*{\s*/', // Formata abertura de função
            '/;\s*$/m', // Limpa ponto-e-vírgula no final da linha
            '/[ \t]+/', // Remove espaços extras (mantém quebras de linha)
            '/\n\s*\n/' // Remove linhas vazias extras
        ], [
            '',
            '',
            ' {\n  ',
            ';',
            ' ',
            '\n'
        ], trim($content));
    }
}

// Converter código HTML misto (CSS + JS) para JavaScript puro
function convertHtmlToJs($content) {
    $jsCode = '';

    // Extrair CSS
    if (preg_match('/<style[^>]*>(.*?)<\/style>/s', $content, $cssMatch)) {
        $css = trim($cssMatch[1]);
        // Limpar CSS e escapar aspas
        $css = preg_replace('/\s+/', ' ', $css);
        $css = str_replace('"', '\\"', $css);
        $jsCode .= "// Injetar CSS dinamicamente\n";
        $jsCode .= "var style = document.createElement('style');\n";
        $jsCode .= "style.innerHTML = \"" . $css . "\";\n";
        $jsCode .= "document.head.appendChild(style);\n\n";
    }

    // Extrair JavaScript
    if (preg_match('/<script[^>]*>(.*?)<\/script>/s', $content, $jsMatch)) {
        $js = trim($jsMatch[1]);
        $jsCode .= "// JavaScript original\n" . $js;
    }

    return $jsCode;
}

$content = minifyCode($content, $type);

// Diretório do repositório GitHub
$repoPath = '/var/www/admin.widgetvpn.xyz';

// Criar diretório assets se não existir
if (!is_dir($repoPath . '/assets')) {
    mkdir($repoPath . '/assets', 0755, true);
}

// Caminho completo do arquivo
$filePath = $repoPath . '/assets/' . $filename;

try {
    // Escrever arquivo
    if (file_put_contents($filePath, $content) === false) {
        throw new Exception('Falha ao escrever arquivo');
    }

    // Atualizar index.json
    $indexPath = $repoPath . '/assets/index.json';
    $index = [];

    if (file_exists($indexPath)) {
        $index = json_decode(file_get_contents($indexPath), true) ?: [];
    }

    // Adicionar/atualizar entrada no índice
    $index[$codeId] = [
        'id' => $codeId,
        'name' => $codeName,
        'filename' => $filename,
        'type' => $type,
        'url' => "https://philling-dev.github.io/loja-integrada-assets/assets/{$filename}",
        'deployedAt' => date('c'),
        'size' => filesize($filePath)
    ];

    file_put_contents($indexPath, json_encode($index, JSON_PRETTY_PRINT));

    // Git add, commit e push (usa credenciais do GitHub CLI configurado)
    $commands = [
        "cd {$repoPath}",
        "git add assets/{$filename}",
        "git add assets/index.json",
        "git commit -m \"Deploy: {$codeName} ({$filename})\" || true",  // Ignore se já commitado
        "git push origin main 2>&1"  // GitHub CLI já configurado para credenciais
    ];

    $fullCommand = implode(' && ', $commands);
    $output = shell_exec($fullCommand);

    // Log do deploy
    $logPath = $repoPath . '/deploy.log';
    $logEntry = date('[Y-m-d H:i:s] ') . "Deploy: {$filename} - Output: {$output}\n";
    file_put_contents($logPath, $logEntry, FILE_APPEND);

    $response = [
        'success' => true,
        'filename' => $filename,
        'url' => "https://philling-dev.github.io/loja-integrada-assets/assets/{$filename}",
        'size' => filesize($filePath),
        'deployedAt' => date('c'),
        'gitOutput' => $output
    ];

    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Deploy failed: ' . $e->getMessage()
    ]);
}
?>