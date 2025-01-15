<?php

add_shortcode("voucher-validation", "render");

function render()
{
    ob_start();
    ?>
    <!-- <h1>QR Code Scanner</h1> -->
    <div id="reader"></div>
    <div id="loadingSpinner">Überprüfe Code ...</div>
    <details>
        <summary id="manualCodeToggle">Code manuell eingeben</summary>
        <form>
            <label id="label" for="code">Gib den/die Codes hier ein:</label>
            <input type="text" id="code" name="Code" />
            <button id="validateButton">Überprüfen</button>
        </form>
    </details>
    </div>
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
