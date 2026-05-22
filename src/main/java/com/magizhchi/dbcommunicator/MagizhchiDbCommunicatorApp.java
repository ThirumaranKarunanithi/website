package com.magizhchi.dbcommunicator;

import com.magizhchi.dbcommunicator.auth.AuthProperties;
import com.magizhchi.dbcommunicator.config.ConnectionDefaults;
import com.magizhchi.dbcommunicator.config.OllamaProperties;
import com.magizhchi.dbcommunicator.config.QueryProperties;
import javafx.application.Application;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({OllamaProperties.class, QueryProperties.class,
        ConnectionDefaults.class, AuthProperties.class})
public class MagizhchiDbCommunicatorApp {

    public static void main(String[] args) {
        Application.launch(JavaFxApp.class, args);
    }
}
