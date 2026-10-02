package com.example.quiz.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
@Slf4j
public class DataSourceConfig {

    @Value("${spring.datasource.url}")
    private String configuredUrl;

    @Value("${spring.datasource.username:}")
    private String configuredUsername;

    @Value("${spring.datasource.password:}")
    private String configuredPassword;

    @Value("${spring.datasource.driver-class-name:}")
    private String configuredDriver;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();

        String rawUrl = configuredUrl != null ? configuredUrl.trim() : "";

        // Check if rawUrl is a Postgres cloud connection URI (e.g., Neon Tech, Render)
        if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
            log.info("Detected cloud PostgreSQL URI. Converting to JDBC format for HikariCP...");
            try {
                // If it starts with postgres://, replace scheme for URI parsing
                String uriString = rawUrl.startsWith("postgres://")
                        ? "postgresql://" + rawUrl.substring("postgres://".length())
                        : rawUrl;

                URI uri = new URI(uriString);

                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                String path = uri.getPath(); // e.g. /neondb
                String query = uri.getQuery();

                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path;
                if (query != null && !query.isBlank()) {
                    jdbcUrl += "?" + query;
                } else {
                    jdbcUrl += "?sslmode=require";
                }

                String username = configuredUsername;
                String password = configuredPassword;

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":", 2);
                    username = userInfo[0];
                    if (userInfo.length > 1) {
                        password = userInfo[1];
                    }
                }

                String safeUrlForLogging = jdbcUrl.contains("?") ? jdbcUrl.substring(0, jdbcUrl.indexOf("?")) : jdbcUrl;
                log.info("Configured JDBC URL: {} (user: {})", safeUrlForLogging, username);
                config.setJdbcUrl(jdbcUrl);
                config.setUsername(username);
                config.setPassword(password);
                config.setDriverClassName("org.postgresql.Driver");

            } catch (Exception e) {
                log.error("Failed to parse PostgreSQL URI: {}. Falling back to default properties.", e.getMessage());
                config.setJdbcUrl(rawUrl);
                config.setUsername(configuredUsername);
                config.setPassword(configuredPassword);
                if (configuredDriver != null && !configuredDriver.isBlank()) {
                    config.setDriverClassName(configuredDriver);
                }
            }
        } else {
            // Standard JDBC URL (e.g. H2 or standard jdbc:postgresql://)
            config.setJdbcUrl(rawUrl);
            config.setUsername(configuredUsername);
            config.setPassword(configuredPassword);
            if (configuredDriver != null && !configuredDriver.isBlank()) {
                config.setDriverClassName(configuredDriver);
            }
        }

        // Hikari pool optimizations
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(2);
        config.setIdleTimeout(30000);
        config.setMaxLifetime(1800000);
        config.setConnectionTimeout(20000);

        return new HikariDataSource(config);
    }
}
