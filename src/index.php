<?php
/**
 * Plugin Name: Voucher Validation
 * Plugin URI: http://www.deepwood.de/
 * Description: Developed to allow voucher codes to be validated, redeemed and logged to a Database
 * Version: 0.5
 * Author: Hendrik 
 * Author URI: https://www.deepwood.de/
 **/

// global variables for your plugin
define("MY_PLUGIN_PATH", plugin_dir_path(__FILE__));
define("MY_PLUGIN_URL", plugin_dir_url(__FILE__));
define("MY_PLUGIN_SLUG", "my-plugin");

require_once MY_PLUGIN_PATH . "admin.php";
require_once MY_PLUGIN_PATH . "frontend.php";
require_once MY_PLUGIN_PATH . "functions.php";

register_activation_hook(__FILE__, "setup_db");

function setup_db()
{
    // database setup code
}

function get_url($file)
{
    return MY_PLUGIN_URL . $file;
}

function get_path($file)
{
    return MY_PLUGIN_PATH . $file;
}

function enqueue_my_styles()
{
    wp_enqueue_style("my-style", get_url("style.css"), array(), filemtime(get_path("style.css")));
}

function enqueue_my_scripts()
{
    global $post;

    // Check if the current post contains the shortcode
    if (is_page('erlebnispartnerportal')) {
        wp_enqueue_script("my-script", get_url("script.js"), array("jquery"), filemtime(get_path("script.js")));
        wp_enqueue_script("html5-qrcode", MY_PLUGIN_URL . "js/html5-qrcode.min.js", array("jquery"), null, false);
        wp_localize_script("my-script", "ajax_object", array(
            "ajaxurl" => admin_url("admin-ajax.php"),
        ));
    }
}


function enqueue_my_blocks()
{
    wp_enqueue_script(
        "my-block",
        get_url("block.js"),
        array("wp-blocks", "wp-element", "wp-editor"),
        filemtime(get_path("block.js"))
    );
}

add_action("wp_enqueue_scripts", "enqueue_my_styles");
add_action("wp_enqueue_scripts", "enqueue_my_scripts");

add_action("enqueue_block_editor_assets", "enqueue_my_blocks");

add_action('wp_ajax_validate_voucher', 'validate_voucher_callback');
add_action('wp_ajax_nopriv_validate_voucher', 'validate_voucher_callback');
add_action('wp_ajax_redeem_voucher', 'redeem_voucher_callback');
add_action('wp_ajax_nopriv_redeem_voucher', 'redeem_voucher_callback');
