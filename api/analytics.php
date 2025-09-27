<?php
/**
 * API de Analytics e Métricas Avançadas
 * Fornece dados em tempo real sobre usage, performance e estatísticas
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$action = $_GET['action'] ?? 'overview';
$repoPath = '/var/www/admin.widgetvpn.xyz';

// Função para log de analytics
function logAnalytics($event, $data = []) {
    $logFile = '/var/log/dashboard-analytics.log';
    $timestamp = date('c');
    $entry = json_encode([
        'timestamp' => $timestamp,
        'event' => $event,
        'data' => $data,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ]);
    file_put_contents($logFile, $entry . "\n", FILE_APPEND);
}

// Função para obter estatísticas dos arquivos
function getFileStats($repoPath) {
    $indexPath = $repoPath . '/assets/index.json';

    if (!file_exists($indexPath)) {
        return [
            'total' => 0,
            'css' => 0,
            'js' => 0,
            'size' => 0,
            'github_synced' => 0,
            'local_deploys' => 0
        ];
    }

    $index = json_decode(file_get_contents($indexPath), true) ?: [];

    $cssFiles = array_filter($index, fn($item) => $item['type'] === 'css');
    $jsFiles = array_filter($index, fn($item) => $item['type'] === 'js');
    $githubSynced = array_filter($index, fn($item) => isset($item['source']) && $item['source'] === 'github_sync');
    $localDeploys = array_filter($index, fn($item) => !isset($item['source']) || $item['source'] === 'local_deploy');

    $totalSize = array_sum(array_column($index, 'size'));

    return [
        'total' => count($index),
        'css' => count($cssFiles),
        'js' => count($jsFiles),
        'size' => $totalSize,
        'github_synced' => count($githubSynced),
        'local_deploys' => count($localDeploys)
    ];
}

// Função para obter histórico de deploys
function getDeployHistory($repoPath, $limit = 10) {
    $indexPath = $repoPath . '/assets/index.json';

    if (!file_exists($indexPath)) {
        return [];
    }

    $index = json_decode(file_get_contents($indexPath), true) ?: [];

    // Ordenar por data de deploy
    usort($index, function($a, $b) {
        return strtotime($b['deployedAt']) - strtotime($a['deployedAt']);
    });

    return array_slice($index, 0, $limit);
}

// Função para obter métricas de performance
function getPerformanceMetrics($repoPath) {
    $metrics = [
        'avg_file_size' => 0,
        'largest_file' => null,
        'smallest_file' => null,
        'deploy_frequency' => 0,
        'last_sync' => null
    ];

    $indexPath = $repoPath . '/assets/index.json';

    if (!file_exists($indexPath)) {
        return $metrics;
    }

    $index = json_decode(file_get_contents($indexPath), true) ?: [];

    if (empty($index)) {
        return $metrics;
    }

    $sizes = array_column($index, 'size');
    $metrics['avg_file_size'] = array_sum($sizes) / count($sizes);

    // CORREÇÃO: Encontrar maior e menor arquivo corretamente
    $largest = null;
    $smallest = null;
    foreach ($index as $item) {
        if ($largest === null || $item['size'] > $largest['size']) {
            $largest = $item;
        }
        if ($smallest === null || $item['size'] < $smallest['size']) {
            $smallest = $item;
        }
    }

    $metrics['largest_file'] = [
        'name' => $largest['filename'],
        'size' => $largest['size']
    ];

    $metrics['smallest_file'] = [
        'name' => $smallest['filename'],
        'size' => $smallest['size']
    ];

    // Calcular frequência de deploy (arquivos por dia)
    $dates = array_map(fn($item) => date('Y-m-d', strtotime($item['deployedAt'])), $index);
    $uniqueDates = array_unique($dates);
    $daysSinceFirst = max(1, (time() - strtotime(min(array_column($index, 'deployedAt')))) / 86400);
    $metrics['deploy_frequency'] = count($index) / $daysSinceFirst;

    // Última sincronização
    $syncLogFile = '/var/log/github-sync-cron.log';
    if (file_exists($syncLogFile)) {
        $lines = file($syncLogFile, FILE_IGNORE_NEW_LINES);
        $lastLine = end($lines);
        if (preg_match('/\[([\d\-\s:]+)\]/', $lastLine, $matches)) {
            $metrics['last_sync'] = $matches[1];
        }
    }

    return $metrics;
}

// Função para obter logs de sistema
function getSystemLogs($limit = 50) {
    $logs = [];

    $logFiles = [
        '/var/log/github-sync-cron.log' => 'GitHub Sync',
        '/var/log/projeto-backup-dual.log' => 'Backup System',
        '/var/www/admin.widgetvpn.xyz/deploy.log' => 'Deploy API'
    ];

    foreach ($logFiles as $file => $source) {
        if (!file_exists($file)) continue;

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $recentLines = array_slice($lines, -$limit);

        foreach ($recentLines as $line) {
            if (preg_match('/\[([\d\-\s:]+)\]\s*(.*)/', $line, $matches)) {
                $logs[] = [
                    'timestamp' => $matches[1],
                    'message' => $matches[2],
                    'source' => $source,
                    'level' => strpos($line, 'ERROR') !== false ? 'error' :
                              (strpos($line, 'WARN') !== false ? 'warning' : 'info')
                ];
            }
        }
    }

    // Ordenar por timestamp
    usort($logs, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    return array_slice($logs, 0, $limit);
}

// Função para obter status do sistema
function getSystemStatus($repoPath) {
    $status = [
        'github_auth' => false,
        'cron_jobs' => false,
        'disk_space' => 0,
        'git_status' => 'unknown',
        'backup_status' => 'unknown'
    ];

    // Verificar autenticação GitHub
    $ghAuth = shell_exec('gh auth status 2>&1');
    $status['github_auth'] = strpos($ghAuth, 'Logged in') !== false;

    // Verificar cron jobs
    $cronList = shell_exec('crontab -l 2>/dev/null');
    $status['cron_jobs'] = strpos($cronList, 'cron-sync-github.sh') !== false;

    // Verificar espaço em disco
    $diskUsage = shell_exec("df $repoPath | tail -1 | awk '{print \$5}' | sed 's/%//'");
    $status['disk_space'] = (int) trim($diskUsage);

    // Verificar status do Git
    $gitStatus = shell_exec("cd $repoPath && git status --porcelain 2>&1");
    $status['git_status'] = empty(trim($gitStatus)) ? 'clean' : 'modified';

    // Verificar último backup
    $backupLog = '/var/log/projeto-backup-dual.log';
    if (file_exists($backupLog)) {
        $lines = file($backupLog, FILE_IGNORE_NEW_LINES);
        $lastLine = end($lines);
        $status['backup_status'] = strpos($lastLine, 'CONCLUÍDO COM SUCESSO') !== false ? 'success' : 'warning';
    }

    return $status;
}

// Log da requisição
logAnalytics('api_request', ['action' => $action]);

try {
    switch ($action) {
        case 'overview':
            $response = [
                'stats' => getFileStats($repoPath),
                'performance' => getPerformanceMetrics($repoPath),
                'system_status' => getSystemStatus($repoPath),
                'recent_deploys' => getDeployHistory($repoPath, 5)
            ];
            break;

        case 'stats':
            $response = getFileStats($repoPath);
            break;

        case 'deploys':
            $limit = (int) ($_GET['limit'] ?? 20);
            $response = getDeployHistory($repoPath, $limit);
            break;

        case 'performance':
            $response = getPerformanceMetrics($repoPath);
            break;

        case 'logs':
            $limit = (int) ($_GET['limit'] ?? 50);
            $response = getSystemLogs($limit);
            break;

        case 'system':
            $response = getSystemStatus($repoPath);
            break;

        case 'health':
            $stats = getFileStats($repoPath);
            $system = getSystemStatus($repoPath);

            $response = [
                'status' => 'healthy',
                'checks' => [
                    'files_loaded' => $stats['total'] > 0,
                    'github_auth' => $system['github_auth'],
                    'cron_active' => $system['cron_jobs'],
                    'git_clean' => $system['git_status'] === 'clean',
                    'backup_ok' => $system['backup_status'] === 'success',
                    'disk_ok' => $system['disk_space'] < 80
                ],
                'timestamp' => date('c')
            ];

            // Determinar status geral
            $failedChecks = array_filter($response['checks'], fn($check) => !$check);
            if (count($failedChecks) > 2) {
                $response['status'] = 'critical';
            } elseif (count($failedChecks) > 0) {
                $response['status'] = 'warning';
            }
            break;

        default:
            http_response_code(400);
            $response = ['error' => 'Invalid action'];
    }

    echo json_encode($response, JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);

    logAnalytics('api_error', ['error' => $e->getMessage(), 'action' => $action]);
}
?>