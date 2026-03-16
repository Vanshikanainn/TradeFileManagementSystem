package com.trade.service.batch;

import org.springframework.stereotype.Component;

@Component
public class TradeFileItemReader {

    public void readFile(String filename) {

        System.out.println("Reading trade file: " + filename);
    }
}