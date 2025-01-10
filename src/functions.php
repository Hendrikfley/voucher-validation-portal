<?php

function handle_api_control($formatted_message)
{
    $regel_ids = [15, 18, 11, 4, 21, 24, 27, 14, 30, 33, 36];
    $all_products = array_map(function ($id) {
        return ['arrangementsregel_id' => $id, 'aantal' => 1];
    }, $regel_ids);

    $api_url = 'https://bergische-erlebniswelten.recras.nl/api2/onlineboeking/controleervoucher';
    $api_headers = [
        'Content-Type' => 'application/json',
    ];

    $payload = [
        'arrangement_id' => 1,
        'producten' => $all_products,
        'datum' => get_tomorrow_midnight(),
        'vouchers' => [$formatted_message],
    ];

    // Perform API call using WordPress HTTP API
    $response = wp_remote_post($api_url, [
        'method' => 'POST',
        'body' => json_encode($payload),
        'headers' => $api_headers,
    ]);

    // Handle response
    if (is_wp_error($response)) {
        return 'Error: ' . $response->get_error_message();
    }

    $data = json_decode(wp_remote_retrieve_body($response), true);
    return handle_api_control_response($data, $formatted_message);
}


function handle_api_control_response($data, $code)
{
    $voucher_key = key($data);
    $voucher_data = $data[$voucher_key];
    $product_id = $voucher_data['processed'][0]['product_id']; // ToDo: Error undefined array key
    // Fetch product details from a predefined list or database
    $products = [
        16 => 'Auf Röntgens Spuren',
        8 => 'Baggerfahren',
        4 => 'Ballonfahrt',
        1 => 'Barista-Kurs',
        17 => 'Kajaktour',
        19 => 'Kluterthöhle',
        6 => 'Messerschmiedekurs',
        22 => 'Kinderbaggerfahren',
        25 => 'Testprodukt',
    ];
    $product_name = isset($products[$product_id]) ? $products[$product_id] : 'Unknown product';

    if ($voucher_data['valid']) {

        return [
            'status' => 'success',
            'message' => "Voucher valid for: $product_name",
            'product_name' => $product_name,
            'voucher_data' => $voucher_data
        ];
    } else {
        return [
            'status' => 'error',
            'message' => "Voucher invalid for: $product_name",
            'product_name' => $product_name,
            'voucher_data' => $voucher_data
        ];
    }
}

function redeem_voucher($code, $product_id, $product_name)
{

    // Same structure for redeeming voucher
    $regel_ids = [15, 18, 11, 4, 21, 24, 27, 14, 30, 33, 36];
    $all_products = array_map(function ($id) {
        return ['arrangementsregel_id' => $id, 'aantal' => 0];
    }, $regel_ids);

    // Find the product to redeem and set its amount to 1
    $product_to_redeem = null;
    foreach ($all_products as &$arr) {
        if ($arr['arrangementsregel_id'] == $product_id) { //FEHLER!""
            $arr['aantal'] = 1;  // Set the selected product's amount to 1
            $product_to_redeem = $arr;
            break;
        }
    }

    $api_url = 'https://bergische-erlebniswelten.recras.nl/api2/onlineboeking/reserveer';
    $payload = [
        'arrangement_id' => 1,
        'producten' => $all_products,
        'begin' => get_tomorrow_midnight(),
        'betaalmethode' => 'mollie',
        'vouchers' => [$code],
        'stuur_bevestiging_email' => true,
        'contactformulier' => [
            'contactpersoon.voornaam' => 'Gutschein eingelöst',
            'contactpersoon.achternaam' => $product_name,
            'contactpersoon.email1' => 'eingeloest@bergische-erlebniswelten.de',
            'contactpersoon.telefoon1' => '012345678910',
            'contactpersoon.adres' => 'Muehlenberg 49-51',
            'contactpersoon.postcode' => '42349',
            'contactpersoon.plaats' => 'Wuppertal',
        ],
    ];

    // Make API call
    $response = wp_remote_post($api_url, [
        'method' => 'POST',
        'body' => json_encode($payload),
        'headers' => [
            'Content-Type' => 'application/json',
        ],
    ]);

    if (is_wp_error($response)) {
        return 'Error: ' . $response->get_error_message();
    }

    $data = json_decode(wp_remote_retrieve_body($response), true);

    

    log_to_ninox($product_name, $code);

    return [
        'status' => 'success',
        'message' => 'Gutschein eingelöst!',
        'data' => $data,
    ];
}


function log_to_ninox($product_name, $code) {
    // Validate required parameters
    // if (empty($code) || empty($product['description'])) {
    if (empty($code) || empty($product_name)) {
        error_log('Missing required parameters for log_to_ninox');
        return false;
    }

    // API URL check
    if (!defined('NINOX_API_URL')) {
        error_log('NINOX_API_URL constant is not defined');
        return false;
    }
    $api_log_url = NINOX_API_URL;

    // API Key check
    if (!defined('NINOX_API_KEY')) {
        error_log('NINOX_API_KEY constant is not defined');
        return false;
    }
    $api_key = NINOX_API_KEY;

    $api_headers = [
        'Content-Type' => 'application/json',
        'Authorization' => 'Bearer ' . $api_key,
    ];

    $payload = [
        'fields' => [
            'Code' => $code,
            'Produkt' => &$product_name
        ],
    ];

    // Send to Ninox
    $response = wp_remote_post($api_log_url, [
        'method' => 'POST',
        'body' => json_encode($payload),
        'headers' => $api_headers,
    ]);

    if (is_wp_error($response)) {
        error_log('Error logging to Ninox: ' . $response->get_error_message());
        return false;
    }

    $response_code = wp_remote_retrieve_response_code($response);
    if ($response_code !== 200) {
        error_log('Ninox API returned non-200 status code: ' . $response_code);
        return false;
    }

    return true;
}
function get_tomorrow_midnight()
{
    $tomorrow = new DateTime('tomorrow');
    return $tomorrow->format('Y-m-d\T00:00:00');
}



function validate_voucher_callback()
{
    $code = sanitize_text_field($_POST['code']);
    $response = handle_api_control($code);
    wp_send_json($response);
}

function redeem_voucher_callback()
{
    $code = sanitize_text_field($_POST['code']);
    $product_id = sanitize_text_field($_POST['product_id']);
    $product_name = sanitize_text_field($_POST['product_name']);
    $response = redeem_voucher($code, $product_id, $product_name);
    wp_send_json($response);
}
