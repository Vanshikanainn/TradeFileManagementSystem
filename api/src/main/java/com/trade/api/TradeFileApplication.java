package com.trade.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.trade")
@EnableJpaRepositories(basePackages = "com.trade.dao.repository")
@EntityScan(basePackages = "com.trade.model.entity")
public class TradeFileApplication {

    public static void main(String[] args) {
        SpringApplication.run(TradeFileApplication.class, args);
    }

}
