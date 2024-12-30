jQuery(document).ready(function($) {    
    // add custom JS code
    const regel_ids = [15, 18, 11, 4, 21, 24, 27, 14, 30, 33, 36];
    var allProducts = regel_ids.map(id => ({ arrangementsregel_id: id, aantal: 1 }));
    const products = [
        { id: 16, description: "Auf Röntgens Spuren", arrangement_regel_id: 15 },
        { id: 8, description: "Baggerfahren", arrangement_regel_id: 18 },
        { id: 4, description: "Ballonfahrt", arrangement_regel_id: 11 },
        { id: 1, description: "Barista-Kurs", arrangement_regel_id: 4 },
        { id: 17, description: "Kajaktour", arrangement_regel_id: 24 },
        { id: 19, description: "Kluterthöhle", arrangement_regel_id: 27 },
        { id: 6, description: "Messerschmiedekurs", arrangement_regel_id: 14 },
        { id: 22, description: "Kinderbaggerfahren", arrangement_regel_id: 33 },
        { id: 25, description: "Testprodukt", arrangement_regel_id: 36 },
    ];

    const apiControlUrl = 'https://bergische-erlebniswelten.recras.nl/api2/onlineboeking/controleervoucher';
    const apiRedeemUrl = 'https://bergische-erlebniswelten.recras.nl/api2/onlineboeking/reserveer';
    const apiLogUrl = 'https://api.ninox.com/v1/teams/bi5BjzqRbRRHhvaPK/databases/tmjn9x1ejukj/tables/QC/records/';
    const apiHeadersRecras = {
        'Content-Type': 'application/json',

    };

   

    const apiHeadersNinox = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' 
    };


    let qrScanner;

    function onScanSuccess(qrCodeMessage) {
        const formattedMessage = qrCodeMessage.split(':')[1];
        document.getElementById('loadingSpinner').style.display = 'block';

        const payload = {
            arrangement_id: 1,
            producten: allProducts,
            datum: new Date().toISOString().split('T')[0],
            vouchers: [formattedMessage]
        };

        fetch(apiControlUrl, {
            method: 'POST',
            headers: apiHeadersRecras,
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                document.getElementById('loadingSpinner').style.display = 'none';
                handleApiControlResponse(data, formattedMessage);
            })
            .catch(error => {
                console.error('API call error:', error);
                document.getElementById('loadingSpinner').style.display = 'none';
            });
    }

    function handleApiControlResponse(data, code) {
        const voucherKey = Object.keys(data)[0];
        const voucherData = data[voucherKey];

        if (voucherData.valid) {
            const productId = voucherData.processed[0].product_id;
            const product = products.find(p => p.id === productId);
            showPopup(code, product);
        } else {
            alert(`Voucher invalid: ${voucherData.reason}`);
        }
    }

    function handleApiRedeemResponse(data) {
        alert(`Booking successful! Booking ID: ${data.boeking_id}, Customer ID: ${data.klant_id}`);
        console.log("API Redeem Response:", data);
    }

    function showPopup(code, product) {
        const popup = document.getElementById('popup');
        popup.style.display = 'block';
        document.getElementById('popupCode').innerText = `Gutscheincode: ${code}`;
        document.getElementById('popupProduct').innerText = `Gültig für: ${product.description}`;

        qrScanner.stop().then(() => {
            console.log("Scanner stopped");
        }).catch(err => {
            console.error("Error stopping scanner:", err);
        });

        document.getElementById('abortButton').onclick = function () {
            popup.style.display = 'none';
            restartScanner();
        };

        document.getElementById('redeemButton').onclick = function () {
            redeemVoucher(code, product);
        };
    }

    function redeemVoucher(code, product) {
        console.log('Redeem function triggered');
        document.getElementById('loadingSpinner').style.display = 'block';

        // Create a products array with all amounts set to 0
        const allProducts = regel_ids.map(id => ({ arrangementsregel_id: id, aantal: 0 }));

        // Find the matching product and set its amount to 1
        const productToRedeem = allProducts.find(arr => arr.arrangementsregel_id === product.arrangement_regel_id);
        if (productToRedeem) {
            productToRedeem.aantal = 1; // Set the amount for the selected product
        }

        const payload = {
            arrangement_id: 1,
            producten: allProducts, // Only the selected product will have a non-zero amount
            begin: getTomorrowMidnight(),
            betaalmethode: "mollie",
            vouchers: [code],
            stuur_bevestiging_email: true,
            contactformulier: {
                "contactpersoon.voornaam": "Gutschein eingelöst",
                "contactpersoon.achternaam": `${product.description}`,
                "contactpersoon.email1": "eingeloest@bergische-erlebniswelten.de",
                "contactpersoon.telefoon1": "012345678910",
                "contactpersoon.adres": "Muehlenberg 49-51",
                "contactpersoon.postcode": "42349",
                "contactpersoon.plaats": "Wuppertal"
            }
        };

        fetch(apiRedeemUrl, {
            method: 'POST',
            headers: apiHeadersRecras,
            body: JSON.stringify(payload)
        })
            .then(response => {
                document.getElementById('loadingSpinner').style.display = 'none';

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                return response.json();
            })
            .then(data => {
                handleApiRedeemResponse(data);
                logToNinox(data, code, product);
                document.getElementById('popup').style.display = 'none';
                restartScanner();
            })
            .catch(error => {
                console.error('API redemption call error:', error);
                alert('Fehler beim Einlösen des Gutscheins');
                document.getElementById('popup').style.display = 'none';
                restartScanner();
            });
    }

    function logToNinox(data, code, product) {
        console.log("Logging to Ninox..."); // Add a log to track function flow
        const ninoxPayload = {
            fields: {
                "Code": "2"
            }
        };
        fetch(apiLogUrl, {
            method: 'POST',
            headers: apiHeadersNinox,
            body: JSON.stringify(ninoxPayload)
        })
            .then(response => {
                console.log('Ninox response status:', response.status); // Log response status
                return response.json(); // Ensure we read the body of the response
            })
            .then(responseData => {
                console.log('Ninox Log Response:', responseData); // Log Ninox API response
                if (!responseData) {
                    throw new Error('No response data from Ninox');
                }
            })
            .catch(error => {
                console.error('Error logging to Ninox:', error); // Detailed error logging
            });
    }


    function getTomorrowMidnight() {
        let today = new Date();
        let tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);
        let tomorrowMidnight = tomorrow.toISOString().split('T')[0] + "T00:00:00"
        return tomorrowMidnight
    }

    function restartScanner() {
        qrScanner.start(
            { facingMode: "environment" },
            { fps: 10 },
            onScanSuccess,
            error => {
                // Suppress the error log if the error is related to QR code parsing
                if (error.includes("No MultiFormat Readers")) {
                    // You can log or handle specific errors if needed, or simply ignore this case
                    return;
                }
                // Optionally, you can log other errors or ignore them entirely
                console.error('QR Code scanning error:', error);
            }
        ).catch(err => {
            console.error('Error restarting QR code scanner:', err);
        });
    }

    function setupQrCodeScanner() {
        qrScanner = new Html5Qrcode("reader");
        qrScanner.start(
            { facingMode: "environment" },
            { fps: 10 },
            onScanSuccess,
            error => {
                // Suppress the error log if the error is related to QR code parsing
                if (error.includes("No MultiFormat Readers")) {
                    // You can log or handle specific errors if needed, or simply ignore this case
                    return;
                }
                // Optionally, you can log other errors or ignore them entirely
                console.error('QR Code scanning error:', error);
            }
        ).catch(err => {
            console.error('Error initializing QR code scanner:', err);
        });
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => setupQrCodeScanner())
        .catch(err => console.error('Camera permission error:', err));
});
