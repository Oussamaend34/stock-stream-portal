package com.ensah.gestionStock.mapper;

import com.ensah.gestionStock.DTO.TransactionDetailsDTO;
import com.ensah.gestionStock.entity.TransactionDetails;
import org.springframework.stereotype.Service;

import java.util.function.Function;

@Service
public class TransactionDetailsMapper implements Function<TransactionDetails, TransactionDetailsDTO> {
    @Override
    public TransactionDetailsDTO apply(TransactionDetails transactionDetails) {
        return TransactionDetailsDTO.builder()
                .id(transactionDetails.getId())
                .productId(transactionDetails.getProduct().getId())
                .productName(transactionDetails.getProduct().getName())
                .unitId(transactionDetails.getUnit().getId())
                .unit(transactionDetails.getUnit().getAbbreviation())
                .quantity(transactionDetails.getQuantity())
                .build();
    }
} 