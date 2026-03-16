package com.trade.service.batch;

import org.springframework.stereotype.Component;

@Component
public class TradeFileProcessor {

    public void processRecord(String record) {

        System.out.println("Processing record: " + record);
    }
}