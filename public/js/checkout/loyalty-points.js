document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const useLoyaltyPointsCheckbox = document.getElementById('use-loyalty-points');
    const loyaltyPointsAmountDiv = document.getElementById('loyalty-points-amount');
    const loyaltyPointsToUseInput = document.getElementById('loyalty-points-to-use');
    const loyaltyDiscountPreviewDiv = document.getElementById('loyalty-discount-preview');

    if (useLoyaltyPointsCheckbox) {
        useLoyaltyPointsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                loyaltyPointsAmountDiv.style.display = 'block';
                // Calculate and display discount when checkbox is checked
                const maxPoints = parseInt(loyaltyPointsToUseInput.max);
                loyaltyPointsToUseInput.value = maxPoints;
                updateLoyaltyDiscountPreview(maxPoints);
            } else {
                loyaltyPointsAmountDiv.style.display = 'none';
                loyaltyDiscountPreviewDiv.innerHTML = '';
            }
        });
    }

    if (loyaltyPointsToUseInput) {
        loyaltyPointsToUseInput.addEventListener('input', function() {
            const points = parseInt(this.value);
            if (!isNaN(points)) {
                updateLoyaltyDiscountPreview(points);
            }
        });
    }

    // Update discount preview
    function updateLoyaltyDiscountPreview(points) {
        const discountAmount = points * 1000;
        loyaltyDiscountPreviewDiv.innerHTML = `<strong>Giảm giá:</strong> -${discountAmount.toLocaleString('vi-VN')} VND`;
    }
});
