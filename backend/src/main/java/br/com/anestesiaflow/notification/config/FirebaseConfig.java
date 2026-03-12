package br.com.anestesiaflow.notification.config;

import java.io.InputStream;

import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

@Configuration
public class FirebaseConfig {
	
	@Value("${app.firebase.config-path}")
    private String configPath;

    private final ResourceLoader resourceLoader;

    public FirebaseConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    @PostConstruct
    public void initialize() {
        try {
            
//        	if (configPath != null && !configPath.isEmpty()) {        	
	            Resource resource = resourceLoader.getResource(configPath);
	            InputStream serviceAccount = resource.getInputStream();
	
	            FirebaseOptions options = FirebaseOptions.builder()
	                    .setCredentials(GoogleCredentials.fromStream(serviceAccount))
	                    .build();
	
	            if (FirebaseApp.getApps().isEmpty()) {
	                FirebaseApp.initializeApp(options);
	                System.out.print("Firebase inicializado com sucesso!");
	            }
//        	}
        } catch (Exception e) {
            System.out.println("FALHA CRÍTICA: Não foi possível inicializar o Firebase. As notificações não funcionarão. Erro: {}" + e.getMessage());
        }
    }
}
