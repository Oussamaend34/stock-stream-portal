package com.ensah.gestionStock.DTO;

import lombok.Builder;

@Builder
public record TransactionDetailsDTO(
        Long id,
        Long productId,
        String productName,
        Long unitId,
        String unit,
        Integer quantity
) {
} 