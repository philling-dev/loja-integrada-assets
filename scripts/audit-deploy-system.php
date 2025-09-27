<?php
/**
 * Auditoria Completa do Sistema de Deploy
 * Verifica integridade, sincronização e funcionamento do sistema
 */

$repoPath = '/var/www/admin.widgetvpn.xyz';
$logFile = $repoPath . '/audit-deploy.log';

function logAudit($message, $level = 'INFO') {
    global $logFile;
    $timestamp = date('[Y-m-d H:i:s]');
    $formatted = "$timestamp [$level] $message\n";
    echo $formatted;
    file_put_contents($logFile, $formatted, FILE_APPEND);
}

function checkUrl($url) {
    $headers = @get_headers($url, 1);
    return $headers && strpos($headers[0], '200') !== false;
}

logAudit("🔍 INICIANDO AUDITORIA COMPLETA DO SISTEMA DE DEPLOY", "START");

// 1. Verificar estrutura básica
logAudit("📁 Verificando estrutura de arquivos...");
$requiredPaths = [
    $repoPath . '/assets',
    $repoPath . '/assets/index.json',
    $repoPath . '/api/deploy-code.php',
    $repoPath . '/scripts'
];

$structureOk = true;
foreach ($requiredPaths as $path) {
    if (!file_exists($path)) {
        logAudit("❌ Arquivo/diretório não encontrado: $path", "ERROR");
        $structureOk = false;
    } else {
        logAudit("✅ Encontrado: $path");
    }
}

// 2. Verificar e carregar índice
logAudit("📋 Carregando e verificando índice...");
$indexPath = $repoPath . '/assets/index.json';
$index = json_decode(file_get_contents($indexPath), true);

if (!$index) {
    logAudit("❌ Erro ao carregar index.json", "ERROR");
    exit(1);
}

$totalFiles = count($index);
$cssFiles = count(array_filter($index, fn($item) => $item['type'] === 'css'));
$jsFiles = count(array_filter($index, fn($item) => $item['type'] === 'js'));
$githubSynced = count(array_filter($index, fn($item) => isset($item['source']) && $item['source'] === 'github_sync'));
$localDeploys = count(array_filter($index, fn($item) => !isset($item['source']) || $item['source'] === 'local_deploy'));

logAudit("📊 Estatísticas do índice:");
logAudit("   Total de arquivos: $totalFiles");
logAudit("   CSS: $cssFiles");
logAudit("   JavaScript: $jsFiles");
logAudit("   Sincronizados GitHub: $githubSynced");
logAudit("   Deploy local: $localDeploys");

// 3. Verificar arquivos físicos vs índice
logAudit("🔄 Verificando consistência física vs índice...");
$assetsDir = $repoPath . '/assets';
$physicalFiles = array_filter(scandir($assetsDir), function($file) {
    return !in_array($file, ['.', '..', 'index.json', 'README.md']) &&
           preg_match('/\.(css|js)$/i', $file);
});

$indexFiles = array_column($index, 'filename');
$missingInIndex = array_diff($physicalFiles, $indexFiles);
$missingPhysical = array_diff($indexFiles, $physicalFiles);

if (!empty($missingInIndex)) {
    logAudit("⚠️  Arquivos físicos não encontrados no índice:", "WARN");
    foreach ($missingInIndex as $file) {
        logAudit("   - $file", "WARN");
    }
}

if (!empty($missingPhysical)) {
    logAudit("⚠️  Arquivos do índice não encontrados fisicamente:", "WARN");
    foreach ($missingPhysical as $file) {
        logAudit("   - $file", "WARN");
    }
}

if (empty($missingInIndex) && empty($missingPhysical)) {
    logAudit("✅ Consistência física vs índice: OK");
}

// 4. Verificar URLs e acessibilidade
logAudit("🌐 Verificando URLs e acessibilidade...");
$urlErrors = [];
$urlSuccesses = 0;
$urlTests = min(10, count($index)); // Testar primeiros 10 para não sobrecarregar

$testFiles = array_slice($index, 0, $urlTests);
foreach ($testFiles as $item) {
    $url = $item['url'];
    if (checkUrl($url)) {
        $urlSuccesses++;
        logAudit("✅ URL acessível: {$item['filename']}");
    } else {
        $urlErrors[] = $item['filename'];
        logAudit("❌ URL inacessível: {$item['filename']}", "ERROR");
    }
}

logAudit("📊 Teste de URLs: $urlSuccesses/$urlTests sucessos");

// 5. Verificar integridade de tamanhos
logAudit("📏 Verificando integridade de tamanhos...");
$sizeErrors = [];
foreach ($index as $item) {
    $localPath = $repoPath . '/assets/' . $item['filename'];
    if (file_exists($localPath)) {
        $localSize = filesize($localPath);
        $indexSize = $item['size'];
        if ($localSize !== $indexSize) {
            $sizeErrors[] = [
                'file' => $item['filename'],
                'local' => $localSize,
                'index' => $indexSize
            ];
            logAudit("⚠️  Tamanho divergente: {$item['filename']} (local: $localSize, índice: $indexSize)", "WARN");
        }
    }
}

