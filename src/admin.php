<?php

add_action("admin_menu", "add_menu");
add_action("admin_init", "add_capability");

function add_menu() {
    add_menu_page(
        "Voucher Validation",               // page title
        "Voucher Validation",               // menu title
        "manage_my_plugin",        // custom capability
        MY_PLUGIN_SLUG,            // menu slug
        "render_admin_page",       // callback
        "dashicons-admin-generic", // icon url
        6                          // position
    );
}

function add_capability() {
    $roles = array("administrator", "editor");

    foreach ($roles as $role) {
        $role = get_role($role);
        $role->add_cap("manage_my_plugin");
    }
}

function render_admin_page() {
    // admin page code
    ?>
        <div class="wrap">
            <h2>Hey Du!</h2>
            <p>Ja du! Schön, dass du da bist :)</p>
        </div>
    <?php
}
