<?php

add_shortcode("voucher-validation", "render");

function render()
{
    // add your frontend code that renders your shortcode here
    ob_start();
    ?>
<script src="https://cdn.jsdelivr.net/npm/html5-qrcode/minified/html5-qrcode.min.js"></script>
    <body>
        <h1>QR Code Scanner</h1>
        <div id="reader"></div>
        <div id="loadingSpinner">Überprüfe Code ...</div>

        <!-- Popup for valid voucher -->
        <div id="popup">
            <h2 id="popupMessage">Gutschein gültig</h2>
            <p id="popupCode"></p>
            <p id="popupProduct"></p>
            <button id="abortButton">Abbrechen</button>
            <button id="redeemButton">Einlösen</button>
        </div>
    </body>
    <?php
    return ob_get_clean();
}
