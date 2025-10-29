<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$CREDENTIALS = [
    'username' => 'GuilhermeCampos',
    'password' => '*Gui84871431'
];

function sendResponse($success, $message = '', $data = []) {
    echo json_encode(array_merge([
        'success' => $success,
        'message' => $message
    ], $data));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['username']) || !isset($input['password'])) {
        sendResponse(false, 'Usuário e senha são obrigatórios.');
    }

    $username = trim($input['username']);
    $password = $input['password'];

    if ($username === $CREDENTIALS['username'] && $password === $CREDENTIALS['password']) {
        $_SESSION['authenticated'] = true;
        $_SESSION['username'] = $username;
        $_SESSION['login_time'] = time();

        sendResponse(true, 'Login realizado com sucesso.', [
            'username' => $username
        ]);
    } else {
        sleep(1);
        sendResponse(false, 'Usuário ou senha incorretos.');
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'check') {
        if (isset($_SESSION['authenticated']) && $_SESSION['authenticated'] === true) {
            sendResponse(true, 'Autenticado', [
                'username' => $_SESSION['username'] ?? '',
                'login_time' => $_SESSION['login_time'] ?? 0
            ]);
        } else {
            sendResponse(false, 'Não autenticado');
        }
    } elseif ($action === 'logout') {
        session_destroy();
        sendResponse(true, 'Logout realizado com sucesso.');
    }
}

sendResponse(false, 'Método não suportado.');
