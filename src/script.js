jQuery(document).ready(function ($) {
  if (!document.getElementById("reader")) {
    return; // Exit early if the scanner element isn't present
  }

  // Input formatting logic
  $("#code").on("input", function(e) {
    let input = $(this).val();
    
    // Remove all non-alphanumeric characters except hyphens
    input = input.replace(/[^A-Z0-9-]/gi, '');
    
    // Convert to uppercase
    input = input.toUpperCase();
    
    // Remove any existing hyphens
    input = input.replace(/-/g, '');
    
    // Add hyphens after every 5 characters
    let formatted = '';
    for (let i = 0; i < input.length; i++) {
        if (i > 0 && i % 5 === 0 && i <= 10) {
            formatted += '-';
        }
        formatted += input[i];
    }
    
    // Limit to maximum length (17 characters: 15 alphanumeric + 2 hyphens)
    formatted = formatted.slice(0, 17);
    
    // Update the input value
    $(this).val(formatted);
});

// Validation button click handler
$(document).on("click", "#validateButton", function(e) {
    e.preventDefault();
    
    const voucherCode = $("#code").val().trim();
    const codePattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    
    // Check if input is empty
    if (!voucherCode) {
        alert("Bitte geben Sie einen Code ein.");
        return;
    }
    
    // Validate code format
    if (!codePattern.test(voucherCode)) {
        alert("Ungültiges Code-Format. Bitte geben Sie einen Code im Format XXXXX-XXXXX-XXXXX ein.");
        return;
    }
    
    // Show loading spinner
    $("#loadingSpinner").show();
    
    try {
        $.post(
            ajax_object.ajaxurl,
            {
                action: "validate_voucher",
                code: voucherCode,
            },
            function(response) {
                $("#loadingSpinner").hide();
                showPopup(voucherCode, response);
            }
        ).fail(function(xhr, status, error) {
            $("#loadingSpinner").hide();
            alert("Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.");
            console.error("AJAX error:", error);
        });
        
    } catch (error) {
        $("#loadingSpinner").hide();
        alert("Ungültiges Gutschein-Format. Bitte versuchen Sie es erneut.");
        console.error("Code parsing error:", error);
        if (typeof restartScanner === 'function') {
            restartScanner();
        }
    }
});

  let qrScanner;


  function parseVoucherCode(qrCodeMessage) {
    if (qrCodeMessage.includes(":")) {
      return qrCodeMessage.split(":")[1];
    }

    // Check for XXXXX-XXXXX-XXXXX format
    const codePattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;
    if (codePattern.test(qrCodeMessage)) {
      return qrCodeMessage;
    }

    throw new Error("Invalid voucher code format");
  }

  function onScanSuccess(qrCodeMessage) {
    try {
      const voucherCode = parseVoucherCode(qrCodeMessage);
      $("#loadingSpinner").show();
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
    } catch (error) {
      alert("Ungültiges Gutschein-Format. Bitte versuchen Sie es erneut.");
      console.error("Code parsing error:", error);
      restartScanner();
    }
  }

  // Show the popup with voucher details
  function showPopup(voucherCode, response) {
    $("#popup").show();
    $("#scannerStoppedInfo").show();
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
      $("#popupMessage").text(`Grund: ${response.voucher_data["reason"]}`);
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
        product_name: product_name,
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
    $("#scannerStoppedInfo").hide();
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
