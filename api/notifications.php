<?php
/**
 * Sistema de Notificações em Tempo Real via Server-Sent Events (SSE)
 * Monitora mudanças no sistema e envia notificações para o dashboard
 */

// Configurar headers para SSE
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Cache-Control');

// Desabilitar buffer de saída
if (ob_get_level()) {
    ob_end_clean();
}

// Função para enviar eventos SSE
function sendEvent($event, $data, $id = null) {
    if ($id !== null) {
        echo "id: $id\n";
    }
    echo "event: $event\n";
    echo "data: " . json_encode($data) . "\n\n";
    flush();
}

// Função para verificar mudanças no índice
function checkIndexChanges($lastModified) {
    $indexPath = '/var/www/admin.widgetvpn.xyz/assets/index.json';

    if (!file_exists($indexPath)) {
        return null;
    }

    $currentModified = filemtime($indexPath);

    if ($currentModified > $lastModified) {
        $index = json_decode(file_get_contents($indexPath), true) ?: [];

        return [
            'modified' => $currentModified,
            'stats' => [
                'total' => count($index),
                'css' => count(array_filter($index, fn($item) => $item['type'] === 'css')),
                'js' => count(array_filter($index, fn($item) => $item['type'] === 'js')),
                'size' => array_sum(array_column($index, 'size'))
            ]
        ];
    }

    return null;
}

// Função para verificar logs de deploy
function checkDeployLogs($lastCheck) {
    $deployLog = '/var/www/admin.widgetvpn.xyz/deploy.log';

    if (!file_exists($deployLog)) {
        return null;
    }

    $currentModified = filemtime($deployLog);

    if ($currentModified > $lastCheck) {
        $lines = file($deployLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $recentLines = array_slice($lines, -5);

        $notifications = [];
        foreach ($recentLines as $line) {
            if (preg_match('/\[([\d\-\s:]+)\]\s*Deploy:\s*(.+)/', $line, $matches)) {
                $notifications[] = [
                    'timestamp' => $matches[1],
                    'message' => 'Deploy realizado: ' . $matches[2],
                    'type' => 'deploy'
                ];
            }
        }

        return [
            'modified' => $currentModified,
            'notifications' => $notifications
        ];
    }

    return null;
}

// Função para verificar logs de sincronização
function checkSyncLogs($lastCheck) {
    $syncLog = '/var/log/github-sync-cron.log';

    if (!file_exists($syncLog)) {
        return null;
    }

    $currentModified = filemtime($syncLog);

    if ($currentModified > $lastCheck) {
        $lines = file($syncLog, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $lastLine = end($lines);

        if (strpos($lastLine, 'Sincronização automática concluída com sucesso') !== false) {
            return [
                'modified' => $currentModified,
                'notification' => [
                    'message' => 'Sincronização GitHub concluída com sucesso',
                    'type' => 'sync_success',
                    'timestamp' => date('c')
                ]
            ];
        } elseif (strpos($lastLine, 'Falha na sincronização') !== false) {
            return [
                'modified' => $currentModified,
                'notification' => [
                    'message' => 'Falha na sincronização GitHub',
                    'type' => 'sync_error',
                    'timestamp' => date('c')
                ]
            ];
        }
    }

    return null;
}

// Função para monitorar sistema
function checkSystemHealth() {
    $status = [
        'timestamp' => time(),
        'healthy' => true,
        'issues' => []
    ];

    // Verificar espaço em disco
    $diskUsage = (int) trim(shell_exec("df /var/www | tail -1 | awk '{print \$5}' | sed 's/%//'"));
    if ($diskUsage > 90) {
        $status['healthy'] = false;
        $status['issues'][] = [
            'type' => 'disk_space',
            'message' => "Espaço em disco crítico: {$diskUsage}%",
            'severity' => 'critical'
        ];
    } elseif ($diskUsage > 80) {
        $status['issues'][] = [
            'type' => 'disk_space',
            'message' => "Espaço em disco alto: {$diskUsage}%",
            'severity' => 'warning'
        ];
    }

    // Verificar autenticação GitHub
    $ghAuth = shell_exec('gh auth status 2>&1');
    if (strpos($ghAuth, 'Logged in') === false) {
        $status['healthy'] = false;
        $status['issues'][] = [
            'type' => 'github_auth',
            'message' => 'Falha na autenticação GitHub',
            'severity' => 'critical'
        ];
    }

    return $status;
}

// Inicializar timestamps
$lastIndexCheck = time();
$lastDeployCheck = time();
$lastSyncCheck = time();
$lastHealthCheck = time();
$eventId = 1;

// Enviar evento inicial
sendEvent('connected', [
    'message' => 'Conexão estabelecida com sucesso',
    'timestamp' => date('c')
], $eventId++);

// Loop principal de monitoramento
$startTime = time();
$maxRunTime = 300; // 5 minutos máximo

while (time() - $startTime < $maxRunTime) {
    // Verificar mudanças no índice de arquivos
    $indexChanges = checkIndexChanges($lastIndexCheck);
    if ($indexChanges) {
        sendEvent('files_updated', [
            'message' => 'Arquivos atualizados',
            'stats' => $indexChanges['stats'],
            'timestamp' => date('c')
        ], $eventId++);

        $lastIndexCheck = $indexChanges['modified'];
    }

    // Verificar logs de deploy
    $deployChanges = checkDeployLogs($lastDeployCheck);
    if ($deployChanges) {
        foreach ($deployChanges['notifications'] as $notification) {
            sendEvent('deploy_notification', $notification, $eventId++);
        }
        $lastDeployCheck = $deployChanges['modified'];
    }

    // Verificar logs de sincronização
    $syncChanges = checkSyncLogs($lastSyncCheck);
    if ($syncChanges) {
        sendEvent('sync_notification', $syncChanges['notification'], $eventId++);
        $lastSyncCheck = $syncChanges['modified'];
    }

    // Verificar saúde do sistema a cada 30 segundos
    if (time() - $lastHealthCheck >= 30) {
        $health = checkSystemHealth();

        if (!empty($health['issues'])) {
            foreach ($health['issues'] as $issue) {
                sendEvent('system_alert', $issue, $eventId++);
            }
        }

        // Enviar heartbeat
        sendEvent('heartbeat', [
            'timestamp' => date('c'),
            'uptime' => time() - $startTime,
            'healthy' => $health['healthy']
        ], $eventId++);

        $lastHealthCheck = time();
    }

    // Aguardar 2 segundos antes da próxima verificação
    sleep(2);

    // Verificar se o cliente ainda está conectado
    if (connection_aborted()) {
        break;
    }
}

// Enviar evento de desconexão
sendEvent('disconnected', [
    'message' => 'Conexão encerrada',
    'timestamp' => date('c')
], $eventId++);
?>