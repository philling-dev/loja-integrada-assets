<?php
/**
 * Script para sincronizar códigos CSS/JS do GitHub com banco local
 * Baixa todos os arquivos do repositório loja-integrada-assets e atualiza o index.json
 */

$repoPath = '/var/www/admin.widgetvpn.xyz';
$logFile = $repoPath . '/sync-github.log';

function logMessage($message) {
    global $logFile;
    $timestamp = date('[Y-m-d H:i:s]');
    echo "$timestamp $message\n";
    file_put_contents($logFile, "$timestamp $message\n", FILE_APPEND);
}

function generateUniqueId($filename) {
    // Gerar ID único baseado no nome do arquivo
    $clean = preg_replace('/[^a-zA-Z0-9]/', '', pathinfo($filename, PATHINFO_FILENAME));
    return strtolower(substr($clean, 0, 15) . md5($filename));
}

function extractNameFromFilename($filename) {
    // Extrair nome legível do arquivo
    $name = pathinfo($filename, PATHINFO_FILENAME);
    $name = str_replace(['-', '_'], ' ', $name);
    $name = ucwords($name);
    return $name;
}

logMessage("🔄 Iniciando sincronização de códigos GitHub");

// 1. Obter lista de arquivos do GitHub via GitHub CLI
logMessage("📡 Buscando arquivos do GitHub...");
$githubCommand = "gh api repos/philling-dev/loja-integrada-assets/contents/assets";
$githubOutput = shell_exec($githubCommand);
$githubContent = json_decode($githubOutput, true);

if (!$githubContent) {
    logMessage("❌ Erro ao obter arquivos do GitHub: " . $githubOutput);
    exit(1);
}

// 2. Carregar índice atual
$indexPath = $repoPath . '/assets/index.json';
$currentIndex = [];
if (file_exists($indexPath)) {
    $currentIndex = json_decode(file_get_contents($indexPath), true) ?: [];
}

logMessage("📋 Índice atual: " . count($currentIndex) . " arquivos");

// 3. Processar arquivos CSS e JS do GitHub
$newIndex = [];
$syncCount = 0;
$skipCount = 0;

foreach ($githubContent as $file) {
    if ($file['type'] !== 'file') continue;

    $filename = $file['name'];
    $extension = pathinfo($filename, PATHINFO_EXTENSION);

    // Filtrar apenas CSS e JS
    if (!in_array($extension, ['css', 'js', 'min'])) {
        continue;
    }

    // Verificar se é arquivo minificado ou CSS/JS válido
    if (!preg_match('/\.(css|js|min\.css|min\.js)$/i', $filename)) {
        continue;
    }

    $type = (strpos($filename, '.css') !== false) ? 'css' : 'js';
    $id = generateUniqueId($filename);
    $name = extractNameFromFilename($filename);

    // Verificar se já existe no índice
    $exists = false;
    foreach ($currentIndex as $currentId => $currentItem) {
        if ($currentItem['filename'] === $filename) {
            $exists = true;
            $id = $currentId; // Manter ID existente
            $name = $currentItem['name']; // Manter nome existente
            break;
        }
    }

    // Adicionar ao novo índice
    $newIndex[$id] = [
        'id' => $id,
        'name' => $name,
        'filename' => $filename,
        'type' => $type,
        'url' => "https://philling-dev.github.io/loja-integrada-assets/assets/{$filename}",
        'deployedAt' => $exists ? $currentIndex[$id]['deployedAt'] : date('c'),
        'size' => $file['size'],
        'source' => 'github_sync',
        'github_sha' => $file['sha']
    ];

    if ($exists) {
        $skipCount++;
        logMessage("⚡ Existe: {$filename} ({$type})");
    } else {
        $syncCount++;
        logMessage("✅ Novo: {$filename} ({$type}) - ID: {$id}");
    }
}

// 4. Mesclar com códigos existentes que não estão no GitHub
foreach ($currentIndex as $id => $item) {
    if (!isset($newIndex[$id]) && !isset($item['source'])) {
        // Manter códigos locais que não vieram do GitHub
        $newIndex[$id] = $item;
        $newIndex[$id]['source'] = 'local_deploy';
        logMessage("🔄 Mantido local: {$item['filename']}");
    }
}

// 5. Salvar novo índice
file_put_contents($indexPath, json_encode($newIndex, JSON_PRETTY_PRINT));

// 6. Estatísticas finais
$totalFiles = count($newIndex);
$cssFiles = count(array_filter($newIndex, fn($item) => $item['type'] === 'css'));
$jsFiles = count(array_filter($newIndex, fn($item) => $item['type'] === 'js'));

logMessage("🎉 Sincronização concluída:");
logMessage("📊 Total: {$totalFiles} arquivos");
logMessage("🎨 CSS: {$cssFiles} arquivos");
logMessage("⚡ JS: {$jsFiles} arquivos");
logMessage("✅ Novos: {$syncCount}");
logMessage("⏭️  Existentes: {$skipCount}");

// 7. Commit das mudanças
if ($syncCount > 0) {
    logMessage("📝 Fazendo commit das mudanças...");
    $commands = [
        "cd {$repoPath}",
        "git add assets/index.json",
        "git commit -m \"Sync: Sincronização automática com GitHub - {$syncCount} novos arquivos\" || true",
        "git push origin main 2>&1"
    ];

    $fullCommand = implode(' && ', $commands);
    $output = shell_exec($fullCommand);
    logMessage("🚀 Git output: " . trim($output));
}

logMessage("✅ Sincronização GitHub concluída com sucesso!");

// 8. Retornar resultado para API
echo json_encode([
    'success' => true,
    'total' => $totalFiles,
    'css' => $cssFiles,
    'js' => $jsFiles,
    'new' => $syncCount,
    'existing' => $skipCount,
    'timestamp' => date('c')
]);
?>