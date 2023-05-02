<?php

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('HTTP/1.1 405 Method Not Allowed');
  header('Allow: POST');
  echo 'This endpoint only accepts HTTP POST requests';
  exit;
}

// Set CORS headers to allow requests from any origin
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Get the request data from the client-side
$request_data = file_get_contents('php://input');

// Send the request to the target URL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $request_data->url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($request_data->data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

// Send the response back to the client-side
echo $response;

// Validate and store the One Tap Sign-in token
$token = file_get_contents('php://input');
// TODO: Validate the token and store it in a session or database
?>
