<?php

add_shortcode("voucher-validation", "render");

function render()
{
    ob_start();
    ?>
    <script src="https://cdn.jsdelivr.net/npm/html5-qrcode/minified/html5-qrcode.min.js"></script>
    <body>
        <h1>QR Code Scanner</h1>
        <div id="reader"></div>
        <div id="loadingSpinner">Überprüfe Code ...</div>

        <div id="popup">
            <h2 id="result"></h2>
            <p id="popupCode"></p>
            <p id="popupMessage"></p>
            <button id="abortButton">Abbrechen</button>
            <button id="redeemButton">Einlösen</button>
        </div>
    </body>
    <?php
    return ob_get_clean();
}
