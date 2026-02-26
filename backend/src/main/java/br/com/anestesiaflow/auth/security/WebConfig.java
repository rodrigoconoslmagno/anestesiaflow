package br.com.anestesiaflow.auth.security;

import br.com.anestesiaflow.publicview.BasePublicController;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.HandlerTypePredicate;
import org.springframework.web.servlet.config.annotation.PathMatchConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        // Adiciona o prefixo /api/public automaticamente para qualquer classe 
        // que implemente BasePublicController
        configurer.addPathPrefix("/api/public", 
        	HandlerTypePredicate.forAssignableType(BasePublicController.class));
    }
}