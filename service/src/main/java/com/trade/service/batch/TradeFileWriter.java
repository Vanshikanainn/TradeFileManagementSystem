package com.trade.service.batch;

import org.springframework.stereotype.Component;

@Component
public class TradeFileWriter {

    public void writeRecord(String record) {

        System.out.println("Writing record: " + record);
    }
}