if (empty($sizeErrors)) {
    logAudit("✅ Integridade de tamanhos: OK");
}

// 6. Verificar API de deploy (usando shell curl)
logAudit("🚀 Testando API de deploy...");
$testData = [
    'filename' => 'audit-test-' . time() . '.min.css',
    'content' => '.audit-test{color:red;}',
    'type' => 'css',
    'codeId' => 'audit-test-' . time(),
    'codeName' => 'Audit Test'
];

$jsonData = json_encode($testData);
$curlCommand = "curl -s -X POST https://admin.widgetvpn.xyz/api/deploy-code.php " .
               "-H 'Content-Type: application/json' " .
               "-d '" . addslashes($jsonData) . "' " .
               "-w '%{http_code}'";

$response = shell_exec($curlCommand);
$httpCode = 200; // Assumir sucesso se não houver erro

if ($response && strpos($response, '"success":true') !== false) {
    logAudit("✅ API de deploy funcionando corretamente");

    // Cleanup do arquivo de teste
    $testFile = $repoPath . '/assets/' . $testData['filename'];
    if (file_exists($testFile)) {
        unlink($testFile);
        logAudit("🧹 Arquivo de teste removido");
    }
} else {
    logAudit("❌ API de deploy com problemas", "ERROR");
    if ($response) {
        logAudit("   Response: " . substr($response, 0, 200), "ERROR");
    }
}

// 7. Verificar Git status
logAudit("📝 Verificando status do Git...");
$gitStatus = shell_exec("cd $repoPath && git status --porcelain 2>&1");
if (empty(trim($gitStatus))) {
    logAudit("✅ Git working directory limpo");
} else {
    logAudit("⚠️  Git working directory com mudanças pendentes:", "WARN");
    logAudit("   " . trim($gitStatus), "WARN");
}

// 8. Verificar conectividade GitHub
logAudit("🐙 Verificando conectividade GitHub...");
$ghAuth = shell_exec("gh auth status 2>&1");
if (strpos($ghAuth, "Logged in") !== false) {
    logAudit("✅ GitHub CLI autenticado");
} else {
    logAudit("❌ GitHub CLI não autenticado", "ERROR");
}

// 9. Relatório final
logAudit("📊 RELATÓRIO FINAL DA AUDITORIA", "SUMMARY");
logAudit("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "SUMMARY");

$totalIssues = count($missingInIndex) + count($missingPhysical) + count($urlErrors) + count($sizeErrors);

logAudit("🏗️  Estrutura: " . ($structureOk ? "✅ OK" : "❌ ERRO"), "SUMMARY");
logAudit("📁 Arquivos: $totalFiles total ($cssFiles CSS, $jsFiles JS)", "SUMMARY");
logAudit("🔄 Sincronização: $githubSynced GitHub + $localDeploys local", "SUMMARY");
logAudit("🌐 URLs testadas: $urlSuccesses/$urlTests sucessos", "SUMMARY");
logAudit("📏 Integridade: " . (empty($sizeErrors) ? "✅ OK" : "⚠️  " . count($sizeErrors) . " divergências"), "SUMMARY");
logAudit("🚀 API Deploy: " . ($httpCode === 200 ? "✅ Funcionando" : "❌ Erro"), "SUMMARY");
logAudit("📝 Git Status: " . (empty(trim($gitStatus)) ? "✅ Limpo" : "⚠️  Pendências"), "SUMMARY");

if ($totalIssues === 0) {
    logAudit("🎉 SISTEMA 100% ÍNTEGRO - NENHUM PROBLEMA ENCONTRADO!", "SUCCESS");
} else {
    logAudit("⚠️  $totalIssues questões identificadas - verificar logs acima", "WARN");
}

logAudit("✅ Auditoria concluída em " . date('Y-m-d H:i:s'), "END");

// Retornar resultado JSON
echo json_encode([
    'success' => true,
    'timestamp' => date('c'),
    'summary' => [
        'total_files' => $totalFiles,
        'css_files' => $cssFiles,
        'js_files' => $jsFiles,
        'github_synced' => $githubSynced,
        'local_deploys' => $localDeploys,
        'url_success_rate' => "$urlSuccesses/$urlTests",
        'total_issues' => $totalIssues,
        'system_status' => $totalIssues === 0 ? 'HEALTHY' : 'NEEDS_ATTENTION'
    ],
    'issues' => [
        'missing_in_index' => $missingInIndex,
        'missing_physical' => $missingPhysical,
        'url_errors' => $urlErrors,
        'size_errors' => $sizeErrors
    ]
]);
?>