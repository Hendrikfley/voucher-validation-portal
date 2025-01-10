jQuery(document).ready(function ($) {
  let qrScanner;

  // Trigger API call when QR code is scanned
  function onScanSuccess(qrCodeMessage) {
    const voucherCode = qrCodeMessage.split(":")[1]; //ToDo: Logik für Codes ohne : XXXX-XXXX-XXXX muss erkannt werden
    $("#loadingSpinner").show();

    // Call PHP backend to validate the voucher
    $.post(
      ajax_object.ajaxurl,
      {
        action: "validate_voucher",
        code: voucherCode,
      },
      function (response) {
        $("#loadingSpinner").hide();
        showPopup(voucherCode, response);
      }
    );
  }

  // Show the popup with voucher details
  function showPopup(voucherCode, response) {
    $("#popup").show();
    $("#popupCode").text(`Gutscheincode: ${voucherCode}`);
    if (response.status === "success") {
      $("#redeemButton").show();
      $("#result").text(`Gutschein gültig`);
      $("#popupMessage").text(`Gültig für: ${response.product_name}`);
      $("#redeemButton")
        .data("code", voucherCode)
        .data("product_id", response.voucher_data["processed"][0]["regel_id"])
        .data("product_name", response.product_name);
    } else {
      $("#redeemButton").hide();
      $("#result").text(`NICHT GÜLTIG`);
      $("#popupMessage").text(
        `Grund: ${response.voucher_data["reason"]}`
      );
    }

    qrScanner
      .stop()
      .then(() => {
        console.log("Scanner stopped");
      })
      .catch(err => {
        console.error("Error stopping scanner:", err);
      });
  }

  // Delegate the click event for redeemButton
  $(document).on("click", "#redeemButton", function () {
    const code = $(this).data("code");
    const product_id = $(this).data("product_id");
    const product_name = $(this).data("product_name");
    console.log("Redeem button clicked with:", code, product_id, product_name);
    redeemVoucher(code, product_id, product_name);
  });

  $("#abortButton").click(function () {
    $("#popup").hide();
    restartScanner();
  });

  // Redeem voucher by calling PHP backend
  function redeemVoucher(code, product_id, product_name) {
    $("#loadingSpinner").show();

    $.post(
      ajax_object.ajaxurl,
      {
        action: "redeem_voucher",
        code: code,
        product_id: product_id,
        product_name: product_name
      },
      function (response) {
        $("#loadingSpinner").hide();
        alert(response.message);
        if (response.status === "success") {
          $("#popup").hide();
          restartScanner();
        }
      }
    );
  }

  // Restart QR code scanner
  function restartScanner() {
    qrScanner.start({ facingMode: "environment" }, { fps: 10 }, onScanSuccess);
  }

  function setupQrCodeScanner() {
    qrScanner = new Html5Qrcode(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ true
    );
    restartScanner();
  }

  // Start the QR code scanner
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => setupQrCodeScanner())
    .catch(err => console.error("Camera permission error:", err));
});
