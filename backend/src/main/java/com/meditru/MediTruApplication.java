package com.meditru;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class MediTruApplication {

    public static void main(String[] args) {
        Dotenv dotenv = Dotenv.configure()
            .directory(System.getProperty("user.dir"))
            .filename(".env")
            .ignoreIfMissing()
            .load();
        dotenv.entries().forEach(entry ->
            System.setProperty(entry.getKey(), entry.getValue())
        );
        SpringApplication.run(MediTruApplication.class, args);
    }
}
